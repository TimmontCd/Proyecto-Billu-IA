var WhatsAppConversationalPocService = (function () {
  var LOG_HEADERS = [
    'Timestamp',
    'wa_id',
    'Phone',
    'Message Type',
    'Received Text',
    'Intent',
    'Response Text',
    'Escalated',
    'Escalation Reason',
    'Delivery Status',
    'Message Id',
    'Payload'
  ];

  var HANDOFF_HEADERS = [
    'Timestamp',
    'wa_id',
    'Phone',
    'Intent',
    'Reason',
    'Received Text',
    'Status',
    'Assigned To',
    'Metadata'
  ];

  var MENU_OPTIONS = [
    '1. Abrir mi cuenta',
    '2. Ayuda con mi registro',
    '3. Productos y beneficios',
    '4. Soporte',
    '5. Hablar con un asesor'
  ];

  function normalizeKey_(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function getSpreadsheet_() {
    return SpreadsheetApp.openById(AppConfig.getWhatsAppAgentSpreadsheetId());
  }

  function getOrCreateSheet_(name, headers) {
    var spreadsheet = getSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    ensureHeaders_(sheet, headers);
    return sheet;
  }

  function ensureHeaders_(sheet, headers) {
    var lastColumn = Math.max(sheet.getLastColumn(), headers.length, 1);
    var current = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var needsWrite = false;
    for (var index = 0; index < headers.length; index += 1) {
      if (String(current[index] || '').trim() !== headers[index]) {
        current[index] = headers[index];
        needsWrite = true;
      }
    }
    if (needsWrite || sheet.getLastRow() < 1) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  function ensureLogSheet_() {
    return getOrCreateSheet_('WhatsApp PoC Log', LOG_HEADERS);
  }

  function ensureHandoffSheet_() {
    return getOrCreateSheet_('WhatsApp PoC Escalamiento', HANDOFF_HEADERS);
  }

  function buildMainMenuText_() {
    return [
      'Estas son las opciones disponibles:',
      MENU_OPTIONS.join('\n'),
      '',
      'Responde con el número o escríbeme qué necesitas.'
    ].join('\n');
  }

  function parseInboundMessages_(payload) {
    var parsed = [];
    var entries = (payload && payload.entry) || [];
    for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      var changes = entries[entryIndex].changes || [];
      for (var changeIndex = 0; changeIndex < changes.length; changeIndex += 1) {
        var value = changes[changeIndex].value || {};
        var contacts = value.contacts || [];
        var messages = value.messages || [];
        for (var messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
          var message = messages[messageIndex] || {};
          var contact = contacts[0] || {};
          parsed.push({
            messageId: String(message.id || ''),
            from: normalizePhone_(message.from || contact.wa_id || ''),
            waId: normalizePhone_(contact.wa_id || message.from || ''),
            profileName: String(((contact.profile || {}).name) || ''),
            type: String(message.type || 'unknown'),
            text: extractMessageText_(message),
            rawMessage: message
          });
        }
      }
    }
    return parsed;
  }

  function extractMessageText_(message) {
    if (!message) return '';
    if (message.text && message.text.body) return String(message.text.body || '').trim();
    if (message.button && message.button.text) return String(message.button.text || '').trim();
    if (message.interactive && message.interactive.button_reply && message.interactive.button_reply.title) {
      return String(message.interactive.button_reply.title || '').trim();
    }
    if (message.interactive && message.interactive.list_reply && message.interactive.list_reply.title) {
      return String(message.interactive.list_reply.title || '').trim();
    }
    return '';
  }

  function normalizePhone_(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return '52' + digits;
    // WhatsApp inbound numbers for Mexico can arrive as 521XXXXXXXXXX,
    // but Cloud API outbound requests expect 52XXXXXXXXXX.
    if (digits.length === 13 && digits.indexOf('521') === 0) {
      return '52' + digits.slice(3);
    }
    return digits;
  }

  function classifyIntent_(rawText) {
    var text = normalizeKey_(rawText);
    if (!text) return 'desconocida';
    if (/^(1|uno)\b/.test(text)) return 'apertura_cuenta';
    if (/^(2|dos)\b/.test(text)) return 'ayuda_registro';
    if (/^(3|tres)\b/.test(text)) return 'productos_beneficios';
    if (/^(4|cuatro)\b/.test(text)) return 'soporte';
    if (/^(5|cinco)\b/.test(text)) return 'hablar_asesor';
    if (/(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal)\b/.test(text)) return 'saludo';
    if (/(abrir cuenta|abrir mi cuenta|registrarme|crear cuenta|alta de cuenta|quiero abrir)/.test(text)) return 'apertura_cuenta';
    if (/(no puedo registrarme|error al registrarme|ayuda con registro|problema con mi registro|registro|enrolamiento)/.test(text)) return 'ayuda_registro';
    if (/(productos|beneficios|tarjeta|cuenta digital|que ofrecen|que productos)/.test(text)) return 'productos_beneficios';
    if (/(ayuda|soporte|problema|falla|no funciona|incidencia)/.test(text)) return 'soporte';
    if (/(asesor|ejecutivo|humano|persona|agente)/.test(text)) return 'hablar_asesor';
    return 'desconocida';
  }

  function shouldEscalate_(rawText, intent) {
    var text = normalizeKey_(rawText);
    if (intent === 'hablar_asesor') return 'Cliente solicita atención humana';
    if (/(fraude|robo|bloqueo|bloqueada|queja|reclamo|demanda|urgente|super mal|pesimo|pésimo)/.test(text)) {
      return 'Caso sensible o con frustración detectada';
    }
    return '';
  }

  function buildResponse_(intent) {
    switch (intent) {
      case 'saludo':
        return [
          'Hola, soy el asistente virtual de Billú.',
          'Te puedo ayudar con apertura de cuenta, registro, productos, soporte o canalizarte con un asesor.',
          buildMainMenuText_()
        ].join('\n\n');
      case 'apertura_cuenta':
        return [
          'Con gusto te oriento con la apertura de tu cuenta.',
          'Necesitarás tu identificación, celular y correo a la mano.',
          'Si te atoras en el registro, también puedo ayudarte o canalizarte con un asesor.'
        ].join('\n');
      case 'ayuda_registro':
        return [
          'Te ayudo con tu registro.',
          'Cuéntame en qué paso te atoraste o qué error viste para orientarte mejor.',
          'Si lo prefieres, también puedo canalizar tu caso con un asesor.'
        ].join('\n');
      case 'productos_beneficios':
        return [
          'Billú te orienta sobre cuenta digital y beneficios disponibles.',
          'Si me dices qué estás buscando, te comparto la ruta correcta o te canalizo con un asesor.'
        ].join('\n');
      case 'soporte':
        return [
          'Con gusto te apoyo.',
          'Descríbeme brevemente el problema y te indicaré el siguiente paso.',
          'Si detectamos un caso sensible, lo escalamos con una persona.'
        ].join('\n');
      case 'hablar_asesor':
        return [
          'Claro, te ayudo a canalizar tu solicitud con un asesor.',
          'Compárteme brevemente tu necesidad para dirigirla correctamente.'
        ].join('\n');
      case 'desconocida':
      default:
        return [
          'No me quedó claro lo que necesitas, pero te ayudo.',
          buildMainMenuText_()
        ].join('\n\n');
    }
  }

  function buildAcknowledgementResponse_(message) {
    var messageLabel = message && message.type && message.type !== 'text' ? 'archivo' : 'mensaje';
    return [
      'Billu ACK 2026-03-31',
      'Gracias por escribir a Billú.',
      'Recibimos tu ' + messageLabel + ' y en breve te responderemos por este medio.'
    ].join('\n');
  }

  function buildSendResult_(status, statusCode, response) {
    return {
      status: status,
      statusCode: statusCode || '',
      response: response || null
    };
  }

  function resolveAutoReply_(message, intent) {
    return {
      enabled: true,
      mode: 'ACK_ONLY_LOCKED',
      responseText: buildAcknowledgementResponse_(message),
      reason: 'ack_only_locked'
    };
  }

  function appendLog_(entry) {
    ensureLogSheet_().appendRow([
      Utils.formatDate(new Date()),
      entry.waId || '',
      entry.phone || '',
      entry.messageType || '',
      entry.receivedText || '',
      entry.intent || '',
      entry.responseText || '',
      entry.escalated ? 'SI' : 'NO',
      entry.escalationReason || '',
      entry.deliveryStatus || '',
      entry.messageId || '',
      Utils.stringifyJson(entry.payload || {})
    ]);
  }

  function appendHandoff_(entry) {
    ensureHandoffSheet_().appendRow([
      Utils.formatDate(new Date()),
      entry.waId || '',
      entry.phone || '',
      entry.intent || '',
      entry.reason || '',
      entry.receivedText || '',
      'ESCALADO',
      'PENDIENTE',
      Utils.stringifyJson(entry.metadata || {})
    ]);
  }

  function sendTextMessage_(to, body) {
    var token = AppConfig.getWhatsAppAccessToken();
    var phoneNumberId = AppConfig.getWhatsAppPhoneNumberId();
    if (!token || !phoneNumberId) {
      return {
        status: 'skipped_not_configured',
        response: null
      };
    }

    var endpoint = 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/messages';
    var payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: false,
        body: body
      }
    };

    var response = UrlFetchApp.fetch(endpoint, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token
      },
      muteHttpExceptions: true,
      payload: JSON.stringify(payload)
    });

    var statusCode = response.getResponseCode();
    var bodyText = response.getContentText();
    var json = Utils.parseJson(bodyText, {});
    return {
      status: statusCode >= 200 && statusCode < 300 ? 'sent' : 'failed',
      statusCode: statusCode,
      response: json || bodyText
    };
  }

  function handleWebhook(payload) {
    var inboundMessages = parseInboundMessages_(payload);
    if (!inboundMessages.length) {
      appendLog_({
        waId: '',
        phone: '',
        messageType: 'status_event',
        receivedText: '',
        intent: 'n/a',
        responseText: '',
        escalated: false,
        escalationReason: '',
        deliveryStatus: 'ignored_status_event',
        messageId: '',
        payload: payload
      });
      return {
        handled: false,
        reason: 'No inbound messages found in webhook payload.'
      };
    }

    var results = inboundMessages.map(function (message) {
      var intent = classifyIntent_(message.text);
      var escalationReason = shouldEscalate_(message.text, intent);
      var autoReply = resolveAutoReply_(message, intent);
      var responseText = autoReply.responseText || '';
      var sendResult = responseText
        ? sendTextMessage_(message.from, responseText)
        : buildSendResult_(
          autoReply.enabled ? 'skipped_auto_reply_no_response' : 'skipped_auto_reply_disabled',
          '',
          { reason: autoReply.reason, mode: autoReply.mode }
        );

      appendLog_({
        waId: message.waId,
        phone: message.from,
        messageType: message.type,
        receivedText: message.text,
        intent: intent,
        responseText: responseText,
        escalated: !!escalationReason,
        escalationReason: escalationReason,
        deliveryStatus: sendResult.status,
        messageId: message.messageId,
        payload: {
          inbound: message.rawMessage,
          autoReply: {
            enabled: autoReply.enabled,
            mode: autoReply.mode,
            reason: autoReply.reason
          },
          sendResult: {
            status: sendResult.status || '',
            statusCode: sendResult.statusCode || '',
            response: sendResult.response || null
          }
        }
      });

      if (escalationReason) {
        appendHandoff_({
          waId: message.waId,
          phone: message.from,
          intent: intent,
          reason: escalationReason,
          receivedText: message.text,
          metadata: {
            profileName: message.profileName || '',
            messageId: message.messageId || '',
            source: 'apps_script_poc'
          }
        });
      }

      return {
        waId: message.waId,
        from: message.from,
        intent: intent,
        autoReplyEnabled: autoReply.enabled,
        autoReplyMode: autoReply.mode,
        escalated: !!escalationReason,
        escalationReason: escalationReason,
        deliveryStatus: sendResult.status,
        responseText: responseText
      };
    });

    return {
      handled: true,
      mode: 'apps_script_poc',
      results: results
    };
  }

  function sendTestMessage(to, body) {
    var normalizedTo = normalizePhone_(to);
    if (!normalizedTo) throw new Error('Missing test destination phone.');
    var responseText = String(body || '').trim() || [
      'Hola, soy el asistente virtual de Billú.',
      'Esta es una prueba controlada de la integración con WhatsApp Cloud API.',
      'Si recibes este mensaje, la salida desde Apps Script quedó conectada correctamente.'
    ].join('\n');

    var sendResult = sendTextMessage_(normalizedTo, responseText);

    appendLog_({
      waId: normalizedTo,
      phone: normalizedTo,
      messageType: 'manual_test',
      receivedText: '',
      intent: 'manual_test',
      responseText: responseText,
      escalated: false,
      escalationReason: '',
      deliveryStatus: sendResult.status,
      messageId: '',
      payload: {
        source: 'manual_test',
        statusCode: sendResult.statusCode || '',
        response: sendResult.response || null
      }
    });

    return {
      to: normalizedTo,
      body: responseText,
      sendResult: sendResult
    };
  }

  return {
    buildMainMenuText: buildMainMenuText_,
    classifyIntent: classifyIntent_,
    handleWebhook: handleWebhook,
    sendTestMessage: sendTestMessage
  };
})();
