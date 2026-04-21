var TinchoService = (function () {
  var DEFAULT_TASK_ASSISTANT_SETTINGS_ = {
    TINCHO_ENABLE_TTS: 'true',
    TINCHO_DIALOGFLOW_PROJECT_ID: 'asistente007',
    TINCHO_DIALOGFLOW_LANGUAGE_CODE: 'es',
    TINCHO_DIALOGFLOW_CONFIDENCE_THRESHOLD: '0.35',
    TINCHO_TTS_LANGUAGE_CODE: 'es-MX',
    TINCHO_TTS_SSML_GENDER: 'NEUTRAL',
    TINCHO_TTS_AUDIO_ENCODING: 'MP3'
  };

  function getQueryRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.TINCHO_QUERIES);
  }

  function getFeedbackRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.TINCHO_FEEDBACK);
  }

  function getEscalationRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.TINCHO_ESCALATIONS);
  }

  function ensureDefaultSettings_() {
    var updates = {};
    Object.keys(DEFAULT_TASK_ASSISTANT_SETTINGS_).forEach(function (key) {
      if (AppConfig.get(key, '') === '') {
        updates[key] = DEFAULT_TASK_ASSISTANT_SETTINGS_[key];
      }
    });
    if (Object.keys(updates).length) {
      AppConfig.setAll(updates);
    }
  }

  function getSettings_() {
    ensureDefaultSettings_();
    return {
      enableDialogflow: false,
      enableTts: AppConfig.get('TINCHO_ENABLE_TTS', 'true') === 'true',
      enableEmailEscalation: false,
      dialogflowProjectId: AppConfig.get('TINCHO_DIALOGFLOW_PROJECT_ID', 'asistente007'),
      dialogflowLanguageCode: AppConfig.get('TINCHO_DIALOGFLOW_LANGUAGE_CODE', 'es'),
      dialogflowKnowledgeBaseId: '',
      dialogflowKnowledgeBaseName: '',
      dialogflowKnowledgeBaseDisplayName: 'Pregunta a BeBot',
      dialogflowConfidenceThreshold: AppConfig.get('TINCHO_DIALOGFLOW_CONFIDENCE_THRESHOLD', '0.35'),
      ttsLanguageCode: AppConfig.get('TINCHO_TTS_LANGUAGE_CODE', 'es-MX'),
      ttsVoiceName: AppConfig.get('TINCHO_TTS_VOICE_NAME', ''),
      ttsSsmlGender: AppConfig.get('TINCHO_TTS_SSML_GENDER', 'NEUTRAL'),
      ttsAudioEncoding: AppConfig.get('TINCHO_TTS_AUDIO_ENCODING', 'MP3'),
      escalationEmails: AppConfig.get('TINCHO_ESCALATION_EMAILS', '')
    };
  }

  function getDashboard(userContext) {
    var settings = getSettings_();
    var taskDashboard = TaskTrackingService.getDashboard({}, userContext);
    var recentQueries = getRecentQueries_(userContext.email, 8);

    return {
      assistantName: 'Pregunta a BeBot',
      user: {
        email: userContext.email,
        name: userContext.name,
        area: userContext.area || ''
      },
      settings: settings,
      summary: buildDashboardSummary_(taskDashboard, userContext),
      integrations: buildIntegrations_(settings),
      starterQuestions: [
        'Que actividades pendientes tengo hoy',
        'Que tareas estan vencidas',
        'Que sigue en mi semana',
        'Crea una actividad para mi de actualizar el seguimiento de actividades manana',
        'Marca como completada la actividad de seguimiento semanal'
      ],
      recentQueries: recentQueries,
      recentTasks: (taskDashboard.tasks || []).slice(0, 6).map(buildTaskReference_),
      recentActivity: (taskDashboard.recentActivity || []).slice(0, 6)
    };
  }

  function saveConfig(payload) {
    var values = {
      TINCHO_ENABLE_DIALOGFLOW: 'false',
      TINCHO_ENABLE_TTS: payload.enableTts === 'true' ? 'true' : 'false',
      TINCHO_ENABLE_EMAIL_ESCALATION: 'false',
      TINCHO_DIALOGFLOW_PROJECT_ID: String(payload.dialogflowProjectId || '').trim(),
      TINCHO_DIALOGFLOW_LANGUAGE_CODE: String(payload.dialogflowLanguageCode || 'es').trim() || 'es',
      TINCHO_DIALOGFLOW_CONFIDENCE_THRESHOLD: String(payload.dialogflowConfidenceThreshold || '0.35').trim() || '0.35',
      TINCHO_TTS_LANGUAGE_CODE: String(payload.ttsLanguageCode || 'es-MX').trim() || 'es-MX',
      TINCHO_TTS_VOICE_NAME: String(payload.ttsVoiceName || '').trim(),
      TINCHO_TTS_SSML_GENDER: String(payload.ttsSsmlGender || 'NEUTRAL').trim() || 'NEUTRAL',
      TINCHO_TTS_AUDIO_ENCODING: String(payload.ttsAudioEncoding || 'MP3').trim() || 'MP3',
      TINCHO_ESCALATION_EMAILS: String(payload.escalationEmails || '').trim()
    };
    AppConfig.setAll(values);
    return {
      settings: getSettings_(),
      integrations: buildIntegrations_(getSettings_())
    };
  }

  function saveManual() {
    return {
      mode: 'TASK_ONLY',
      disabled: true,
      message: 'Pregunta a BeBot ya no usa manuales en esta etapa.'
    };
  }

  function saveManualChunk() {
    return saveManual();
  }

  function finalizeManualUpload() {
    return saveManual();
  }

  function syncManuals() {
    return {
      mode: 'TASK_ONLY',
      disabled: true,
      result: {
        synced: 0,
        skipped: 0,
        failed: 0
      },
      dashboard: null
    };
  }

  function ask(payload, userContext) {
    Utils.requireFields(payload, ['pregunta']);
    var question = String(payload.pregunta || '').trim();
    if (!question) throw new Error('Escribe una instruccion para BeBot.');

    var taskDashboard = TaskTrackingService.getDashboard({}, userContext);
    var resolution = resolveTaskIntent_(question, taskDashboard, userContext);
    var query = persistQuery_(question, resolution, userContext);
    return {
      query: query,
      escalation: resolution.escalation || null
    };
  }

  function saveFeedback(payload, userContext) {
    Utils.requireFields(payload, ['queryId', 'utilidad', 'calificacion']);
    var queryRepo = getQueryRepo_();
    var current = queryRepo.findById(payload.queryId);
    if (!current) throw new Error('La consulta ya no existe.');

    if (Utils.normalizeEmail(current.userEmail) !== Utils.normalizeEmail(userContext.email) &&
      !AuthService.hasRole(userContext, APP_CONSTANTS.ROLES.ADMIN)) {
      throw new Error('Solo puedes calificar tus propias interacciones con BeBot.');
    }

    queryRepo.update(current.id, {
      feedbackScore: Number(payload.calificacion || 0),
      feedbackComment: String(payload.comentario || '').trim()
    });

    var feedback = getFeedbackRepo_().insert({
      queryId: current.id,
      userEmail: userContext.email,
      userName: userContext.name,
      utilidad: payload.utilidad,
      calificacion: Number(payload.calificacion || 0),
      comentario: String(payload.comentario || '').trim()
    });

    return {
      queryId: current.id,
      feedbackId: feedback.id
    };
  }

  function synthesizeAnswer(payload) {
    var settings = getSettings_();
    if (!settings.enableTts) {
      throw new Error('La voz de BeBot no esta habilitada. Activa Google TTS en configuracion.');
    }

    Utils.requireFields(payload, ['texto']);
    var text = String(payload.texto || '').trim().slice(0, 4500);
    if (!text) throw new Error('No hay texto para sintetizar.');

    var voice = {
      languageCode: settings.ttsLanguageCode || 'es-MX',
      ssmlGender: settings.ttsSsmlGender || 'NEUTRAL'
    };
    if (settings.ttsVoiceName) {
      voice.name = settings.ttsVoiceName;
    }

    var response = UrlFetchApp.fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify({
        input: { text: text },
        voice: voice,
        audioConfig: {
          audioEncoding: settings.ttsAudioEncoding || 'MP3'
        }
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 300) {
      throw new Error('Google TTS devolvio un error: ' + response.getContentText());
    }

    var parsed = Utils.parseJson(response.getContentText(), {});
    if (!parsed.audioContent) {
      throw new Error('Google TTS no devolvio audio para reproducir.');
    }

    return {
      audioContent: parsed.audioContent,
      audioEncoding: settings.ttsAudioEncoding || 'MP3',
      mimeType: resolveAudioMimeType_(settings.ttsAudioEncoding || 'MP3')
    };
  }

  function buildDashboardSummary_(taskDashboard, userContext) {
    var tasks = taskDashboard.tasks || [];
    var myEmail = Utils.normalizeEmail(userContext.email);
    var myTasks = tasks.filter(function (task) {
      return Utils.normalizeEmail(task.responsableEmail) === myEmail;
    });
    var myOpenTasks = myTasks.filter(function (task) {
      return task.estadoTarea !== APP_CONSTANTS.TASK_STATUS.COMPLETED;
    });

    return {
      totalTasks: Number((taskDashboard.summary && taskDashboard.summary.total) || 0),
      myOpenTasks: myOpenTasks.length,
      inProgressTasks: Number((taskDashboard.summary && taskDashboard.summary.inProgress) || 0),
      dueSoonTasks: Number((taskDashboard.summary && taskDashboard.summary.dueSoon) || 0),
      overdueTasks: Number((taskDashboard.summary && taskDashboard.summary.overdue) || 0),
      recentActivityCount: Number((taskDashboard.recentActivity || []).length || 0)
    };
  }

  function buildIntegrations_(settings) {
    return {
      taskTracking: {
        label: 'Seguimiento de actividades',
        enabled: true,
        configured: true,
        detail: 'BeBot puede leer, crear y actualizar actividades del tablero interno.'
      },
      tts: {
        label: 'Google Text-to-Speech',
        enabled: !!settings.enableTts,
        configured: !!(settings.enableTts && settings.dialogflowProjectId),
        detail: settings.enableTts
          ? 'La salida por voz esta habilitada para reproducir respuestas de BeBot.'
          : 'La voz esta desactivada por ahora.'
      }
    };
  }

  function getRecentQueries_(email, limit) {
    var safeLimit = limit || 5;
    return getQueryRepo_().getAll()
      .filter(function (row) {
        return Utils.normalizeEmail(row.userEmail) === Utils.normalizeEmail(email);
      })
      .slice(-safeLimit)
      .reverse()
      .map(toQueryView_);
  }

  function persistQuery_(question, resolution, userContext) {
    var saved = getQueryRepo_().insert({
      userEmail: userContext.email,
      userName: userContext.name,
      pregunta: question,
      respuesta: resolution.responseText,
      answerStatus: resolution.answerStatus || 'READY',
      answerEngine: resolution.answerEngine || 'CHE_TASKS',
      confidenceScore: Number(resolution.confidenceScore || 0),
      confidenceLabel: resolution.confidenceLabel || 'Media',
      dialogflowResponseId: '',
      sourceManualIds: Utils.stringifyJson(resolution.sourceIds || []),
      sourceManualTitles: Utils.stringifyJson(resolution.sourceTitles || []),
      suggestedStepsJson: Utils.stringifyJson(resolution.suggestedSteps || []),
      requiresEscalation: resolution.requiresEscalation ? 'true' : 'false',
      escalationId: resolution.escalation ? resolution.escalation.id : '',
      feedbackScore: '',
      feedbackComment: ''
    });
    return toQueryView_(saved);
  }

  function toQueryView_(row) {
    var titles = Utils.parseJson(row.sourceManualTitles, null);
    var ids = Utils.parseJson(row.sourceManualIds, null);
    return {
      id: row.id,
      pregunta: row.pregunta || '',
      respuesta: row.respuesta || '',
      answerStatus: row.answerStatus || '',
      answerEngine: row.answerEngine || '',
      confidenceScore: Number(row.confidenceScore || 0),
      confidenceLabel: row.confidenceLabel || 'Media',
      sourceManualIds: Array.isArray(ids) ? ids : [],
      sourceManualTitles: Array.isArray(titles) ? titles : [],
      suggestedSteps: Utils.parseJson(row.suggestedStepsJson, []) || [],
      requiresEscalation: String(row.requiresEscalation) === 'true',
      escalationId: row.escalationId || '',
      feedbackScore: row.feedbackScore ? Number(row.feedbackScore) : 0,
      feedbackComment: row.feedbackComment || '',
      updatedAt: row.updatedAt || row.createdAt || ''
    };
  }

  function buildTaskReference_(task) {
    return {
      id: task.id,
      titulo: task.titulo || '',
      responsableNombre: task.responsableNombre || task.responsableEmail || '',
      responsableEmail: task.responsableEmail || '',
      estadoTarea: task.estadoTarea || APP_CONSTANTS.TASK_STATUS.PENDING,
      prioridad: task.prioridad || APP_CONSTANTS.PRIORITY.MEDIUM,
      fechaLimite: task.fechaLimite || '',
      comentarios: task.comentarios || '',
      area: task.area || '',
      overdue: !!task.overdue,
      dueSoon: !!task.dueSoon
    };
  }

  function resolveTaskIntent_(question, taskDashboard, userContext) {
    var normalized = normalizeText_(question);

    if (isCreateIntent_(normalized)) {
      return handleCreateIntent_(question, taskDashboard, userContext);
    }

    var statusIntent = detectStatusIntent_(normalized);
    if (statusIntent) {
      return handleStatusIntent_(question, statusIntent, taskDashboard, userContext);
    }

    if (hasAny_(normalized, ['vencida', 'vencidas', 'vencido', 'vencidos', 'atrasada', 'atrasadas'])) {
      return handleListIntent_(taskDashboard.tasks || [], userContext, {
        filter: function (task) { return !!task.overdue; },
        intro: 'actividades vencidas',
        empty: 'No veo actividades vencidas en tu tablero visible.',
        answerStatus: 'TASKS_OVERDUE'
      });
    }

    if (hasAny_(normalized, ['hoy'])) {
      return handleListIntent_(taskDashboard.tasks || [], userContext, {
        filter: function (task) {
          return task.estadoTarea !== APP_CONSTANTS.TASK_STATUS.COMPLETED &&
            task.fechaLimite === Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT);
        },
        intro: 'actividades con corte para hoy',
        empty: 'Hoy no veo actividades con fecha limite en tu tablero visible.',
        answerStatus: 'TASKS_TODAY'
      });
    }

    if (hasAny_(normalized, ['semana', 'proximas', 'proxima', 'por vencer', 'vence'])) {
      return handleListIntent_(taskDashboard.tasks || [], userContext, {
        filter: function (task) {
          return task.estadoTarea !== APP_CONSTANTS.TASK_STATUS.COMPLETED &&
            task.fechaLimite &&
            daysUntil_(task.fechaLimite) >= 0 &&
            daysUntil_(task.fechaLimite) <= 7;
        },
        intro: 'actividades por vencer en la siguiente semana',
        empty: 'No veo actividades por vencer en los siguientes siete dias.',
        answerStatus: 'TASKS_WEEK'
      });
    }

    if (hasAny_(normalized, ['pendiente', 'pendientes', 'mis tareas', 'mis actividades', 'que tengo', 'que traigo', 'tengo'])) {
      return handleListIntent_(taskDashboard.tasks || [], userContext, {
        filter: function (task) {
          return Utils.normalizeEmail(task.responsableEmail) === Utils.normalizeEmail(userContext.email) &&
            task.estadoTarea !== APP_CONSTANTS.TASK_STATUS.COMPLETED;
        },
        intro: 'pendientes tuyas',
        empty: 'No tienes actividades pendientes en este momento.',
        answerStatus: 'TASKS_MY_OPEN'
      });
    }

    if (hasAny_(normalized, ['resumen', 'tablero', 'equipo', 'carga'])) {
      return buildSummaryIntent_(taskDashboard, userContext);
    }

    return handleSearchIntent_(question, taskDashboard, userContext);
  }

  function handleCreateIntent_(question, taskDashboard, userContext) {
    var assignee = extractAssignee_(question, taskDashboard.users || [], userContext);
    var dueDate = extractDueDate_(question);
    var title = extractTaskTitleFromRequest_(question, assignee);
    var created = TaskTrackingService.saveTask({
      titulo: title,
      responsableEmail: assignee.email,
      fechaLimite: dueDate.dateString,
      prioridad: APP_CONSTANTS.PRIORITY.MEDIUM,
      estadoTarea: APP_CONSTANTS.TASK_STATUS.PENDING,
      comentarios: 'Creada desde Pregunta a BeBot. Solicitud original: ' + question
    }, userContext);

    return {
      responseText: [
        'Hola ' + getFriendlyName_(userContext.name) + ', ya deje creada la actividad.',
        '',
        'Actividad: ' + created.titulo,
        'Responsable: ' + (created.responsableNombre || created.responsableEmail || ''),
        'Fecha limite: ' + (created.fechaLimite || '-'),
        dueDate.assumed ? 'Tome esa fecha como referencia porque no detecte una fecha explicita.' : 'La fecha limite quedo tomada de tu instruccion.'
      ].join('\n'),
      answerStatus: 'TASK_CREATED',
      answerEngine: 'CHE_TASKS',
      confidenceScore: 0.96,
      confidenceLabel: 'Alta',
      sourceIds: [created.id],
      sourceTitles: [created.titulo],
      suggestedSteps: [
        'Di "Pon en progreso ' + created.titulo + '" cuando arranque.',
        'Di "Marca como completada ' + created.titulo + '" cuando quede cerrada.'
      ],
      requiresEscalation: false
    };
  }

  function handleStatusIntent_(question, nextStatus, taskDashboard, userContext) {
    var match = findBestTaskMatch_(question, taskDashboard.tasks || [], userContext);
    if (!match) {
      return buildClarificationResponse_(
        userContext,
        'No pude identificar con claridad la actividad que quieres actualizar.',
        [
          'Prueba con "Marca como completada la actividad conciliacion de saldos".',
          'Tambien puedes decir "Pon en progreso la actividad tablero semanal".'
        ]
      );
    }

    var updated = TaskTrackingService.updateTaskStatus({
      taskId: match.id,
      estadoTarea: nextStatus,
      comentarios: 'Actualizada desde Pregunta a BeBot. Solicitud original: ' + question
    }, userContext);

    return {
      responseText: [
        'Listo ' + getFriendlyName_(userContext.name) + ', ya actualice la actividad.',
        '',
        'Actividad: ' + updated.titulo,
        'Nuevo estado: ' + humanTaskStatus_(updated.estadoTarea),
        'Responsable: ' + (updated.responsableNombre || updated.responsableEmail || ''),
        'Fecha limite: ' + (updated.fechaLimite || '-')
      ].join('\n'),
      answerStatus: 'TASK_UPDATED',
      answerEngine: 'CHE_TASKS',
      confidenceScore: 0.93,
      confidenceLabel: 'Alta',
      sourceIds: [updated.id],
      sourceTitles: [updated.titulo],
      suggestedSteps: nextStatus === APP_CONSTANTS.TASK_STATUS.COMPLETED
        ? ['Si hace falta, ahora puedes pedirme tus nuevas prioridades.']
        : ['Cuando cierre la actividad, di "Marca como completada ' + updated.titulo + '".'],
      requiresEscalation: false
    };
  }

  function handleListIntent_(tasks, userContext, options) {
    var filtered = (tasks || []).filter(options.filter || function () { return true; });
    if (!filtered.length) {
      return {
        responseText: 'Hola ' + getFriendlyName_(userContext.name) + ', ' + (options.empty || 'No encontré actividades para ese criterio.'),
        answerStatus: options.answerStatus || 'TASKS_EMPTY',
        answerEngine: 'CHE_TASKS',
        confidenceScore: 0.88,
        confidenceLabel: 'Alta',
        sourceIds: [],
        sourceTitles: [],
        suggestedSteps: [
          'Pidemelo como resumen general si quieres otra vista.',
          'Tambien puedes decir "Que pendientes tengo hoy".'
        ],
        requiresEscalation: false
      };
    }

    var topTasks = filtered.slice(0, 5);
    var lines = [
      'Hola ' + getFriendlyName_(userContext.name) + ', encontré ' + filtered.length + ' ' + (options.intro || 'actividades') + '.',
      ''
    ];

    topTasks.forEach(function (task, index) {
      lines.push(
        (index + 1) + '. ' + task.titulo +
        ' · ' + humanTaskStatus_(task.estadoTarea) +
        ' · vence ' + (task.fechaLimite || 'sin fecha') +
        ' · responsable ' + (task.responsableNombre || task.responsableEmail || '')
      );
    });

    if (filtered.length > topTasks.length) {
      lines.push('');
      lines.push('Solo te mostré las primeras ' + topTasks.length + '. Si quieres, te doy el detalle completo por responsable o por estado.');
    }

    return {
      responseText: lines.join('\n'),
      answerStatus: options.answerStatus || 'TASKS_LIST',
      answerEngine: 'CHE_TASKS',
      confidenceScore: 0.9,
      confidenceLabel: 'Alta',
      sourceIds: topTasks.map(function (task) { return task.id; }),
      sourceTitles: topTasks.map(function (task) { return task.titulo; }),
      suggestedSteps: [
        'Di "Pon en progreso ..." para mover una actividad.',
        'Di "Marca como completada ..." para cerrar una actividad.'
      ],
      requiresEscalation: false
    };
  }

  function buildSummaryIntent_(taskDashboard, userContext) {
    var summary = taskDashboard.summary || {};
    var lines = [
      'Hola ' + getFriendlyName_(userContext.name) + ', este es el corte rapido del tablero visible.',
      '',
      'Total: ' + Number(summary.total || 0).toLocaleString('es-MX'),
      'Pendientes: ' + Number(summary.pending || 0).toLocaleString('es-MX'),
      'En progreso: ' + Number(summary.inProgress || 0).toLocaleString('es-MX'),
      'Completadas: ' + Number(summary.completed || 0).toLocaleString('es-MX'),
      'Por vencer: ' + Number(summary.dueSoon || 0).toLocaleString('es-MX'),
      'Vencidas: ' + Number(summary.overdue || 0).toLocaleString('es-MX')
    ];

    return {
      responseText: lines.join('\n'),
      answerStatus: 'TASKS_SUMMARY',
      answerEngine: 'CHE_TASKS',
      confidenceScore: 0.92,
      confidenceLabel: 'Alta',
      sourceIds: (taskDashboard.tasks || []).slice(0, 5).map(function (task) { return task.id; }),
      sourceTitles: (taskDashboard.tasks || []).slice(0, 5).map(function (task) { return task.titulo; }),
      suggestedSteps: [
        'Pregunta "Que actividades pendientes tengo hoy".',
        'O dime "Crea una actividad para mi ..." si quieres registrar una nueva.'
      ],
      requiresEscalation: false
    };
  }

  function handleSearchIntent_(question, taskDashboard, userContext) {
    var tasks = taskDashboard.tasks || [];
    var matched = findMatchingTasks_(question, tasks).slice(0, 5);
    if (!matched.length) {
      return buildClarificationResponse_(
        userContext,
        'Todavia no identifiqué una accion clara sobre tareas con esa instruccion.',
        [
          'Prueba con "Que pendientes tengo hoy".',
          'O con "Crea una actividad para mi de actualizar seguimiento manana".'
        ]
      );
    }

    return {
      responseText: [
        'Hola ' + getFriendlyName_(userContext.name) + ', encontré actividades relacionadas con tu solicitud.',
        ''
      ].concat(matched.map(function (task, index) {
        return (index + 1) + '. ' + task.titulo + ' · ' + humanTaskStatus_(task.estadoTarea) + ' · vence ' + (task.fechaLimite || 'sin fecha');
      })).join('\n'),
      answerStatus: 'TASKS_MATCHED',
      answerEngine: 'CHE_TASKS',
      confidenceScore: 0.76,
      confidenceLabel: 'Media',
      sourceIds: matched.map(function (task) { return task.id; }),
      sourceTitles: matched.map(function (task) { return task.titulo; }),
      suggestedSteps: [
        'Si una de estas es la correcta, di "Marca como completada ..." o "Pon en progreso ...".',
        'Tambien puedes pedirme el resumen de tus pendientes.'
      ],
      requiresEscalation: false
    };
  }

  function buildClarificationResponse_(userContext, intro, suggestions) {
    return {
      responseText: 'Hola ' + getFriendlyName_(userContext.name) + ', ' + intro,
      answerStatus: 'NEEDS_CLARIFICATION',
      answerEngine: 'CHE_TASKS',
      confidenceScore: 0.45,
      confidenceLabel: 'Baja',
      sourceIds: [],
      sourceTitles: [],
      suggestedSteps: suggestions || [],
      requiresEscalation: false
    };
  }

  function isCreateIntent_(normalized) {
    return hasAny_(normalized, ['crea', 'crear', 'creame', 'agrega', 'registra', 'nueva tarea', 'nueva actividad']);
  }

  function detectStatusIntent_(normalized) {
    if (!hasAny_(normalized, ['marca', 'pon', 'deja', 'mueve', 'cambia', 'actualiza', 'completa', 'termina', 'cierra', 'finaliza', 'inicia', 'avanza', 'reabre', 'pausa'])) {
      return '';
    }
    if (hasAny_(normalized, ['completa', 'completada', 'termina', 'terminada', 'cierra', 'cerrada', 'finaliza'])) {
      return APP_CONSTANTS.TASK_STATUS.COMPLETED;
    }
    if (hasAny_(normalized, ['en progreso', 'inicia', 'arranca', 'avanza'])) {
      return APP_CONSTANTS.TASK_STATUS.IN_PROGRESS;
    }
    if (hasAny_(normalized, ['pendiente', 'reabre', 'pausa'])) {
      return APP_CONSTANTS.TASK_STATUS.PENDING;
    }
    return '';
  }

  function extractAssignee_(question, users, userContext) {
    var emailMatch = String(question || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig);
    if (emailMatch && emailMatch.length) {
      var email = Utils.normalizeEmail(emailMatch[0]);
      var matchedByEmail = (users || []).filter(function (user) {
        return Utils.normalizeEmail(user.email) === email;
      })[0];
      if (matchedByEmail) return matchedByEmail;
    }

    var normalizedQuestion = normalizeText_(question);
    var matchedByName = (users || []).slice().sort(function (a, b) {
      return String(b.nombre || '').length - String(a.nombre || '').length;
    }).filter(function (user) {
      return normalizedQuestion.indexOf(normalizeText_(user.nombre || '')) !== -1;
    })[0];

    return matchedByName || {
      email: userContext.email,
      nombre: userContext.name,
      area: userContext.area || ''
    };
  }

  function extractDueDate_(question) {
    var normalized = normalizeText_(question);
    var today = Utils.startOfDay(new Date());
    var explicitDate = extractExplicitDate_(question);
    if (explicitDate) {
      return {
        date: explicitDate,
        dateString: Utils.formatDate(explicitDate, APP_CONSTANTS.DATE_FORMAT),
        assumed: false
      };
    }

    if (hasAny_(normalized, ['pasado manana', 'pasado mañana'])) {
      var twoDays = new Date(today);
      twoDays.setDate(today.getDate() + 2);
      return {
        date: twoDays,
        dateString: Utils.formatDate(twoDays, APP_CONSTANTS.DATE_FORMAT),
        assumed: false
      };
    }

    if (hasAny_(normalized, ['manana', 'mañana'])) {
      var tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return {
        date: tomorrow,
        dateString: Utils.formatDate(tomorrow, APP_CONSTANTS.DATE_FORMAT),
        assumed: false
      };
    }

    if (hasAny_(normalized, ['hoy'])) {
      return {
        date: today,
        dateString: Utils.formatDate(today, APP_CONSTANTS.DATE_FORMAT),
        assumed: false
      };
    }

    var weekday = extractWeekday_(normalized, today);
    if (weekday) {
      return {
        date: weekday,
        dateString: Utils.formatDate(weekday, APP_CONSTANTS.DATE_FORMAT),
        assumed: false
      };
    }

    var assumed = new Date(today);
    assumed.setDate(today.getDate() + 1);
    return {
      date: assumed,
      dateString: Utils.formatDate(assumed, APP_CONSTANTS.DATE_FORMAT),
      assumed: true
    };
  }

  function extractExplicitDate_(question) {
    var isoMatch = String(question || '').match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoMatch && isoMatch[1]) return new Date(isoMatch[1] + 'T00:00:00');

    var slashMatch = String(question || '').match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
    if (slashMatch) {
      return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]));
    }

    return null;
  }

  function extractWeekday_(normalizedQuestion, baseDate) {
    var names = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      domingo: 0
    };
    var found = Object.keys(names).filter(function (name) {
      return normalizedQuestion.indexOf(name) !== -1;
    })[0];
    if (!found) return null;

    var targetDay = names[found];
    var date = new Date(baseDate);
    var diff = (targetDay - date.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    date.setDate(date.getDate() + diff);
    return date;
  }

  function extractTaskTitleFromRequest_(question, assignee) {
    var title = String(question || '')
      .replace(/^[\s,:-]+/, '')
      .replace(/^(por favor\s+)?(crea|crear|creame|agrega|registra|genera)\s+(una\s+)?(actividad|tarea)?/i, '')
      .trim();

    var deMatch = title.match(/\bde\s+(.+)/i);
    if (deMatch && deMatch[1]) {
      title = deMatch[1];
    }

    if (assignee && assignee.nombre) {
      title = title.replace(new RegExp('\\bpara\\s+' + escapeForRegex_(assignee.nombre) + '\\b', 'ig'), '').trim();
    }
    if (assignee && assignee.email) {
      title = title.replace(new RegExp('\\bpara\\s+' + escapeForRegex_(assignee.email) + '\\b', 'ig'), '').trim();
    }

    title = title
      .replace(/\b(hoy|manana|mañana|pasado manana|pasado mañana|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\b/ig, '')
      .replace(/\b\d{1,2}\/\d{1,2}\/20\d{2}\b/g, '')
      .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, '')
      .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
      .trim();

    if (!title) {
      title = 'Actividad solicitada desde Pregunta a BeBot';
    }
    return title;
  }

  function findBestTaskMatch_(question, tasks, userContext) {
    var scored = findMatchingTasks_(question, tasks, userContext);
    return scored.length ? scored[0] : null;
  }

  function findMatchingTasks_(question, tasks, userContext) {
    var normalizedQuestion = normalizeText_(question);
    var tokens = normalizedQuestion.split(/\s+/).filter(function (token) {
      return token && token.length > 2 && !STOP_WORDS_[token];
    });

    return (tasks || []).map(function (task) {
      var haystack = normalizeText_([
        task.titulo,
        task.descripcion,
        task.proyectoId,
        task.comentarios,
        task.responsableNombre,
        task.responsableEmail
      ].join(' '));
      var title = normalizeText_(task.titulo || '');
      var score = 0;

      if (title && normalizedQuestion.indexOf(title) !== -1) score += 12;
      tokens.forEach(function (token) {
        if (title.indexOf(token) !== -1) score += 4;
        else if (haystack.indexOf(token) !== -1) score += 1;
      });
      if (userContext && Utils.normalizeEmail(task.responsableEmail) === Utils.normalizeEmail(userContext.email)) {
        score += 1;
      }

      return {
        score: score,
        task: task
      };
    }).filter(function (item) {
      return item.score > 0;
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.task.overdue !== b.task.overdue) return a.task.overdue ? -1 : 1;
      return String(a.task.titulo || '').localeCompare(String(b.task.titulo || ''));
    }).map(function (item) {
      return item.task;
    });
  }

  function normalizeText_(value) {
    var text = String(value || '').toLowerCase();
    try {
      text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (error) {}
    return text.replace(/[^a-z0-9@._\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function hasAny_(value, terms) {
    var safeValue = String(value || '');
    return (terms || []).some(function (term) {
      return safeValue.indexOf(term) !== -1;
    });
  }

  function daysUntil_(dateString) {
    if (!dateString) return 999;
    var dueDate = Utils.startOfDay(new Date(dateString));
    var today = Utils.startOfDay(new Date());
    return Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
  }

  function humanTaskStatus_(status) {
    if (status === APP_CONSTANTS.TASK_STATUS.COMPLETED) return 'Completada';
    if (status === APP_CONSTANTS.TASK_STATUS.IN_PROGRESS) return 'En progreso';
    return 'Pendiente';
  }

  function getFriendlyName_(nameOrEmail) {
    var base = String(nameOrEmail || '').trim();
    if (!base) return 'equipo';
    var clean = base.split('@')[0];
    return clean.split(/[.\s_-]+/).filter(Boolean)[0] || clean;
  }

  function resolveAudioMimeType_(audioEncoding) {
    var normalized = String(audioEncoding || '').toUpperCase();
    if (normalized === 'OGG_OPUS') return 'audio/ogg';
    if (normalized === 'LINEAR16') return 'audio/wav';
    if (normalized === 'MULAW') return 'audio/basic';
    return 'audio/mpeg';
  }

  function escapeForRegex_(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  var STOP_WORDS_ = {
    actividad: true,
    actividades: true,
    tarea: true,
    tareas: true,
    para: true,
    como: true,
    que: true,
    del: true,
    con: true,
    una: true,
    unos: true,
    unas: true,
    por: true,
    hoy: true,
    manana: true,
    equipo: true
  };

  return {
    getDashboard: getDashboard,
    saveConfig: saveConfig,
    saveManual: saveManual,
    saveManualChunk: saveManualChunk,
    finalizeManualUpload: finalizeManualUpload,
    syncManuals: syncManuals,
    ask: ask,
    synthesizeAnswer: synthesizeAnswer,
    saveFeedback: saveFeedback
  };
})();
