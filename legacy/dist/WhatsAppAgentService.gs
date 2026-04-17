var WhatsAppAgentService = (function () {
  var SEND_TRACKING_COLUMNS = [
    'Telefono',
    'Origen',
    'Meta Lead Id',
    'OptIn WhatsApp',
    'Estado WhatsApp',
    'Ultima Interaccion WhatsApp',
    'Ultimo Mensaje WhatsApp',
    'Necesita Humano',
    'Responsable Humano',
    'Motivo Escalamiento',
    'Ultimo Intento WhatsApp',
    'WhatsApp Template'
  ];

  var HANDOFF_HEADERS = [
    'Fecha',
    'Row Number',
    'Nombre',
    'Email',
    'Telefono',
    'Siguiente Paso',
    'Origen',
    'Meta Lead Id',
    'Motivo',
    'Asignado A',
    'Estado',
    'Ultimo Mensaje',
    'Creado Por'
  ];

  var OUTBOUND_CAMPAIGN_TRACKING_COLUMNS = [
    'Estado Campaña WhatsApp',
    'Ultimo Envio Campaña WhatsApp',
    'Mensaje Campaña WhatsApp',
    'Error Campaña WhatsApp',
    'Message Id Campaña WhatsApp',
    'Usuario Campaña WhatsApp'
  ];

  var OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE = 'Estás cerca de abrir tu cuenta y queremos ayudarte. Responde SI para iniciar nuestra conversación.';

  function normalizeKey_(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function escapeHtml_(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildHeaderMap_(headers) {
    return headers.reduce(function (acc, header, index) {
      acc[normalizeKey_(header)] = index;
      return acc;
    }, {});
  }

  function resolveIndex_(headerMap, candidates) {
    for (var index = 0; index < candidates.length; index += 1) {
      var normalized = normalizeKey_(candidates[index]);
      if (headerMap.hasOwnProperty(normalized)) return headerMap[normalized];
    }
    return -1;
  }

  function getSpreadsheet_() {
    return SpreadsheetApp.openById(AppConfig.getWhatsAppAgentSpreadsheetId());
  }

  function findSheetByNormalizedName_(spreadsheet, targetName) {
    var normalizedTarget = normalizeKey_(targetName);
    var sheets = spreadsheet.getSheets();
    for (var index = 0; index < sheets.length; index += 1) {
      if (normalizeKey_(sheets[index].getName()) === normalizedTarget) return sheets[index];
    }
    return null;
  }

  function sheetHasHeaders_(sheet, requiredHeaders) {
    if (!sheet || sheet.getLastColumn() < 1) return false;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    var headerMap = buildHeaderMap_(headers);
    return requiredHeaders.every(function (header) {
      return headerMap.hasOwnProperty(normalizeKey_(header));
    });
  }

  function findSheetByHeaders_(spreadsheet, requiredHeaders) {
    var sheets = spreadsheet.getSheets();
    for (var index = 0; index < sheets.length; index += 1) {
      if (sheetHasHeaders_(sheets[index], requiredHeaders)) return sheets[index];
    }
    return null;
  }

  function getStepsSheet_() {
    var spreadsheet = getSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(AppConfig.getWhatsAppAgentStepsSheetName())
      || findSheetByNormalizedName_(spreadsheet, AppConfig.getWhatsAppAgentStepsSheetName())
      || findSheetByHeaders_(spreadsheet, ['Siguiente Paso', 'Acción', 'URL']);
    if (!sheet) throw new Error('No se encontró la pestaña PASOS del Agente de WhatsApp.');
    return sheet;
  }

  function getSendsSheet_() {
    var spreadsheet = getSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(AppConfig.getWhatsAppAgentSendsSheetName())
      || findSheetByNormalizedName_(spreadsheet, AppConfig.getWhatsAppAgentSendsSheetName())
      || findSheetByHeaders_(spreadsheet, ['Email', 'Siguiente Paso']);
    if (!sheet) throw new Error('No se encontró la pestaña Envios del Agente de WhatsApp.');
    return sheet;
  }

  function getOutboundCampaignSheetName_() {
    return AppConfig.get('WHATSAPP_AGENT_CAMPAIGN_SHEET_NAME', 'CampañaEnrolamiento');
  }

  function getOutboundCampaignSheet_() {
    var spreadsheet = getSpreadsheet_();
    var expectedName = getOutboundCampaignSheetName_();
    var sheet = spreadsheet.getSheetByName(expectedName)
      || findSheetByNormalizedName_(spreadsheet, expectedName);
    if (!sheet) throw new Error('No se encontró la pestaña ' + expectedName + ' para la campaña outbound.');
    return sheet;
  }

  function ensureHandoffSheet_() {
    var spreadsheet = getSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(AppConfig.getWhatsAppAgentHandoffSheetName())
      || findSheetByNormalizedName_(spreadsheet, AppConfig.getWhatsAppAgentHandoffSheetName());
    if (!sheet) {
      sheet = spreadsheet.insertSheet(AppConfig.getWhatsAppAgentHandoffSheetName());
    }
    if (sheet.getLastRow() < 1) {
      sheet.getRange(1, 1, 1, HANDOFF_HEADERS.length).setValues([HANDOFF_HEADERS]);
    } else {
      var currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
      if (!currentHeaders.filter(String).length) {
        sheet.getRange(1, 1, 1, HANDOFF_HEADERS.length).setValues([HANDOFF_HEADERS]);
      }
    }
    return sheet;
  }

  function ensureLogSheet_() {
    var spreadsheet = getSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(AppConfig.getWhatsAppAgentLogSheetName())
      || findSheetByNormalizedName_(spreadsheet, AppConfig.getWhatsAppAgentLogSheetName());
    if (!sheet) {
      sheet = spreadsheet.insertSheet(AppConfig.getWhatsAppAgentLogSheetName());
      sheet.getRange(1, 1, 1, 7).setValues([['Fecha', 'Telefono', 'Tipo', 'Mensaje', 'Payload', 'Resuelto', 'Creado Por']]);
    }
    return sheet;
  }

  function getValuesAsObjects_(sheet) {
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow < 2 || lastColumn < 1) {
      return { headers: [], headerMap: {}, rows: [] };
    }
    var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastColumn).getDisplayValues();
    return {
      headers: headers,
      headerMap: buildHeaderMap_(headers),
      rows: data
    };
  }

  function ensureSendTrackingColumns_(sheet) {
    var lastColumn = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var headerMap = buildHeaderMap_(headers);
    var missing = SEND_TRACKING_COLUMNS.filter(function (header) {
      return !headerMap.hasOwnProperty(normalizeKey_(header));
    });
    if (missing.length) {
      sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
      headers = sheet.getRange(1, 1, 1, headers.length + missing.length).getDisplayValues()[0];
      headerMap = buildHeaderMap_(headers);
    }
    return {
      headers: headers,
      headerMap: headerMap
    };
  }

  function ensureOutboundCampaignTrackingColumns_(sheet) {
    var lastColumn = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var headerMap = buildHeaderMap_(headers);
    var missing = OUTBOUND_CAMPAIGN_TRACKING_COLUMNS.filter(function (header) {
      return !headerMap.hasOwnProperty(normalizeKey_(header));
    });
    if (missing.length) {
      sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
      headers = sheet.getRange(1, 1, 1, headers.length + missing.length).getDisplayValues()[0];
      headerMap = buildHeaderMap_(headers);
    }
    return {
      headers: headers,
      headerMap: headerMap
    };
  }

  function updateSendRow_(sheet, rowNumber, updates) {
    var metadata = ensureSendTrackingColumns_(sheet);
    Object.keys(updates).forEach(function (header) {
      var columnIndex = metadata.headerMap[normalizeKey_(header)];
      if (columnIndex === undefined) return;
      sheet.getRange(rowNumber, columnIndex + 1).setValue(updates[header]);
    });
  }

  function updateOutboundCampaignRow_(sheet, rowNumber, updates) {
    var metadata = ensureOutboundCampaignTrackingColumns_(sheet);
    Object.keys(updates).forEach(function (header) {
      var columnIndex = metadata.headerMap[normalizeKey_(header)];
      if (columnIndex === undefined) return;
      sheet.getRange(rowNumber, columnIndex + 1).setValue(updates[header]);
    });
  }

  function getFirstName_(rowObject) {
    var preferred = String(rowObject.firstName || '').trim();
    if (preferred) return preferred;
    var fullName = String(rowObject.fullName || '').trim();
    if (!fullName) return 'cliente';
    return fullName.split(/\s+/)[0];
  }

  function normalizePhone_(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return '52' + digits;
    if (digits.length === 13 && digits.indexOf('521') === 0) return '52' + digits.slice(3);
    if (digits.length === 12 && digits.indexOf('52') === 0) return digits;
    return digits;
  }

  function parseBooleanLike_(value, defaultValue) {
    var normalized = normalizeKey_(value);
    if (!normalized) return !!defaultValue;
    if (['SI', 'SÍ', 'YES', 'TRUE', '1', 'Y', 'ACTIVO'].indexOf(normalized) > -1) return true;
    if (['NO', 'FALSE', '0', 'N', 'INACTIVO'].indexOf(normalized) > -1) return false;
    return !!defaultValue;
  }

  function parseDateValue_(value) {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'number') {
      var serialDate = new Date(Math.round((value - 25569) * 86400 * 1000));
      return isNaN(serialDate.getTime()) ? null : serialDate;
    }
    var raw = String(value || '').trim();
    if (!raw) return null;
    var direct = new Date(raw);
    if (!isNaN(direct.getTime())) return direct;
    var match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (match) {
      var day = Number(match[1]);
      var month = Number(match[2]) - 1;
      var year = Number(match[3]);
      if (year < 100) year += 2000;
      var hours = Number(match[4] || 0);
      var minutes = Number(match[5] || 0);
      var seconds = Number(match[6] || 0);
      var parsed = new Date(year, month, day, hours, minutes, seconds);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  function isWithinLast24Hours_(value) {
    var parsed = parseDateValue_(value);
    if (!parsed) return false;
    return (new Date().getTime() - parsed.getTime()) <= (24 * 60 * 60 * 1000);
  }

  function loadStepCatalog_() {
    var payload = getValuesAsObjects_(getStepsSheet_());
    var headerMap = payload.headerMap;
    var nextStepIndex = resolveIndex_(headerMap, ['Siguiente Paso']);
    var actionIndex = resolveIndex_(headerMap, ['Acción', 'Accion']);
    var urlIndex = resolveIndex_(headerMap, ['URL', 'Url']);

    if (nextStepIndex === -1) throw new Error('La pestaña PASOS requiere la columna Siguiente Paso.');

    var list = payload.rows.map(function (row) {
      var nextStep = String(row[nextStepIndex] || '').trim();
      if (!nextStep) return null;
      return {
        nextStep: nextStep,
        action: String(actionIndex > -1 ? row[actionIndex] : '').trim(),
        url: String(urlIndex > -1 ? row[urlIndex] : '').trim()
      };
    }).filter(Boolean);

    return {
      list: list,
      map: list.reduce(function (acc, item) {
        acc[normalizeKey_(item.nextStep)] = item;
        return acc;
      }, {})
    };
  }

  function mapSendRows_(stepCatalog) {
    var sheet = getSendsSheet_();
    ensureSendTrackingColumns_(sheet);
    var payload = getValuesAsObjects_(sheet);
    var headerMap = payload.headerMap;
    var nameIndex = resolveIndex_(headerMap, ['Nombre']);
    var emailIndex = resolveIndex_(headerMap, ['Email', 'Correo']);
    var fullNameIndex = resolveIndex_(headerMap, ['Nombre y Apellido', 'Nombre Completo']);
    var nextStepIndex = resolveIndex_(headerMap, ['Siguiente Paso']);
    var phoneIndex = resolveIndex_(headerMap, ['Telefono', 'Teléfono', 'Celular', 'Whatsapp', 'WhatsApp', 'Numero', 'Número']);
    var originIndex = resolveIndex_(headerMap, ['Origen', 'Fuente', 'Canal', 'Lead Source']);
    var metaLeadIndex = resolveIndex_(headerMap, ['Meta Lead Id', 'MetaLeadId', 'Facebook Lead Id', 'Lead Id']);
    var optInIndex = resolveIndex_(headerMap, ['OptIn WhatsApp', 'OptIn', 'WhatsApp OptIn']);
    var statusIndex = resolveIndex_(headerMap, ['Estado WhatsApp']);
    var interactionIndex = resolveIndex_(headerMap, ['Ultima Interaccion WhatsApp']);
    var messageIndex = resolveIndex_(headerMap, ['Ultimo Mensaje WhatsApp']);
    var handoffIndex = resolveIndex_(headerMap, ['Necesita Humano']);
    var humanOwnerIndex = resolveIndex_(headerMap, ['Responsable Humano']);
    var handoffReasonIndex = resolveIndex_(headerMap, ['Motivo Escalamiento']);
    var lastAttemptIndex = resolveIndex_(headerMap, ['Ultimo Intento WhatsApp']);
    var templateIndex = resolveIndex_(headerMap, ['WhatsApp Template']);
    var codeIndex = resolveIndex_(headerMap, ['Codigo', 'Código', 'OTP', 'Token']);

    return payload.rows.map(function (row, index) {
      var nextStep = String(nextStepIndex > -1 ? row[nextStepIndex] : '').trim();
      var stepConfig = stepCatalog.map[normalizeKey_(nextStep)] || null;
      var origin = String(originIndex > -1 ? row[originIndex] : '').trim();
      var metaLeadId = String(metaLeadIndex > -1 ? row[metaLeadIndex] : '').trim();
      var phone = normalizePhone_(phoneIndex > -1 ? row[phoneIndex] : '');
      var code = String(codeIndex > -1 ? row[codeIndex] : '').trim();
      var isMetaLead = !!metaLeadId || /META|FACEBOOK|INSTAGRAM|FB|IG/.test(normalizeKey_(origin));
      var optIn = parseBooleanLike_(optInIndex > -1 ? row[optInIndex] : '', true);
      var hasGuide = !!(stepConfig && stepConfig.url);
      var action = stepConfig && stepConfig.action ? stepConfig.action : '';
      var nextAction = buildSuggestedAction_(nextStep, action, code);

      return {
        rowNumber: index + 2,
        firstName: String(nameIndex > -1 ? row[nameIndex] : '').trim(),
        fullName: String(fullNameIndex > -1 ? row[fullNameIndex] : '').trim() || String(nameIndex > -1 ? row[nameIndex] : '').trim(),
        email: Utils.normalizeEmail(emailIndex > -1 ? row[emailIndex] : ''),
        phone: phone,
        nextStep: nextStep,
        action: action,
        customerAction: nextAction,
        url: stepConfig && stepConfig.url ? stepConfig.url : '',
        code: code,
        origin: origin || (isMetaLead ? 'META' : 'Recuperación'),
        metaLeadId: metaLeadId,
        isMetaLead: isMetaLead,
        optIn: optIn,
        whatsappStatus: String(statusIndex > -1 ? row[statusIndex] : '').trim(),
        lastInteraction: String(interactionIndex > -1 ? row[interactionIndex] : '').trim(),
        lastMessage: String(messageIndex > -1 ? row[messageIndex] : '').trim(),
        needsHuman: parseBooleanLike_(handoffIndex > -1 ? row[handoffIndex] : '', false),
        humanOwner: String(humanOwnerIndex > -1 ? row[humanOwnerIndex] : '').trim(),
        handoffReason: String(handoffReasonIndex > -1 ? row[handoffReasonIndex] : '').trim(),
        lastAttempt: String(lastAttemptIndex > -1 ? row[lastAttemptIndex] : '').trim(),
        templateName: String(templateIndex > -1 ? row[templateIndex] : '').trim(),
        hasGuide: hasGuide,
        within24hWindow: isWithinLast24Hours_(interactionIndex > -1 ? row[interactionIndex] : ''),
        readyToAssist: !!(phone && optIn && (nextStep || isMetaLead)),
        readyForTemplate: !!(phone && optIn && !isWithinLast24Hours_(interactionIndex > -1 ? row[interactionIndex] : '') && (nextStep || isMetaLead))
      };
    }).filter(function (row) {
      return row.phone || row.email || row.nextStep || row.metaLeadId;
    });
  }

  function buildSuggestedAction_(nextStep, action, code) {
    var normalizedStep = normalizeKey_(nextStep);
    if (normalizedStep === 'CONFIRMA TU CELULAR') {
      return code
        ? 'Confirma tu celular ingresando el código que te compartimos y sigue la guía paso a paso.'
        : 'Confirma tu celular siguiendo la guía y usando el código que recibiste durante la apertura.';
    }
    if (normalizedStep === 'CONFIRMA TU CORREO') {
      return code
        ? 'Confirma tu correo ingresando el código que te compartimos y sigue la guía paso a paso.'
        : 'Confirma tu correo siguiendo la guía y usando el código que recibiste durante la apertura.';
    }
    if (normalizeKey_(action) === 'ENVIA CORREO E INCLUYE LA URL' || !action) {
      return 'Sigue la guía para retomar tu proceso de apertura y avanzar en este paso.';
    }
    return action;
  }

  function buildMessagePreview_(recipient) {
    var firstName = getFirstName_(recipient);
    var greeting = recipient.isMetaLead
      ? 'Hola ' + firstName + ', gracias por escribirnos desde Meta.'
      : 'Hola ' + firstName + ', te ayudamos a retomar tu apertura Billú.';
    var stepLine = recipient.nextStep
      ? 'Vemos que tu siguiente paso es: ' + recipient.nextStep + '.'
      : 'Vemos interés en tu apertura y queremos ayudarte a avanzar.';
    var codeLine = recipient.code ? 'Tu código de apoyo es: ' + recipient.code + '.' : '';
    var actionLine = recipient.customerAction || 'Te compartimos la guía para continuar.';
    var guideLine = recipient.url ? 'Guía: ' + recipient.url : '';
    var humanLine = 'Si prefieres, responde HUMANO y te canalizamos con una persona.';
    var text = [
      greeting,
      stepLine,
      actionLine,
      codeLine,
      guideLine,
      humanLine
    ].filter(Boolean).join(' ');

    return {
      title: recipient.isMetaLead ? 'Autorespuesta Meta sugerida' : 'Mensaje de recuperación sugerido',
      text: text,
      quickReplies: ['Ver guía', 'Ya lo hice', 'Necesito ayuda humana']
    };
  }

  function buildSummary_(rows, handoffRows) {
    var ready = rows.filter(function (row) { return row.readyToAssist; });
    var metaLeads = rows.filter(function (row) { return row.isMetaLead; });
    var open24h = rows.filter(function (row) { return row.within24hWindow; });
    var needsHuman = rows.filter(function (row) { return row.needsHuman; });
    var withPhone = rows.filter(function (row) { return row.phone; });
    return {
      totalContacts: rows.length,
      withPhone: withPhone.length,
      readyToAssist: ready.length,
      metaLeads: metaLeads.length,
      open24hWindow: open24h.length,
      needsHuman: needsHuman.length,
      handoffOpen: handoffRows.filter(function (row) { return normalizeKey_(row.estado) !== 'RESUELTO'; }).length
    };
  }

  function buildStepBreakdown_(rows) {
    var groups = {};
    rows.forEach(function (row) {
      var key = row.nextStep || (row.isMetaLead ? 'LEAD META SIN PASO' : 'SIN PASO');
      if (!groups[key]) {
        groups[key] = {
          nextStep: key,
          total: 0,
          metaLeads: 0,
          open24hWindow: 0,
          readyToAssist: 0,
          needsHuman: 0
        };
      }
      groups[key].total += 1;
      if (row.isMetaLead) groups[key].metaLeads += 1;
      if (row.within24hWindow) groups[key].open24hWindow += 1;
      if (row.readyToAssist) groups[key].readyToAssist += 1;
      if (row.needsHuman) groups[key].needsHuman += 1;
    });
    return Object.keys(groups).map(function (key) {
      return groups[key];
    }).sort(function (a, b) {
      return b.total - a.total || a.nextStep.localeCompare(b.nextStep);
    });
  }

  function loadHandoffRows_() {
    var sheet = ensureHandoffSheet_();
    var payload = getValuesAsObjects_(sheet);
    var headerMap = payload.headerMap;
    var dateIndex = resolveIndex_(headerMap, ['Fecha']);
    var rowNumberIndex = resolveIndex_(headerMap, ['Row Number']);
    var nameIndex = resolveIndex_(headerMap, ['Nombre']);
    var emailIndex = resolveIndex_(headerMap, ['Email']);
    var phoneIndex = resolveIndex_(headerMap, ['Telefono']);
    var stepIndex = resolveIndex_(headerMap, ['Siguiente Paso']);
    var originIndex = resolveIndex_(headerMap, ['Origen']);
    var metaLeadIndex = resolveIndex_(headerMap, ['Meta Lead Id']);
    var reasonIndex = resolveIndex_(headerMap, ['Motivo']);
    var ownerIndex = resolveIndex_(headerMap, ['Asignado A']);
    var statusIndex = resolveIndex_(headerMap, ['Estado']);
    var messageIndex = resolveIndex_(headerMap, ['Ultimo Mensaje']);
    return payload.rows.map(function (row) {
      return {
        fecha: String(dateIndex > -1 ? row[dateIndex] : '').trim(),
        rowNumber: Number(rowNumberIndex > -1 ? row[rowNumberIndex] : 0) || 0,
        nombre: String(nameIndex > -1 ? row[nameIndex] : '').trim(),
        email: Utils.normalizeEmail(emailIndex > -1 ? row[emailIndex] : ''),
        telefono: normalizePhone_(phoneIndex > -1 ? row[phoneIndex] : ''),
        nextStep: String(stepIndex > -1 ? row[stepIndex] : '').trim(),
        origin: String(originIndex > -1 ? row[originIndex] : '').trim(),
        metaLeadId: String(metaLeadIndex > -1 ? row[metaLeadIndex] : '').trim(),
        motivo: String(reasonIndex > -1 ? row[reasonIndex] : '').trim(),
        asignadoA: String(ownerIndex > -1 ? row[ownerIndex] : '').trim(),
        estado: String(statusIndex > -1 ? row[statusIndex] : '').trim() || 'ABIERTO',
        ultimoMensaje: String(messageIndex > -1 ? row[messageIndex] : '').trim()
      };
    }).filter(function (row) {
      return row.nombre || row.telefono || row.email;
    });
  }

  function appendHandoffRow_(recipient, reason, userContext) {
    var sheet = ensureHandoffSheet_();
    sheet.appendRow([
      Utils.formatDate(new Date()),
      recipient.rowNumber,
      recipient.fullName || recipient.firstName || '',
      recipient.email || '',
      recipient.phone || '',
      recipient.nextStep || '',
      recipient.origin || '',
      recipient.metaLeadId || '',
      reason || recipient.handoffReason || 'Solicitud de apoyo humano',
      (userContext && userContext.email) || '',
      'ABIERTO',
      recipient.lastMessage || '',
      (userContext && userContext.email) || ''
    ]);
  }

  function loadInboundInbox_() {
    var sheet = ensureLogSheet_();
    var lastRow = sheet.getLastRow();
    var lastColumn = Math.max(sheet.getLastColumn(), 7);
    if (lastRow < 2) {
      return {
        totalMessages: 0,
        uniqueContacts: 0,
        rows: []
      };
    }

    var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getDisplayValues();
    var countsByPhone = {};
    values.forEach(function (row) {
      var rawPhone = String(row[1] || '').trim();
      var phone = normalizePhone_(rawPhone) || rawPhone || 'SIN_TELEFONO';
      countsByPhone[phone] = (countsByPhone[phone] || 0) + 1;
    });

    var seen = {};
    var rows = [];
    for (var idx = values.length - 1; idx >= 0; idx -= 1) {
      var valueRow = values[idx];
      var rawPhoneValue = String(valueRow[1] || '').trim();
      var phoneValue = normalizePhone_(rawPhoneValue) || rawPhoneValue || 'SIN_TELEFONO';
      if (seen[phoneValue]) continue;
      seen[phoneValue] = true;
      rows.push({
        phone: phoneValue,
        lastAt: String(valueRow[0] || '').trim(),
        type: String(valueRow[2] || '').trim(),
        lastMessage: String(valueRow[3] || '').trim(),
        resolved: normalizeKey_(valueRow[5]) === 'SI',
        totalMessages: Number(countsByPhone[phoneValue] || 0)
      });
      if (rows.length >= 120) break;
    }

    return {
      totalMessages: values.length,
      uniqueContacts: Object.keys(countsByPhone).length,
      rows: rows
    };
  }

  function buildSourceMeta_() {
    return {
      spreadsheetId: AppConfig.getWhatsAppAgentSpreadsheetId(),
      stepsSheetName: AppConfig.getWhatsAppAgentStepsSheetName(),
      sendsSheetName: AppConfig.getWhatsAppAgentSendsSheetName(),
      outboundCampaignSheetName: getOutboundCampaignSheetName_(),
      handoffSheetName: AppConfig.getWhatsAppAgentHandoffSheetName(),
      whatsappApiConfigured: !!(AppConfig.getWhatsAppPhoneNumberId() && AppConfig.getWhatsAppAccessToken()),
      whatsappVerifyTokenConfigured: !!AppConfig.getWhatsAppVerifyToken()
    };
  }

  function getRecipientByRowNumber_(rowNumber) {
    var stepCatalog = loadStepCatalog_();
    var recipients = mapSendRows_(stepCatalog);
    var match = recipients.filter(function (row) {
      return Number(row.rowNumber) === Number(rowNumber);
    })[0];
    if (!match) throw new Error('No se encontró el contacto seleccionado en Envios.');
    return match;
  }

  function isCampaignAlreadySent_(statusValue) {
    var normalized = normalizeKey_(statusValue);
    return ['ENVIADO', 'SENT', 'OK', 'EXITOSO'].indexOf(normalized) > -1;
  }

  function isCampaignExcludedByStatus_(statusValue) {
    var normalized = normalizeKey_(statusValue);
    if (!normalized) return false;
    return /^(NO ENVIAR|OMITIR|EXCLUIR|BAJA|DO NOT SEND)/.test(normalized);
  }

  function isCampaignBlockedByStatus_(statusValue) {
    var normalized = normalizeKey_(statusValue);
    if (!normalized) return false;
    if (isCampaignAlreadySent_(normalized)) return true;
    return isCampaignExcludedByStatus_(normalized);
  }

  function mapOutboundCampaignRows_(sheet) {
    ensureOutboundCampaignTrackingColumns_(sheet);
    var payload = getValuesAsObjects_(sheet);
    var headerMap = payload.headerMap;
    var nameIndex = resolveIndex_(headerMap, ['Nombre', 'Nombre y Apellido', 'Nombre Completo']);
    var phoneIndex = resolveIndex_(headerMap, ['Telefono', 'Teléfono', 'Celular', 'Whatsapp', 'WhatsApp', 'Numero', 'Número']);
    var optInIndex = resolveIndex_(headerMap, ['OptIn WhatsApp', 'OptIn', 'WhatsApp OptIn']);
    var statusIndex = resolveIndex_(headerMap, ['Estado Campaña WhatsApp', 'Estado WhatsApp Campaña', 'Estado WhatsApp']);
    var templateIndex = resolveIndex_(headerMap, ['WhatsApp Template', 'Plantilla WhatsApp', 'Template WhatsApp', 'Template']);
    var messageIndex = resolveIndex_(headerMap, ['Mensaje Campaña WhatsApp', 'Mensaje WhatsApp', 'Mensaje']);
    var languageIndex = resolveIndex_(headerMap, ['Idioma Template', 'Template Language', 'Language']);
    var lastSendIndex = resolveIndex_(headerMap, ['Ultimo Envio Campaña WhatsApp']);

    return payload.rows.map(function (row, index) {
      var status = String(statusIndex > -1 ? row[statusIndex] : '').trim();
      var phone = normalizePhone_(phoneIndex > -1 ? row[phoneIndex] : '');
      var optIn = parseBooleanLike_(optInIndex > -1 ? row[optInIndex] : '', true);
      var alreadySent = isCampaignAlreadySent_(status);
      var excludedByStatus = isCampaignExcludedByStatus_(status);
      var blockedByStatus = alreadySent || excludedByStatus;
      return {
        rowNumber: index + 2,
        name: String(nameIndex > -1 ? row[nameIndex] : '').trim(),
        phone: phone,
        optIn: optIn,
        status: status,
        alreadySent: alreadySent,
        excludedByStatus: excludedByStatus,
        templateName: String(templateIndex > -1 ? row[templateIndex] : '').trim(),
        messageText: String(messageIndex > -1 ? row[messageIndex] : '').trim(),
        languageCode: String(languageIndex > -1 ? row[languageIndex] : '').trim(),
        lastSendAt: String(lastSendIndex > -1 ? row[lastSendIndex] : '').trim(),
        hasPhone: !!phone,
        blockedByStatus: blockedByStatus,
        eligible: !!(phone && optIn && !blockedByStatus),
        retryEligible: !!(phone && optIn && !excludedByStatus)
      };
    }).filter(function (row) {
      return row.phone || row.name || row.status || row.messageText || row.templateName;
    });
  }

  function buildOutboundCampaignSummary_(rows) {
    rows = rows || [];
    var withPhone = rows.filter(function (row) { return row.hasPhone; }).length;
    var optedIn = rows.filter(function (row) { return row.optIn; }).length;
    var blockedByStatus = rows.filter(function (row) { return row.blockedByStatus; }).length;
    var alreadySent = rows.filter(function (row) { return isCampaignAlreadySent_(row.status); }).length;
    var eligible = rows.filter(function (row) { return row.eligible; }).length;
    var retryEligible = rows.filter(function (row) { return row.retryEligible; }).length;
    var retryableAlreadySent = rows.filter(function (row) {
      return row.retryEligible && row.alreadySent;
    }).length;
    return {
      sheetName: getOutboundCampaignSheetName_(),
      totalRows: rows.length,
      withPhone: withPhone,
      optedIn: optedIn,
      blockedByStatus: blockedByStatus,
      alreadySent: alreadySent,
      eligible: eligible,
      retryEligible: retryEligible,
      retryableAlreadySent: retryableAlreadySent,
      apiConfigured: !!(AppConfig.getWhatsAppPhoneNumberId() && AppConfig.getWhatsAppAccessToken()),
      defaultMessage: OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE
    };
  }

  function getOutboundCampaignSummary() {
    var sheet = getOutboundCampaignSheet_();
    var rows = mapOutboundCampaignRows_(sheet);
    return buildOutboundCampaignSummary_(rows);
  }

  function getSafeOutboundCampaignSummary_() {
    try {
      return getOutboundCampaignSummary();
    } catch (error) {
      return {
        sheetName: getOutboundCampaignSheetName_(),
        totalRows: 0,
        withPhone: 0,
        optedIn: 0,
        blockedByStatus: 0,
        alreadySent: 0,
        eligible: 0,
        retryEligible: 0,
        retryableAlreadySent: 0,
        apiConfigured: !!(AppConfig.getWhatsAppPhoneNumberId() && AppConfig.getWhatsAppAccessToken()),
        defaultMessage: OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE,
        error: error && error.message ? error.message : String(error || 'No fue posible leer la campaña outbound.')
      };
    }
  }

  function buildWhatsAppEndpoint_() {
    var phoneNumberId = AppConfig.getWhatsAppPhoneNumberId();
    if (!phoneNumberId) throw new Error('Falta WHATSAPP_PHONE_NUMBER_ID en la configuración de Script Properties.');
    return 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/messages';
  }

  function parseWhatsAppErrorMessage_(responseJson, fallbackText) {
    if (responseJson && responseJson.error && responseJson.error.message) {
      return String(responseJson.error.message);
    }
    return String(fallbackText || 'Error al enviar mensaje de WhatsApp.');
  }

  function sendWhatsAppTextMessage_(to, body) {
    var token = AppConfig.getWhatsAppAccessToken();
    if (!token) throw new Error('Falta WHATSAPP_ACCESS_TOKEN en la configuración de Script Properties.');
    var endpoint = buildWhatsAppEndpoint_();
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
    var responseJson = Utils.parseJson(bodyText, {});
    var messageId = responseJson && responseJson.messages && responseJson.messages[0]
      ? String(responseJson.messages[0].id || '')
      : '';
    var ok = statusCode >= 200 && statusCode < 300;
    return {
      ok: ok,
      statusCode: statusCode,
      mode: 'text',
      messageId: messageId,
      errorMessage: ok ? '' : parseWhatsAppErrorMessage_(responseJson, bodyText),
      response: responseJson || bodyText
    };
  }

  function sendWhatsAppTemplateMessage_(to, templateName, languageCode) {
    var token = AppConfig.getWhatsAppAccessToken();
    if (!token) throw new Error('Falta WHATSAPP_ACCESS_TOKEN en la configuración de Script Properties.');
    var endpoint = buildWhatsAppEndpoint_();
    var payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode || AppConfig.get('WHATSAPP_AGENT_CAMPAIGN_TEMPLATE_LANG', 'es_MX')
        }
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
    var responseJson = Utils.parseJson(bodyText, {});
    var messageId = responseJson && responseJson.messages && responseJson.messages[0]
      ? String(responseJson.messages[0].id || '')
      : '';
    var ok = statusCode >= 200 && statusCode < 300;
    return {
      ok: ok,
      statusCode: statusCode,
      mode: 'template',
      messageId: messageId,
      errorMessage: ok ? '' : parseWhatsAppErrorMessage_(responseJson, bodyText),
      response: responseJson || bodyText
    };
  }

  function sendOutboundCampaignMessage_(recipient, overrideMessage) {
    var templateName = String(recipient.templateName || AppConfig.get('WHATSAPP_AGENT_CAMPAIGN_TEMPLATE_NAME', '') || '').trim();
    if (templateName) {
      return sendWhatsAppTemplateMessage_(recipient.phone, templateName, recipient.languageCode);
    }
    var message = String(overrideMessage || recipient.messageText || OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE).trim();
    if (!message) message = OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE;
    return sendWhatsAppTextMessage_(recipient.phone, message);
  }

  function sendOutboundCampaign(payload, userContext) {
    var sheet = getOutboundCampaignSheet_();
    var rows = mapOutboundCampaignRows_(sheet);
    var includeAlreadySent = parseBooleanLike_(payload && payload.includeAlreadySent, false);
    var eligibleRows = rows.filter(function (row) {
      return includeAlreadySent ? row.retryEligible : row.eligible;
    });
    var maxToSend = Number(payload && payload.maxToSend);
    var overrideMessage = String((payload && payload.messageText) || '').trim();

    if (maxToSend > 0) {
      eligibleRows = eligibleRows.slice(0, maxToSend);
    }

    var sent = 0;
    var failures = [];
    var nowText = Utils.formatDate(new Date());
    eligibleRows.forEach(function (recipient) {
      try {
        var sendResult = sendOutboundCampaignMessage_(recipient, overrideMessage);
        if (sendResult.ok) {
          sent += 1;
          updateOutboundCampaignRow_(sheet, recipient.rowNumber, {
            'Estado Campaña WhatsApp': 'ENVIADO',
            'Ultimo Envio Campaña WhatsApp': nowText,
            'Mensaje Campaña WhatsApp': sendResult.mode === 'template'
              ? ('Template: ' + (recipient.templateName || AppConfig.get('WHATSAPP_AGENT_CAMPAIGN_TEMPLATE_NAME', '')))
              : String(overrideMessage || recipient.messageText || OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE),
            'Error Campaña WhatsApp': '',
            'Message Id Campaña WhatsApp': sendResult.messageId || '',
            'Usuario Campaña WhatsApp': (userContext && userContext.email) || ''
          });
        } else {
          failures.push({
            rowNumber: recipient.rowNumber,
            phone: recipient.phone,
            error: sendResult.errorMessage || 'Error no identificado.'
          });
          updateOutboundCampaignRow_(sheet, recipient.rowNumber, {
            'Estado Campaña WhatsApp': 'ERROR',
            'Ultimo Envio Campaña WhatsApp': nowText,
            'Mensaje Campaña WhatsApp': sendResult.mode === 'template'
              ? ('Template: ' + (recipient.templateName || AppConfig.get('WHATSAPP_AGENT_CAMPAIGN_TEMPLATE_NAME', '')))
              : String(overrideMessage || recipient.messageText || OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE),
            'Error Campaña WhatsApp': sendResult.errorMessage || 'Error no identificado.',
            'Message Id Campaña WhatsApp': sendResult.messageId || '',
            'Usuario Campaña WhatsApp': (userContext && userContext.email) || ''
          });
        }
      } catch (error) {
        failures.push({
          rowNumber: recipient.rowNumber,
          phone: recipient.phone,
          error: error && error.message ? error.message : String(error || 'Error no identificado.')
        });
        updateOutboundCampaignRow_(sheet, recipient.rowNumber, {
          'Estado Campaña WhatsApp': 'ERROR',
          'Ultimo Envio Campaña WhatsApp': nowText,
          'Mensaje Campaña WhatsApp': String(overrideMessage || recipient.messageText || OUTBOUND_CAMPAIGN_DEFAULT_MESSAGE),
          'Error Campaña WhatsApp': error && error.message ? error.message : String(error || 'Error no identificado.'),
          'Message Id Campaña WhatsApp': '',
          'Usuario Campaña WhatsApp': (userContext && userContext.email) || ''
        });
      }
    });

    var refreshedRows = mapOutboundCampaignRows_(sheet);
    return {
      sheetName: getOutboundCampaignSheetName_(),
      includeAlreadySent: includeAlreadySent,
      attempted: eligibleRows.length,
      sent: sent,
      failed: failures.length,
      failures: failures.slice(0, 20),
      summary: buildOutboundCampaignSummary_(refreshedRows)
    };
  }

  function getDashboard() {
    var stepCatalog = loadStepCatalog_();
    var recipients = mapSendRows_(stepCatalog);
    var handoffRows = loadHandoffRows_();
    var inboundInbox = loadInboundInbox_();
    var defaultPreview = recipients.filter(function (row) { return row.readyToAssist; })[0] || recipients[0] || null;

    return {
      source: buildSourceMeta_(),
      summary: buildSummary_(recipients, handoffRows),
      campaign: getSafeOutboundCampaignSummary_(),
      inboundInbox: inboundInbox,
      stepBreakdown: buildStepBreakdown_(recipients),
      recipients: recipients,
      handoffQueue: handoffRows.slice(0, 25),
      defaultPreviewRowNumber: defaultPreview ? defaultPreview.rowNumber : null
    };
  }

  function previewMessage(payload) {
    var recipient = getRecipientByRowNumber_(payload && payload.rowNumber);
    var preview = buildMessagePreview_(recipient);
    return {
      rowNumber: recipient.rowNumber,
      recipient: recipient,
      preview: preview
    };
  }

  function markNeedsHuman(payload, userContext) {
    var recipient = getRecipientByRowNumber_(payload && payload.rowNumber);
    var reason = String((payload && payload.reason) || recipient.handoffReason || '').trim() || 'Cliente solicita seguimiento humano';
    var sheet = getSendsSheet_();
    updateSendRow_(sheet, recipient.rowNumber, {
      'Necesita Humano': 'SI',
      'Responsable Humano': (userContext && userContext.email) || '',
      'Motivo Escalamiento': reason,
      'Estado WhatsApp': 'ESCALADO',
      'Ultimo Intento WhatsApp': Utils.formatDate(new Date())
    });
    appendHandoffRow_(recipient, reason, userContext);
    return {
      rowNumber: recipient.rowNumber,
      reason: reason,
      assignedTo: (userContext && userContext.email) || ''
    };
  }

  function logIncomingMessage_(phone, type, message, payload, resolved, userContext) {
    var sheet = ensureLogSheet_();
    sheet.appendRow([
      Utils.formatDate(new Date()),
      phone || '',
      type || '',
      message || '',
      Utils.stringifyJson(payload || {}),
      resolved ? 'SI' : 'NO',
      (userContext && userContext.email) || ''
    ]);
  }

  function findRecipientByPhone_(phone) {
    if (!phone) return null;
    var stepCatalog = loadStepCatalog_();
    var recipients = mapSendRows_(stepCatalog);
    return recipients.filter(function (row) {
      return row.phone === phone;
    })[0] || null;
  }

  function getFirstMessageText_(payload) {
    try {
      var entry = (((payload || {}).entry || [])[0] || {});
      var change = ((entry.changes || [])[0] || {});
      var value = change.value || {};
      var messages = value.messages || [];
      if (!messages.length) return '';
      var message = messages[0];
      if (message.text && message.text.body) return String(message.text.body || '');
      if (message.button && message.button.text) return String(message.button.text || '');
      if (message.interactive && message.interactive.button_reply && message.interactive.button_reply.title) {
        return String(message.interactive.button_reply.title || '');
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  function getFirstMessagePhone_(payload) {
    try {
      var entry = (((payload || {}).entry || [])[0] || {});
      var change = ((entry.changes || [])[0] || {});
      var value = change.value || {};
      var contacts = value.contacts || [];
      if (contacts.length && contacts[0].wa_id) return normalizePhone_(contacts[0].wa_id);
      var messages = value.messages || [];
      if (messages.length && messages[0].from) return normalizePhone_(messages[0].from);
      return '';
    } catch (error) {
      return '';
    }
  }

  function ingestWebhook(payload) {
    var phone = getFirstMessagePhone_(payload);
    var message = getFirstMessageText_(payload);
    var recipient = findRecipientByPhone_(phone);
    var sheet = getSendsSheet_();
    var resolved = false;

    if (recipient) {
      var normalizedMessage = normalizeKey_(message);
      var needsHuman = /HUMANO|ASESOR|AYUDA|AGENTE|PERSONA/.test(normalizedMessage);
      updateSendRow_(sheet, recipient.rowNumber, {
        'Ultima Interaccion WhatsApp': Utils.formatDate(new Date()),
        'Ultimo Mensaje WhatsApp': message,
        'Estado WhatsApp': needsHuman ? 'ESCALADO' : 'RESPONDIO',
        'Necesita Humano': needsHuman ? 'SI' : (recipient.needsHuman ? 'SI' : 'NO'),
        'Motivo Escalamiento': needsHuman ? 'Escalado desde webhook por solicitud del cliente' : recipient.handoffReason || ''
      });
      if (needsHuman) appendHandoffRow_(recipient, 'Escalado desde webhook por solicitud del cliente', { email: 'webhook-whatsapp' });
      resolved = true;
    }

    logIncomingMessage_(phone, 'WEBHOOK', message, payload, resolved, { email: 'webhook-whatsapp' });
    return {
      phone: phone,
      message: message,
      matchedRecipient: !!recipient,
      escalated: resolved && /HUMANO|ASESOR|AYUDA|AGENTE|PERSONA/.test(normalizeKey_(message))
    };
  }

  return {
    getDashboard: getDashboard,
    getOutboundCampaignSummary: getOutboundCampaignSummary,
    sendOutboundCampaign: sendOutboundCampaign,
    previewMessage: previewMessage,
    markNeedsHuman: markNeedsHuman,
    ingestWebhook: ingestWebhook
  };
})();
