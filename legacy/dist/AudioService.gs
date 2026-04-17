var AudioService = (function () {
  function uploadAndTranscribe(payload, userContext) {
    Utils.requireFields(payload, ['fileName', 'mimeType', 'base64']);
    var file = DriveService.saveBase64File('AUDIOS', payload.fileName, payload.mimeType, payload.base64);
    var transcript = 'Transcripcion deshabilitada. Activa ENABLE_SPEECH_TO_TEXT para procesar audio.';
    var transcriptionStatus = 'PENDING';
    if (AppConfig.getAppInfo().enableSpeechToText) {
      try {
        transcript = transcribeDriveAudio_(file.id, payload.mimeType);
        transcriptionStatus = 'COMPLETED';
      } catch (error) {
        transcript = 'No fue posible transcribir automaticamente: ' + error.message;
        transcriptionStatus = 'ERROR';
      }
    }
    var repo = new BaseRepository(APP_CONSTANTS.SHEETS.AUDIOS);
    var saved = repo.insert({
      proyectoId: payload.proyectoId || '',
      driveFileId: file.id,
      nombreArchivo: file.name,
      mimeType: file.mimeType,
      tamano: file.size,
      estadoTranscripcion: transcriptionStatus,
      transcriptIdExt: '',
      texto: transcript
    });
    AuditLogger.log('Audio', saved.id, 'CREATE', saved, userContext.email);
    return Object.assign({}, saved, { fileUrl: file.url });
  }

  function generateMinuteFromAudio(payload, userContext) {
    Utils.requireFields(payload, ['audioId', 'nombreReunion']);
    var repo = new BaseRepository(APP_CONSTANTS.SHEETS.AUDIOS);
    var audio = repo.findById(payload.audioId);
    if (!audio) throw new Error('Audio no encontrado.');

    var extracted = extractMeetingArtifacts_(audio.texto || '');
    var minuteDoc = DocumentService.createMinuteDoc({
      nombreReunion: payload.nombreReunion,
      fechaReunion: payload.fechaReunion || Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT),
      participantes: payload.participantes || [],
      resumen: extracted.summary,
      acuerdos: extracted.agreements,
      tareas: extracted.tasks,
      riesgos: extracted.risks
    }, userContext);

    var minuteRepo = new BaseRepository(APP_CONSTANTS.SHEETS.MINUTES);
    var documentRepo = new BaseRepository(APP_CONSTANTS.SHEETS.DOCUMENTS);
    var minute = minuteRepo.insert({
      proyectoId: payload.proyectoId || audio.proyectoId || '',
      audioId: audio.id,
      nombreReunion: payload.nombreReunion,
      fechaReunion: payload.fechaReunion || Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT),
      participantes: (payload.participantes || []).join(', '),
      resumen: extracted.summary,
      acuerdos: extracted.agreements.join('\n'),
      tareasJson: Utils.stringifyJson(extracted.tasks),
      docId: minuteDoc.id
    });

    documentRepo.insert({
      tipo: 'MINUTA',
      entidadOrigen: 'Audio',
      entidadId: audio.id,
      driveFileId: minuteDoc.id,
      nombre: minuteDoc.name,
      version: '1.0',
      generadoPor: userContext.email
    });

    extracted.tasks.forEach(function (task) {
      if (payload.proyectoId || audio.proyectoId) {
        try {
          ProjectService.saveTask({
            proyectoId: payload.proyectoId || audio.proyectoId,
            titulo: task.descripcion,
            descripcion: task.descripcion,
            responsableEmail: task.responsable || userContext.email,
            fechaCompromiso: task.fechaCompromiso || Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT),
            prioridad: APP_CONSTANTS.PRIORITY.MEDIUM,
            estatus: APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED
          }, userContext);
        } catch (error) {
          Logger.log('Task generation skipped: ' + error.message);
        }
      }
    });

    AuditLogger.log('Minuta', minute.id, 'CREATE', minute, userContext.email);
    return Object.assign({}, minute, { document: minuteDoc, extracted: extracted });
  }

  function transcribeDriveAudio_(fileId, mimeType) {
    var file = DriveApp.getFileById(fileId);
    var audioBytes = Utilities.base64Encode(file.getBlob().getBytes());
    var response = UrlFetchApp.fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify({
        config: {
          languageCode: AppConfig.get('TRANSCRIPTION_LANGUAGE_CODE', 'es-MX'),
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          encoding: inferEncoding_(mimeType),
          audioChannelCount: 1
        },
        audio: {
          content: audioBytes
        }
      }),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() >= 300) {
      throw new Error('Speech-to-Text error: ' + response.getContentText());
    }
    var parsed = Utils.parseJson(response.getContentText(), {});
    return ((parsed.results || []).map(function (item) {
      return item.alternatives && item.alternatives[0] ? item.alternatives[0].transcript : '';
    }).join(' ')).trim();
  }

  function inferEncoding_(mimeType) {
    var map = {
      'audio/mpeg': 'MP3',
      'audio/mp3': 'MP3',
      'audio/wav': 'LINEAR16',
      'audio/x-wav': 'LINEAR16',
      'audio/ogg': 'OGG_OPUS',
      'audio/webm': 'WEBM_OPUS'
    };
    return map[mimeType] || 'ENCODING_UNSPECIFIED';
  }

  function extractMeetingArtifacts_(transcript) {
    var clean = String(transcript || '').trim();
    var sentences = clean.split(/[.!?\n]+/).map(function (item) { return item.trim(); }).filter(String);
    var agreements = sentences.filter(function (sentence) {
      return /acuerdo|acordamos|definimos|se aprob[oó]/i.test(sentence);
    });
    var taskSentences = sentences.filter(function (sentence) {
      return /tarea|pendiente|responsable|fecha compromiso|entregar|revisar|enviar|actualizar/i.test(sentence);
    });
    var risks = sentences.filter(function (sentence) {
      return /riesgo|bloqueo|pendiente|atraso|dependencia/i.test(sentence);
    });

    var tasks = taskSentences.slice(0, 10).map(function (sentence, index) {
      return {
        id: Utils.generateId('MTG'),
        descripcion: sentence,
        responsable: '',
        fechaCompromiso: '',
        orden: index + 1
      };
    });

    return {
      summary: clean.slice(0, 1200) || 'Sin transcripcion disponible.',
      agreements: agreements.length ? agreements : ['Sin acuerdos detectados automaticamente.'],
      tasks: tasks,
      risks: risks.length ? risks : ['Sin riesgos detectados automaticamente.']
    };
  }

  return {
    uploadAndTranscribe: uploadAndTranscribe,
    generateMinuteFromAudio: generateMinuteFromAudio
  };
})();
