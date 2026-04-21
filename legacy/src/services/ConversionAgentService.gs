var ConversionAgentService = (function () {
  var TRACKING_COLUMNS = [
    'Accion Catalogo',
    'URL Catalogo',
    'Fecha Ultimo Envio',
    'Estado Envio',
    'Intentos Envio',
    'Ultimo Asunto',
    'Ultimo Usuario Envio'
  ];

  var BILLU_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 566.93 566.93" aria-label="Billu" role="img"><defs><style>.cls-1{fill:#31d3ae;}</style></defs><g><path class="cls-1" d="M118.3,371.92v19.37h-2.93v-2.23c-1.67,1.7-4.34,2.52-7.28,2.52-5.46,0-9.42-2.41-9.42-7.31v-.82c0-4.93,4.08-7.1,9.24-7.1,3.14,0,5.81,.82,7.45,2.46v-6.9h2.93Zm-2.93,12.38v-.88c0-3.7-3.99-4.43-7.45-4.43s-6.25,1-6.25,4.46v.82c0,3.52,2.61,4.67,6.43,4.67,3.23,0,7.28-.65,7.28-4.64Z"/><path class="cls-1" d="M123.5,384.51v-1.09c0-3.93,2.29-7.07,10.12-7.07,5.58,0,8.98,1.47,8.98,4.4v.38c0,3.81-5.96,4.49-9.01,4.49-1.61,0-5.02-.26-7.16-.56,.23,2.49,2.44,3.99,6.87,3.99,4.69,0,6.22-1.23,6.57-3.02h2.99c-.09,3.02-3.08,5.55-9.57,5.55-7.36,0-9.8-3.23-9.8-7.07Zm16.11-3.67v-.03c0-1.03-.82-1.85-5.99-1.85-5.55,0-7.13,1.58-7.13,3.49,2.29,.32,5.69,.5,7.13,.5,5.58,0,5.99-.94,5.99-2.11Z"/><path class="cls-1" d="M174.34,388.15h-12.38l-1.73,3.14h-3.43l9.65-17.52-.06-.09h3.52l-.03,.09,9.62,17.52h-3.43l-1.73-3.14Zm-1.61-2.93l-4.58-8.33-4.58,8.33h9.15Z"/><path class="cls-1" d="M185.67,376.62h4.46v2.64h-4.49v12.03h-2.93l-.09-12.03h-3.05v-2.64h3.05c.09-1.67,.73-4.99,5.93-4.99,1.29,0,2.52,.18,4.17,.68l-.5,2.29c-1.41-.29-2.73-.44-3.58-.44-1.41,0-2.7,.32-2.96,2.46Z"/><path class="cls-1" d="M192.65,376.62h2.93v14.67h-2.93v-14.67Zm.09-2.58v-.12c0-.76,.47-1.12,1.41-1.12s1.44,.35,1.44,1.12v.09c0,.73-.47,1.14-1.44,1.14s-1.41-.41-1.41-1.12Z"/><path class="cls-1" d="M214.28,376.44l-.23,2.7c-1-.09-1.82-.18-2.82-.18-4.9,0-7.66,1.97-7.66,6.43v5.9h-2.93v-14.67h2.93v2.93c1.38-1.82,3.55-2.88,6.43-3.23,2.2-.12,3.46-.06,4.28,.12Z"/><path class="cls-1" d="M253.21,382.31v8.98h-2.99v-8.07c0-3.32-2-4.34-4.69-4.34-4.23,0-7.78,3.96-7.78,7.25v5.16h-2.99v-8.07c0-3.32-2.02-4.34-4.72-4.34-4.2,0-7.78,3.96-7.78,7.25v5.16h-2.93v-14.67h2.93v3.96c1.94-2.67,5.16-4.23,8.22-4.23,3.29,0,6.28,1.53,7.07,4.4,1.97-2.79,5.31-4.4,8.45-4.4,3.79,0,7.22,2.08,7.22,5.96Z"/><path class="cls-1" d="M258.08,384.51v-1.09c0-3.93,2.29-7.07,10.12-7.07,5.57,0,8.98,1.47,8.98,4.4v.38c0,3.81-5.96,4.49-9.01,4.49-1.61,0-5.02-.26-7.16-.56,.23,2.49,2.44,3.99,6.87,3.99,4.69,0,6.22-1.23,6.57-3.02h2.99c-.09,3.02-3.08,5.55-9.57,5.55-7.37,0-9.8-3.23-9.8-7.07Zm16.11-3.67v-.03c0-1.03-.82-1.85-5.99-1.85-5.55,0-7.13,1.58-7.13,3.49,2.29,.32,5.69,.5,7.13,.5,5.57,0,5.99-.94,5.99-2.11Z"/></g><g><path class="cls-1" d="M257.45,253.75c0-1.38,.4-2.53,1.19-3.46,.8-.93,1.96-1.39,3.5-1.39h13.19c.58,0,1.18,.12,1.79,.36,.61,.24,1.15,.59,1.63,1.03s.87,.97,1.19,1.55c.32,.58,.48,1.22,.48,1.91v91.32c0,3.18-1.67,4.77-5.01,4.77h-13.2c-3.18,0-4.77-1.59-4.77-4.77v-91.32Z"/><path class="cls-1" d="M300.6,223.71c0-1.38,.37-2.52,1.11-3.42,.74-.9,1.88-1.35,3.42-1.35h13.91c1.06,0,2.05,.45,2.98,1.35,.92,.9,1.39,2.04,1.39,3.42v121.37c0,1.59-.44,2.78-1.31,3.58-.87,.8-2.05,1.19-3.53,1.19h-13.27c-1.7,0-2.9-.4-3.62-1.19-.71-.79-1.07-1.99-1.07-3.58v-121.37Z"/><path class="cls-1" d="M340.03,223.71c0-1.38,.37-2.52,1.11-3.42,.74-.9,1.88-1.35,3.42-1.35h13.91c1.06,0,2.05,.45,2.98,1.35,.92,.9,1.39,2.04,1.39,3.42v121.37c0,1.59-.44,2.78-1.31,3.58-.87,.8-2.05,1.19-3.53,1.19h-13.27c-1.7,0-2.9-.4-3.62-1.19-.71-.79-1.07-1.99-1.07-3.58v-121.37Z"/><path class="cls-1" d="M422.53,215.44c.42-1.16,1.02-2.01,1.79-2.54,.77-.53,1.6-.8,2.5-.8h14.15c.85,0,1.44,.2,1.79,.6,.34,.39,.51,.89,.51,1.47,0,.42-.04,.89-.12,1.39-.08,.5-.22,.99-.44,1.47l-7.55,16.85c-1.01,2.23-2.41,3.34-4.21,3.34h-12.4c-.9,0-1.48-.21-1.75-.63-.27-.42-.4-.93-.4-1.51,0-.53,.03-1.06,.08-1.59,.05-.53,.21-1.08,.48-1.67l5.56-16.37Z"/><path class="cls-1" d="M424.39,351.9c-24.23-1.13-42.83-22.1-42.83-46.35v-56.65c0-2.95,2.39-5.34,5.34-5.34h12.51c2.95,0,5.34,2.39,5.34,5.34v57.2c0,11.14,7.98,21.13,19.03,22.5,13.24,1.64,24.55-8.7,24.55-21.62v-58.07c0-2.95,2.39-5.34,5.34-5.34h12.51c2.95,0,5.34,2.39,5.34,5.34v58.07c0,25.51-21.35,46.13-47.12,44.93Z"/><circle class="cls-1" cx="268.21" cy="231.82" r="11.54"/><path class="cls-1" d="M221.58,252.8c5.41-7.41,8.65-16.52,8.65-26.4v-6.16c0-24.79-20.1-44.89-44.89-44.89h-51.32c-19.94,0-36.11,16.17-36.11,36.11v121.94c0,9.05,7.34,16.39,16.39,16.39h83.31c24.78,0,44.86-20.09,44.86-44.86v-14.23c0-15.95-8.35-29.93-20.88-37.89Zm-98.21-40.18v-33.17c0-6.52,5.29-11.81,11.81-11.81h50.16c10.73,0,19.43,8.7,19.43,19.43v6.16c0,10.71-8.68,19.39-19.39,19.39h-62Zm93.63,92.29c0,10.71-8.68,19.4-19.4,19.4h-67.67c-3.63,0-6.57-2.94-6.57-6.57v-46.48h74.2c10.73,0,19.43,8.7,19.43,19.43v14.23Z"/></g></svg>';

  function getSpreadsheet_() {
    return SpreadsheetApp.openById(AppConfig.getConversionAgentSpreadsheetId());
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
    var sheet = spreadsheet.getSheetByName(AppConfig.getConversionAgentStepsSheetName())
      || findSheetByNormalizedName_(spreadsheet, AppConfig.getConversionAgentStepsSheetName())
      || findSheetByHeaders_(spreadsheet, ['Siguiente Paso', 'Acción', 'URL']);
    if (!sheet) throw new Error('No se encontró la pestaña PASOS del Agente de Conversión.');
    return sheet;
  }

  function getSendsSheet_() {
    var spreadsheet = getSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(AppConfig.getConversionAgentSendsSheetName())
      || findSheetByNormalizedName_(spreadsheet, AppConfig.getConversionAgentSendsSheetName())
      || findSheetByHeaders_(spreadsheet, ['Email', 'Siguiente Paso']);
    if (!sheet) throw new Error('No se encontró la pestaña envios del Agente de Conversión.');
    return sheet;
  }

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
    for (var i = 0; i < candidates.length; i += 1) {
      var key = normalizeKey_(candidates[i]);
      if (headerMap.hasOwnProperty(key)) return headerMap[key];
    }
    return -1;
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

  function getFirstName_(rowObject) {
    var preferred = String(rowObject.firstName || '').trim();
    if (preferred) return preferred;
    var fullName = String(rowObject.fullName || '').trim();
    if (!fullName) return 'cliente';
    return fullName.split(/\s+/)[0];
  }

  function resolveCodeValue_(row, headerMap) {
    var codeIndex = resolveIndex_(headerMap, [
      'Codigo',
      'Código',
      'Codigo OTP',
      'Código OTP',
      'OTP',
      'Token',
      'Codigo Confirmacion',
      'Código Confirmación',
      'Codigo Verificacion',
      'Código Verificación'
    ]);
    return String(codeIndex > -1 ? row[codeIndex] : '').trim();
  }

  function buildCustomerAction_(recipient) {
    var nextStepKey = normalizeKey_(recipient && recipient.nextStep);
    var catalogAction = String(recipient && recipient.action || '').trim();
    var code = String(recipient && recipient.code || '').trim();

    if (nextStepKey === 'CONFIRMA TU CELULAR') {
      return code
        ? 'Abre la guía, ingresa el código que te compartimos y confirma tu celular para continuar.'
        : 'Abre la guía y confirma tu celular con el código que recibiste durante tu proceso de apertura.';
    }

    if (nextStepKey === 'CONFIRMA TU CORREO') {
      return code
        ? 'Abre la guía, ingresa el código que te compartimos y confirma tu correo para continuar.'
        : 'Abre la guía y confirma tu correo con el código que recibiste durante tu proceso de apertura.';
    }

    if (!catalogAction || normalizeKey_(catalogAction) === 'ENVIA CORREO E INCLUYE LA URL') {
      return 'Abre la guía y completa este paso para retomar tu apertura de cuenta.';
    }

    return catalogAction;
  }

  function loadStepCatalog_() {
    var payload = getValuesAsObjects_(getStepsSheet_());
    var headerMap = payload.headerMap;
    var nextStepIndex = resolveIndex_(headerMap, ['Siguiente Paso']);
    var actionIndex = resolveIndex_(headerMap, ['Acción', 'Accion']);
    var urlIndex = resolveIndex_(headerMap, ['URL', 'Url']);

    if (nextStepIndex === -1) throw new Error('La pestaña PASOS requiere la columna Siguiente Paso.');

    var steps = payload.rows.map(function (row) {
      var nextStep = String(row[nextStepIndex] || '').trim();
      if (!nextStep) return null;
      return {
        nextStep: nextStep,
        action: String(actionIndex > -1 ? row[actionIndex] : '').trim(),
        url: String(urlIndex > -1 ? row[urlIndex] : '').trim()
      };
    }).filter(Boolean);

    return {
      list: steps,
      map: steps.reduce(function (acc, step) {
        acc[normalizeKey_(step.nextStep)] = step;
        return acc;
      }, {})
    };
  }

  function mapSendRows_(stepCatalog) {
    var payload = getValuesAsObjects_(getSendsSheet_());
    var headerMap = payload.headerMap;
    var createdAtIndex = resolveIndex_(headerMap, ['Fecha creación', 'Fecha Creacion', 'Fecha']);
    var firstNameIndex = resolveIndex_(headerMap, ['Nombre']);
    var emailIndex = resolveIndex_(headerMap, ['Email', 'Correo']);
    var fullNameIndex = resolveIndex_(headerMap, ['Nombre y Apellido', 'Nombre Completo']);
    var nextStepIndex = resolveIndex_(headerMap, ['Siguiente Paso']);
    var actionCatalogIndex = resolveIndex_(headerMap, ['Accion Catalogo', 'Acción Catalogo']);
    var urlCatalogIndex = resolveIndex_(headerMap, ['URL Catalogo']);
    var lastSentIndex = resolveIndex_(headerMap, ['Fecha Ultimo Envio']);
    var statusIndex = resolveIndex_(headerMap, ['Estado Envio']);
    var attemptsIndex = resolveIndex_(headerMap, ['Intentos Envio']);
    var lastSubjectIndex = resolveIndex_(headerMap, ['Ultimo Asunto']);
    var lastUserIndex = resolveIndex_(headerMap, ['Ultimo Usuario Envio']);

    if (emailIndex === -1 || nextStepIndex === -1) {
      throw new Error('La pestaña envios requiere al menos las columnas Email y Siguiente Paso.');
    }

    return payload.rows.map(function (row, index) {
      var nextStep = String(row[nextStepIndex] || '').trim();
      var stepConfig = stepCatalog.map[normalizeKey_(nextStep)] || null;
      var action = stepConfig && stepConfig.action
        ? stepConfig.action
        : String(actionCatalogIndex > -1 ? row[actionCatalogIndex] : '').trim();
      var url = stepConfig && stepConfig.url
        ? stepConfig.url
        : String(urlCatalogIndex > -1 ? row[urlCatalogIndex] : '').trim();
      var fullName = String(fullNameIndex > -1 ? row[fullNameIndex] : '').trim();
      var firstName = String(firstNameIndex > -1 ? row[firstNameIndex] : '').trim();
      var email = Utils.normalizeEmail(row[emailIndex]);
      var code = resolveCodeValue_(row, headerMap);
      var attempts = Number(String(attemptsIndex > -1 ? row[attemptsIndex] : '0').replace(/[^0-9.\-]/g, '')) || 0;
      var hasGuide = !!url;
      return {
        rowNumber: index + 2,
        createdAt: String(createdAtIndex > -1 ? row[createdAtIndex] : '').trim(),
        firstName: firstName,
        fullName: fullName || firstName,
        email: email,
        nextStep: nextStep,
        action: action,
        url: url,
        code: code,
        customerAction: buildCustomerAction_({
          nextStep: nextStep,
          action: action,
          code: code
        }),
        readyToSend: !!(email && nextStep && hasGuide),
        hasGuide: hasGuide,
        sendStatus: String(statusIndex > -1 ? row[statusIndex] : '').trim(),
        lastSentAt: String(lastSentIndex > -1 ? row[lastSentIndex] : '').trim(),
        sendAttempts: attempts,
        lastSubject: String(lastSubjectIndex > -1 ? row[lastSubjectIndex] : '').trim(),
        lastSentBy: String(lastUserIndex > -1 ? row[lastUserIndex] : '').trim()
      };
    }).filter(function (row) {
      return row.email || row.nextStep;
    });
  }

  function buildSummary_(rows, stepCatalog) {
    var ready = rows.filter(function (row) { return row.readyToSend; });
    var withGuide = rows.filter(function (row) { return row.hasGuide; });
    var missingGuide = rows.filter(function (row) { return row.nextStep && !row.hasGuide; });
    var sent = rows.filter(function (row) { return row.lastSentAt; });

    return {
      totalRecipients: rows.length,
      readyRecipients: ready.length,
      configuredSteps: stepCatalog.list.length,
      withGuide: withGuide.length,
      missingGuide: missingGuide.length,
      sentRecipients: sent.length,
      pendingRecipients: ready.filter(function (row) { return !row.lastSentAt; }).length
    };
  }

  function buildStepBreakdown_(rows) {
    var groups = {};
    rows.forEach(function (row) {
      var key = row.nextStep || 'SIN PASO';
      if (!groups[key]) {
        groups[key] = {
          nextStep: key,
          action: row.action || '',
          url: row.url || '',
          totalRecipients: 0,
          readyRecipients: 0,
          sentRecipients: 0,
          missingGuide: 0
        };
      }
      groups[key].totalRecipients += 1;
      if (row.readyToSend) groups[key].readyRecipients += 1;
      if (row.lastSentAt) groups[key].sentRecipients += 1;
      if (!row.hasGuide) groups[key].missingGuide += 1;
      if (!groups[key].action && row.action) groups[key].action = row.action;
      if (!groups[key].url && row.url) groups[key].url = row.url;
    });
    return Object.keys(groups).map(function (key) {
      return groups[key];
    }).sort(function (a, b) {
      return b.totalRecipients - a.totalRecipients || a.nextStep.localeCompare(b.nextStep);
    });
  }

  function getBilluLogoMarkup_() {
    return [
      '<div style="display:inline-block;">',
      '<div style="font-size:58px;line-height:0.9;font-weight:800;letter-spacing:-0.04em;color:#ffffff;">Billú</div>',
      '<div style="margin-top:6px;font-size:18px;line-height:1;font-weight:500;letter-spacing:0.02em;color:rgba(255,255,255,0.88);">de Afirme</div>',
      '</div>'
    ].join('');
  }

  function getBilluLogoBlob_() {
    if (!APP_ASSETS || !APP_ASSETS.BILLU_LOGO_BASE64) return null;
    try {
      return Utilities.newBlob(
        Utilities.base64Decode(APP_ASSETS.BILLU_LOGO_BASE64),
        'image/png',
        'billu-logo.png'
      );
    } catch (error) {
      return null;
    }
  }

  function buildPreviewData_(recipient) {
    if (!recipient) throw new Error('No se encontró el destinatario seleccionado.');
    if (!recipient.email) throw new Error('El registro no tiene email para envío.');
    if (!recipient.nextStep) throw new Error('El registro no tiene Siguiente Paso.');
    if (!recipient.hasGuide) {
      throw new Error('El paso no tiene URL de guía configurada todavía.');
    }

    var firstName = getFirstName_(recipient);
    var stepTitle = recipient.nextStep;
    var action = recipient.customerAction || 'Continúa con tu apertura siguiendo la guía.';
    var code = String(recipient.code || '').trim();
    var subject = 'Tu apertura Billú sigue en camino: ' + stepTitle;
    var plainText = [
      'Hola ' + firstName + ',',
      '',
      'Vimos que tu proceso de apertura quedó pendiente en este paso:',
      stepTitle,
      '',
      'Acción sugerida:',
      action,
      '',
      code ? 'Código de apoyo:' : '',
      code ? code : '',
      code ? '' : '',
      'Guía de ayuda:',
      recipient.url,
      '',
      'Si necesitas apoyo, vuelve a entrar al flujo y continúa donde te quedaste.',
      '',
      'Equipo Billú'
    ].join('\n');

    var logoMarkup = getBilluLogoMarkup_();

    var htmlBody = [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>',
      '<body style="margin:0;padding:0;background:#eef6f3;font-family:Avenir Next,Segoe UI,Arial,sans-serif;color:#173126;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6f3;padding:24px 12px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7e3dd;">',
      '<tr><td style="padding:28px 32px;background:linear-gradient(135deg,#0d4d4a 0%,#009f9c 100%);">',
      logoMarkup,
      '<div style="margin-top:18px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a1e9d1;">Agente de conversión</div>',
      '<div style="margin-top:10px;font-size:32px;line-height:1.15;font-weight:700;color:#ffffff;">Te ayudamos a terminar tu apertura</div>',
      '<div style="margin-top:12px;font-size:16px;line-height:1.6;color:rgba(255,255,255,0.9);">Hola ' + escapeHtml_(firstName) + ', detectamos que tu proceso quedó pendiente y queremos ponértelo fácil para continuar.</div>',
      '</td></tr>',
      '<tr><td style="padding:28px 32px 12px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6faf8;border:1px solid #d7e3dd;border-radius:20px;">',
      '<tr><td style="padding:24px;">',
      '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Siguiente paso</div>',
      '<div style="margin-top:10px;font-size:28px;line-height:1.2;font-weight:700;color:#173126;">' + escapeHtml_(stepTitle) + '</div>',
      '<div style="margin-top:14px;font-size:16px;line-height:1.6;color:#4f665d;">' + escapeHtml_(action) + '</div>',
      code ? '<div style="margin-top:18px;padding:16px 18px;border-radius:16px;background:#ffffff;border:1px dashed #9ecfc3;">'
        + '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Código de apoyo</div>'
        + '<div style="margin-top:8px;font-size:28px;line-height:1.1;font-weight:700;color:#0d4d4a;letter-spacing:0.08em;">' + escapeHtml_(code) + '</div>'
        + '</div>' : '',
      '<div style="margin-top:22px;"><a href="' + escapeHtml_(recipient.url) + '" style="display:inline-block;background:#009f9c;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:14px;">Ver guía y continuar</a></div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:8px 32px 12px;">',
      '<div style="font-size:22px;font-weight:700;color:#173126;">Guía rápida</div>',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">',
      '<tr><td style="padding:0 0 14px;"><span style="display:inline-block;width:28px;height:28px;border-radius:14px;background:#a1e9d1;color:#0d4d4a;font-weight:700;line-height:28px;text-align:center;margin-right:10px;">1</span><span style="font-size:15px;line-height:1.6;color:#4f665d;">Abre la guía del paso pendiente.</span></td></tr>',
      '<tr><td style="padding:0 0 14px;"><span style="display:inline-block;width:28px;height:28px;border-radius:14px;background:#a1e9d1;color:#0d4d4a;font-weight:700;line-height:28px;text-align:center;margin-right:10px;">2</span><span style="font-size:15px;line-height:1.6;color:#4f665d;">Completa la acción solicitada con calma y valida tus datos.</span></td></tr>',
      '<tr><td style="padding:0 0 14px;"><span style="display:inline-block;width:28px;height:28px;border-radius:14px;background:#a1e9d1;color:#0d4d4a;font-weight:700;line-height:28px;text-align:center;margin-right:10px;">3</span><span style="font-size:15px;line-height:1.6;color:#4f665d;">Regresa al flujo y continúa donde te quedaste.</span></td></tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:8px 32px 32px;">',
      '<div style="padding:20px 22px;border-radius:18px;background:#eef6f3;border:1px dashed #b9ddd2;">',
      '<div style="font-size:16px;font-weight:700;color:#173126;">¿Tuviste un bloqueo?</div>',
      '<div style="margin-top:8px;font-size:14px;line-height:1.7;color:#5f766c;">Puedes volver a abrir la guía cuantas veces necesites. Si el paso sigue sin avanzar, conserva este correo para retomar el proceso rápidamente.</div>',
      '</div>',
      '<div style="margin-top:20px;font-size:12px;line-height:1.7;color:#7a9187;">Este mensaje fue enviado para ayudarte a completar la apertura de tu cuenta Billú.</div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body>',
      '</html>'
    ].join('');

    return {
      subject: subject,
      plainText: plainText,
      htmlBody: htmlBody,
      recipient: recipient
    };
  }

  function ensureTrackingColumns_(sheet) {
    var lastColumn = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var headerMap = buildHeaderMap_(headers);
    var missing = TRACKING_COLUMNS.filter(function (header) {
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

  function updateTrackingRow_(sheet, rowNumber, updates) {
    var metadata = ensureTrackingColumns_(sheet);
    Object.keys(updates).forEach(function (header) {
      var columnIndex = metadata.headerMap[normalizeKey_(header)];
      if (columnIndex === undefined) return;
      sheet.getRange(rowNumber, columnIndex + 1).setValue(updates[header]);
    });
  }

  function syncCatalogIntoSendSheet_(stepCatalog) {
    var sheet = getSendsSheet_();
    var metadata = ensureTrackingColumns_(sheet);
    var payload = getValuesAsObjects_(sheet);
    var headerMap = payload.headerMap;
    var nextStepIndex = resolveIndex_(headerMap, ['Siguiente Paso']);
    var actionCatalogIndex = resolveIndex_(metadata.headerMap, ['Accion Catalogo', 'Acción Catalogo']);
    var urlCatalogIndex = resolveIndex_(metadata.headerMap, ['URL Catalogo']);

    if (nextStepIndex === -1 || actionCatalogIndex === -1 || urlCatalogIndex === -1) {
      return {
        updatedRows: 0,
        totalRows: payload.rows.length
      };
    }

    var updatedRows = 0;
    payload.rows.forEach(function (row, index) {
      var nextStep = String(row[nextStepIndex] || '').trim();
      if (!nextStep) return;
      var stepConfig = stepCatalog.map[normalizeKey_(nextStep)] || null;
      if (!stepConfig) return;
      var currentAction = String(row[actionCatalogIndex] || '').trim();
      var currentUrl = String(row[urlCatalogIndex] || '').trim();
      var targetAction = String(stepConfig.action || '').trim();
      var targetUrl = String(stepConfig.url || '').trim();
      if (currentAction === targetAction && currentUrl === targetUrl) return;
      updateTrackingRow_(sheet, index + 2, {
        'Accion Catalogo': targetAction,
        'URL Catalogo': targetUrl
      });
      updatedRows += 1;
    });

    return {
      updatedRows: updatedRows,
      totalRows: payload.rows.length
    };
  }

  function getRecipientByRowNumber_(rowNumber) {
    var stepCatalog = loadStepCatalog_();
    var recipients = mapSendRows_(stepCatalog);
    var match = recipients.filter(function (row) {
      return Number(row.rowNumber) === Number(rowNumber);
    })[0];
    if (!match) throw new Error('No se encontró el registro seleccionado en envios.');
    return match;
  }

  function getDashboard() {
    var stepCatalog = loadStepCatalog_();
    syncCatalogIntoSendSheet_(stepCatalog);
    var recipients = mapSendRows_(stepCatalog);
    var summary = buildSummary_(recipients, stepCatalog);
    var defaultPreviewRecipient = recipients.filter(function (row) { return row.readyToSend; })[0] || null;

    return {
      source: {
        spreadsheetId: AppConfig.getConversionAgentSpreadsheetId(),
        stepsSheetName: AppConfig.getConversionAgentStepsSheetName(),
        sendsSheetName: AppConfig.getConversionAgentSendsSheetName()
      },
      summary: summary,
      stepBreakdown: buildStepBreakdown_(recipients),
      recipients: recipients,
      defaultPreviewRowNumber: defaultPreviewRecipient ? defaultPreviewRecipient.rowNumber : null
    };
  }

  function previewEmail(payload) {
    var recipient = getRecipientByRowNumber_(payload && payload.rowNumber);
    var preview = buildPreviewData_(recipient);
    return {
      rowNumber: recipient.rowNumber,
      recipient: recipient,
      subject: preview.subject,
      plainText: preview.plainText,
      htmlBody: preview.htmlBody
    };
  }

  function sendPreparedRecipient_(recipient, userContext) {
    var stepCatalog = loadStepCatalog_();
    syncCatalogIntoSendSheet_(stepCatalog);
    recipient = getRecipientByRowNumber_(recipient.rowNumber);
    var preview = buildPreviewData_(recipient);
    var sheet = getSendsSheet_();
    var attempts = Number(recipient.sendAttempts || 0) + 1;
    var nowText = Utils.formatDate(new Date());

    try {
      MailService.sendEmail(recipient.email, preview.subject, preview.plainText, {
        htmlBody: preview.htmlBody,
        replyTo: (userContext && userContext.email) || ''
      });

      updateTrackingRow_(sheet, recipient.rowNumber, {
        'Accion Catalogo': recipient.action || '',
        'URL Catalogo': recipient.url || '',
        'Fecha Ultimo Envio': nowText,
        'Estado Envio': 'ENVIADO',
        'Intentos Envio': attempts,
        'Ultimo Asunto': preview.subject,
        'Ultimo Usuario Envio': (userContext && userContext.email) || ''
      });
    } catch (error) {
      updateTrackingRow_(sheet, recipient.rowNumber, {
        'Fecha Ultimo Envio': nowText,
        'Estado Envio': 'ERROR: ' + error.message,
        'Intentos Envio': attempts,
        'Ultimo Asunto': preview.subject,
        'Ultimo Usuario Envio': (userContext && userContext.email) || ''
      });
      throw error;
    }

    return {
      rowNumber: recipient.rowNumber,
      email: recipient.email,
      nextStep: recipient.nextStep,
      sentAt: nowText,
      subject: preview.subject
    };
  }

  function markRecipientInProgress_(recipient, userContext) {
    var sheet = getSendsSheet_();
    updateTrackingRow_(sheet, recipient.rowNumber, {
      'Accion Catalogo': recipient.action || '',
      'URL Catalogo': recipient.url || '',
      'Estado Envio': 'EN PROCESO',
      'Ultimo Usuario Envio': (userContext && userContext.email) || ''
    });
  }

  function sendEmailToRecipient(payload, userContext) {
    var stepCatalog = loadStepCatalog_();
    syncCatalogIntoSendSheet_(stepCatalog);
    var recipient = getRecipientByRowNumber_(payload && payload.rowNumber);
    return sendPreparedRecipient_(recipient, userContext);
  }

  function sendBatch(payload, userContext) {
    var stepFilter = normalizeKey_(payload && payload.stepFilter);
    var stepCatalog = loadStepCatalog_();
    syncCatalogIntoSendSheet_(stepCatalog);
    var rowNumbers = Array.isArray(payload && payload.rowNumbers)
      ? payload.rowNumbers.map(function (value) { return Number(value); }).filter(function (value) { return value > 1; })
      : [];
    var recipients = [];

    if (rowNumbers.length) {
      recipients = rowNumbers.map(function (rowNumber) {
        return getRecipientByRowNumber_(rowNumber);
      }).filter(function (row) {
        return row && row.readyToSend;
      });
    } else {
      recipients = mapSendRows_(stepCatalog).filter(function (row) {
        if (!row.readyToSend) return false;
        if (!stepFilter) return true;
        return normalizeKey_(row.nextStep) === stepFilter;
      });
    }

    var results = [];
    var failures = [];
    recipients.forEach(function (recipient) {
      try {
        markRecipientInProgress_(recipient, userContext);
        results.push(sendPreparedRecipient_(recipient, userContext));
      } catch (error) {
        failures.push({
          rowNumber: recipient.rowNumber,
          email: recipient.email,
          nextStep: recipient.nextStep,
          error: error.message
        });
      }
    });

    return {
      totalEvaluated: recipients.length,
      sent: results.length,
      failed: failures.length,
      failures: failures.slice(0, 15)
    };
  }

  return {
    getDashboard: getDashboard,
    previewEmail: previewEmail,
    sendEmailToRecipient: sendEmailToRecipient,
    sendBatch: sendBatch
  };
})();
