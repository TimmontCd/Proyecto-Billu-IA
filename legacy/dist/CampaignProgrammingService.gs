var CampaignProgrammingService = (function () {
  var LOG_HEADERS = [
    'Campaign Id',
    'Campaign Name',
    'Year Key',
    'ID RECOMPENSAS',
    'Email',
    'Fecha Nacimiento',
    'Fecha Envio',
    'Canal',
    'Estado',
    'Asunto',
    'Error',
    'Usuario'
  ];

  var ACTIVE_STATUS = 'A-ACTIVA';
  var INACTIVE_STATUS = 'I-INACTIVA';
  var MIN_BALANCE = 1;
  var MONTHLY_DEPOSIT_TARGET = 500;
  var MASTER_COLUMNS = {
    rewardsId: 0,
    accountStatus: 1,
    birthDate: 6,
    balance: 7,
    email: 8
  };
  var TRANSACTION_COLUMNS = {
    processDate: 0,
    rewardsId: 1,
    abono: 4,
    cargo: 5,
    bin: 8
  };
  var CAMPAIGN_STATUS_PROPERTY = 'CAMPAIGN_PROGRAMMING_STATUS_MAP';
  var DASHBOARD_CACHE_KEY = 'CAMPAIGN_PROGRAMMING_DASHBOARD_V2';

  var FIXED_CAMPAIGNS = [
    {
      campaignId: 'BIRTHDAY_BILLU',
      name: 'Feliz Cumpleaños',
      type: 'CUMPLEANOS',
      channel: 'MAIL',
      status: 'ACTIVE',
      vigencia: 'Diaria 17:10',
      conditions: 'Clientes con cuenta A-ACTIVA, saldo promedio hoy mayor o igual a $1, cumpleaños = hoy y correo poblado.',
      subject: '¡Feliz cumpleaños de parte de Billú!',
      heroTitle: 'Hoy celebramos contigo',
      bodyCopy: 'En Billú queremos acompañarte también en tu día. Que sea un año lleno de buenas noticias, metas cumplidas y grandes momentos.',
      sendEnabled: true,
      previewEnabled: true
    },
    {
      campaignId: 'DEPOSITO_500_MES',
      name: 'Deposita $500 este mes',
      type: 'DEPOSITO_MENSUAL',
      channel: 'MAIL / SMS / PUSH / WHATSAPP',
      status: 'ACTIVE',
      vigencia: 'Mensual · recordatorios 5, 13 y 27',
      conditions: 'Clientes activos e inactivos. Cumplen al acumular al menos $500 en depósitos durante el mes en curso.',
      subject: 'Aún estás a tiempo de completar tus $500 del mes',
      heroTitle: 'Sigue avanzando hacia tu meta del mes',
      bodyCopy: 'Te acompañaremos con recordatorios durante el mes para ayudarte a completar tu meta de depósitos.',
      sendEnabled: false,
      previewEnabled: true
    },
    {
      campaignId: 'BILLU_WEEKEND',
      name: 'Billú weekend',
      type: 'BILLU_WEEKEND',
      channel: 'MAIL / WHATSAPP',
      status: 'ACTIVE',
      vigencia: 'Especial · 28, 29 y 30 de marzo',
      conditions: 'Clientes listados en Billúweekend que hicieron cargo >= $500 con BIN digital 41309831 durante 28, 29 y 30 de marzo.',
      subject: 'Billú weekend: validación de compras digitales',
      heroTitle: 'Ya participas en Billú weekend',
      bodyCopy: 'Validamos automáticamente tus compras digitales de fin de semana para identificar a quienes cumplen la dinámica.',
      sendEnabled: false,
      previewEnabled: true
    }
  ];

  function getCampaignSpreadsheet_() {
    return SpreadsheetApp.openById(AppConfig.getCampaignProgrammingSpreadsheetId());
  }

  function getCampaignStatusMap_() {
    var raw = AppConfig.get(CAMPAIGN_STATUS_PROPERTY, '{}');
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function setCampaignStatusMap_(statusMap) {
    AppConfig.set(CAMPAIGN_STATUS_PROPERTY, JSON.stringify(statusMap || {}));
  }

  function resolveFixedCampaigns_() {
    var statusMap = getCampaignStatusMap_();
    return FIXED_CAMPAIGNS.map(function (campaign) {
      var persistedStatus = statusMap[campaign.campaignId];
      return Object.assign({}, campaign, {
        status: normalizeKey_(persistedStatus) === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });
    });
  }

  function getDashboardCacheTtlSeconds_() {
    var configured = Number(AppConfig.get('CAMPAIGN_DASHBOARD_CACHE_TTL_SECONDS', '180'));
    if (isNaN(configured) || configured < 30) return 180;
    return Math.min(900, configured);
  }

  function getCachedDashboard_() {
    try {
      var cache = CacheService.getScriptCache();
      var raw = cache.get(DASHBOARD_CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function setCachedDashboard_(dashboard) {
    try {
      if (!dashboard || typeof dashboard !== 'object') return;
      CacheService.getScriptCache().put(
        DASHBOARD_CACHE_KEY,
        JSON.stringify(dashboard),
        getDashboardCacheTtlSeconds_()
      );
    } catch (error) {}
  }

  function clearDashboardCache_() {
    try {
      CacheService.getScriptCache().remove(DASHBOARD_CACHE_KEY);
    } catch (error) {}
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

  function isEmptyRow_(row) {
    return !(row || []).some(function (cell) {
      return String(cell === null || cell === undefined ? '' : cell).trim() !== '';
    });
  }

  function stringifyCell_(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function parseFlexibleDate_(value) {
    if (value instanceof Date && !isNaN(value.getTime())) return Utils.startOfDay(value);

    var raw = stringifyCell_(value);
    if (!raw) return null;
    var digits = raw.replace(/\D/g, '');
    var year;
    var month;
    var day;

    if (digits.length >= 8 && Number(digits.slice(0, 4)) > 1900) {
      year = Number(digits.slice(0, 4));
      month = Number(digits.slice(4, 6));
      day = Number(digits.slice(6, 8));
    } else if (digits.length >= 8) {
      day = Number(digits.slice(0, 2));
      month = Number(digits.slice(2, 4));
      year = Number(digits.slice(4, 8));
    } else if (/^\d+$/.test(raw)) {
      var serial = Number(raw);
      if (!isNaN(serial) && serial > 20000) {
        return Utils.startOfDay(new Date(Math.round((serial - 25569) * 86400 * 1000)));
      }
      return null;
    } else {
      return null;
    }

    var date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return Utils.startOfDay(date);
  }

  function parseAmount_(value) {
    if (typeof value === 'number' && !isNaN(value)) return value;
    var raw = stringifyCell_(value)
      .replace(/\s/g, '')
      .replace(/\$/g, '')
      .replace(/MXN/gi, '');
    if (!raw) return 0;

    if (raw.indexOf(',') > -1 && raw.indexOf('.') > -1) {
      if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
        raw = raw.replace(/\./g, '').replace(',', '.');
      } else {
        raw = raw.replace(/,/g, '');
      }
    } else if (raw.indexOf(',') > -1) {
      raw = /,\d{1,2}$/.test(raw) ? raw.replace(',', '.') : raw.replace(/,/g, '');
    }

    var parsed = Number(raw);
    return isNaN(parsed) ? 0 : parsed;
  }

  function buildDisplayNameFromEmail_(email, rewardsId) {
    var localPart = String(email || '').split('@')[0] || '';
    var cleaned = localPart.replace(/[._-]+/g, ' ').trim();
    if (!cleaned) return String(rewardsId || 'Cliente Billú');
    return cleaned.split(/\s+/).map(function (part) {
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : '';
    }).join(' ');
  }

  function buildFirstNameFromEmail_(email, rewardsId) {
    var displayName = buildDisplayNameFromEmail_(email, rewardsId);
    return String(displayName || 'cliente').split(/\s+/)[0] || 'cliente';
  }

  function formatBirthday_(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return Utilities.formatDate(date, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'dd/MM');
  }

  function formatCurrency_(value) {
    return '$' + Number(value || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatWeekendDatesLabel_(targetDates) {
    var timezone = Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE;
    var monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var validDates = (targetDates || [])
      .map(function (item) { return parseFlexibleDate_(item); })
      .filter(function (date) { return date instanceof Date && !isNaN(date.getTime()); })
      .sort(function (left, right) { return left.getTime() - right.getTime(); });

    if (!validDates.length) return '28, 29 y 30 de marzo';

    var sameMonth = validDates.every(function (date) {
      return date.getFullYear() === validDates[0].getFullYear() && date.getMonth() === validDates[0].getMonth();
    });
    if (!sameMonth) {
      return validDates.map(function (date) {
        return Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
      }).join(', ');
    }

    var days = validDates.map(function (date) { return String(date.getDate()); });
    var monthLabel = monthNames[validDates[0].getMonth()];
    if (days.length === 1) return days[0] + ' de ' + monthLabel;
    if (days.length === 2) return days[0] + ' y ' + days[1] + ' de ' + monthLabel;
    return days.slice(0, -1).join(', ') + ' y ' + days[days.length - 1] + ' de ' + monthLabel;
  }

  function isSameMonth_(left, right) {
    if (!(left instanceof Date) || isNaN(left.getTime()) || !(right instanceof Date) || isNaN(right.getTime())) return false;
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
  }

  function pickSheetFromConfig_(spreadsheet, config) {
    var preferredSheetIds = Array.isArray(config.sheetIds)
      ? config.sheetIds.map(function (value) { return Number(value); }).filter(function (value) { return !isNaN(value); })
      : [];

    for (var index = 0; index < preferredSheetIds.length; index += 1) {
      var targetId = preferredSheetIds[index];
      var byId = spreadsheet.getSheets().filter(function (sheet) {
        return sheet.getSheetId() === targetId;
      })[0];
      if (byId) return byId;
    }

    var preferredNames = Array.isArray(config.sheetNames) ? config.sheetNames : [];
    for (var nameIndex = 0; nameIndex < preferredNames.length; nameIndex += 1) {
      var byName = spreadsheet.getSheetByName(preferredNames[nameIndex]);
      if (byName) return byName;
    }

    return spreadsheet.getSheets()[0] || null;
  }

  function ensureLogSheet_() {
    var spreadsheet = getCampaignSpreadsheet_();
    var sheet = spreadsheet.getSheetByName(AppConfig.getCampaignLogSheetName());
    if (!sheet) sheet = spreadsheet.insertSheet(AppConfig.getCampaignLogSheetName());
    if (sheet.getLastRow() < 1) {
      sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);
      sheet.setFrozenRows(1);
      return sheet;
    }

    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), LOG_HEADERS.length)).getDisplayValues()[0];
    LOG_HEADERS.forEach(function (header, index) {
      if (String(existingHeaders[index] || '').trim() !== header) {
        sheet.getRange(1, index + 1).setValue(header);
      }
    });
    sheet.setFrozenRows(1);
    return sheet;
  }

  function getLogRows_() {
    var sheet = ensureLogSheet_();
    if (sheet.getLastRow() < 2) return [];
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, LOG_HEADERS.length).getDisplayValues();
    return values.map(function (row) {
      return {
        campaignId: String(row[0] || '').trim(),
        campaignName: String(row[1] || '').trim(),
        yearKey: String(row[2] || '').trim(),
        rewardsId: String(row[3] || '').trim(),
        email: String(row[4] || '').trim(),
        birthDate: String(row[5] || '').trim(),
        sentAt: String(row[6] || '').trim(),
        channel: String(row[7] || '').trim(),
        status: String(row[8] || '').trim(),
        subject: String(row[9] || '').trim(),
        error: String(row[10] || '').trim(),
        user: String(row[11] || '').trim()
      };
    }).filter(function (row) {
      return row.campaignId || row.email || row.rewardsId;
    });
  }

  function buildSuccessfulLogIndex_(rows) {
    return (rows || []).reduce(function (acc, row) {
      if (normalizeKey_(row.status) !== 'ENVIADO') return acc;
      acc[[row.campaignId, row.yearKey, row.rewardsId].join('::')] = row;
      return acc;
    }, {});
  }

  function loadMasterClients_() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(AppConfig.getMasterClientsSheetName());
    if (!sheet) {
      throw new Error('No se encontró la pestaña "' + AppConfig.getMasterClientsSheetName() + '" en el spreadsheet maestro.');
    }

    var values = sheet.getDataRange().getDisplayValues();
    if (!values || values.length < 2) {
      return {
        source: {
          spreadsheetId: AppConfig.getSpreadsheetId(),
          spreadsheetName: spreadsheet.getName(),
          sheetName: sheet.getName()
        },
        clients: [],
        byRewardsId: {}
      };
    }

    var clientsMap = {};

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (isEmptyRow_(row)) continue;

      var rewardsId = String(row[MASTER_COLUMNS.rewardsId] || '').trim().toUpperCase();
      if (!rewardsId) continue;

      var accountStatus = normalizeKey_(row[MASTER_COLUMNS.accountStatus] || '');
      if (accountStatus !== ACTIVE_STATUS && accountStatus !== INACTIVE_STATUS) continue;
      var balance = parseAmount_(row[MASTER_COLUMNS.balance]);
      var birthDate = parseFlexibleDate_(row[MASTER_COLUMNS.birthDate]);
      var email = Utils.normalizeEmail(row[MASTER_COLUMNS.email] || '');

      if (!clientsMap[rewardsId]) {
        clientsMap[rewardsId] = {
          rewardsId: rewardsId,
          accountStatus: accountStatus,
          isActive: accountStatus === ACTIVE_STATUS,
          email: email,
          balance: balance,
          birthDate: birthDate,
          displayName: buildDisplayNameFromEmail_(email, rewardsId),
          firstName: buildFirstNameFromEmail_(email, rewardsId)
        };
        continue;
      }

      if (accountStatus === ACTIVE_STATUS) {
        clientsMap[rewardsId].accountStatus = ACTIVE_STATUS;
        clientsMap[rewardsId].isActive = true;
      }
      if (clientsMap[rewardsId].accountStatus !== ACTIVE_STATUS && accountStatus === INACTIVE_STATUS) {
        clientsMap[rewardsId].accountStatus = INACTIVE_STATUS;
        clientsMap[rewardsId].isActive = false;
      }
      if (!clientsMap[rewardsId].email && email) {
        clientsMap[rewardsId].email = email;
        clientsMap[rewardsId].displayName = buildDisplayNameFromEmail_(email, rewardsId);
        clientsMap[rewardsId].firstName = buildFirstNameFromEmail_(email, rewardsId);
      }
      if (!clientsMap[rewardsId].birthDate && birthDate) clientsMap[rewardsId].birthDate = birthDate;
      if (Number(clientsMap[rewardsId].balance || 0) < balance) clientsMap[rewardsId].balance = balance;
    }

    var ordered = Object.keys(clientsMap).sort().map(function (rewardsId) {
      return clientsMap[rewardsId];
    });

    return {
      source: {
        spreadsheetId: AppConfig.getSpreadsheetId(),
        spreadsheetName: spreadsheet.getName(),
        sheetName: sheet.getName()
      },
      clients: ordered,
      byRewardsId: clientsMap
    };
  }

  function loadBirthdayAudience_(masterData) {
    var today = Utils.startOfDay(new Date());
    var activeWithBalance = (masterData.clients || []).filter(function (client) {
      return client.isActive && Number(client.balance || 0) >= MIN_BALANCE;
    });
    var birthdaysToday = activeWithBalance.filter(function (client) {
      if (!(client.birthDate instanceof Date) || isNaN(client.birthDate.getTime())) return false;
      return client.birthDate.getDate() === today.getDate() && client.birthDate.getMonth() === today.getMonth();
    });

    return {
      activeWithBalance: activeWithBalance,
      birthdaysToday: birthdaysToday,
      missingEmailToday: birthdaysToday.filter(function (client) { return !client.email; })
    };
  }

  function loadCurrentMonthDepositProgress_() {
    var configs = AppConfig.getCustomerTransactionSourceConfigs() || [];
    var now = Utils.startOfDay(new Date());
    var totalsByRewardsId = {};
    var depositCountByRewardsId = {};
    var sourceNames = [];
    var processedRows = 0;

    configs.forEach(function (config) {
      if (!config || !config.spreadsheetId) return;
      try {
        var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
        var sheet = pickSheetFromConfig_(spreadsheet, config);
        if (!sheet || sheet.getLastRow() < 2) return;

        sourceNames.push((config.label || spreadsheet.getName()) + ' / ' + sheet.getName());
        var values = sheet.getDataRange().getDisplayValues();

        for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
          var row = values[rowIndex];
          if (isEmptyRow_(row)) continue;

          var rewardsId = String(row[TRANSACTION_COLUMNS.rewardsId] || '').trim().toUpperCase();
          if (!rewardsId) continue;

          var processDate = parseFlexibleDate_(row[TRANSACTION_COLUMNS.processDate]);
          if (!isSameMonth_(processDate, now)) continue;

          var abono = parseAmount_(row[TRANSACTION_COLUMNS.abono]);
          if (abono <= 0) continue;

          totalsByRewardsId[rewardsId] = Number(totalsByRewardsId[rewardsId] || 0) + abono;
          depositCountByRewardsId[rewardsId] = Number(depositCountByRewardsId[rewardsId] || 0) + 1;
          processedRows += 1;
        }
      } catch (error) {
        Logger.log('No fue posible leer fuente transaccional para campañas: ' + error.message);
      }
    });

    return {
      monthKey: Utilities.formatDate(now, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM'),
      totalsByRewardsId: totalsByRewardsId,
      depositCountByRewardsId: depositCountByRewardsId,
      sourceNames: sourceNames,
      processedRows: processedRows
    };
  }

  function findRewardsIdColumnIndex_(headers) {
    var normalizedHeaders = (headers || []).map(function (header) {
      return normalizeKey_(header);
    });

    for (var index = 0; index < normalizedHeaders.length; index += 1) {
      var header = normalizedHeaders[index];
      if (!header) continue;
      if (header === 'ID RECOMPENSAS' || header === 'ID_RECOMPENSAS' || header === 'RECOMPENSAS' || header === 'IDRECOMPENSAS') {
        return index;
      }
    }

    for (var fallbackIndex = 0; fallbackIndex < normalizedHeaders.length; fallbackIndex += 1) {
      if (normalizedHeaders[fallbackIndex].indexOf('RECOMPENSAS') !== -1) return fallbackIndex;
    }

    return 0;
  }

  function loadBilluWeekendAudience_(masterData) {
    var spreadsheetId = AppConfig.getBilluWeekendSpreadsheetId();
    var sheetName = AppConfig.getBilluWeekendSheetName();
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('No se encontró la pestaña "' + sheetName + '" en el spreadsheet de Billú weekend.');
    }
    if (sheet.getLastRow() < 1) {
      return {
        source: {
          spreadsheetId: spreadsheetId,
          spreadsheetName: spreadsheet.getName(),
          sheetName: sheet.getName()
        },
        audience: [],
        audienceMap: {},
        loadedRows: 0
      };
    }

    var values = sheet.getDataRange().getDisplayValues();
    var rewardsIdColumn = findRewardsIdColumnIndex_(values[0] || []);
    var audienceMap = {};
    var loadedRows = 0;

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (isEmptyRow_(row)) continue;
      var rewardsId = String(row[rewardsIdColumn] || '').trim().toUpperCase();
      if (!rewardsId) continue;
      audienceMap[rewardsId] = true;
      loadedRows += 1;
    }

    var audience = Object.keys(audienceMap).sort().map(function (rewardsId) {
      var master = masterData.byRewardsId[rewardsId];
      if (master) return master;
      return {
        rewardsId: rewardsId,
        accountStatus: '',
        isActive: false,
        email: '',
        balance: 0,
        birthDate: null,
        displayName: rewardsId,
        firstName: 'cliente'
      };
    });

    return {
      source: {
        spreadsheetId: spreadsheetId,
        spreadsheetName: spreadsheet.getName(),
        sheetName: sheet.getName()
      },
      audience: audience,
      audienceMap: audienceMap,
      loadedRows: loadedRows
    };
  }

  function loadBilluWeekendTransactions_(audienceMap) {
    var transactionSheetId = AppConfig.getBilluWeekendTransactionsSheetId();
    var config = {
      spreadsheetId: AppConfig.getBilluWeekendTransactionsSpreadsheetId(),
      label: 'Transacciones Billú weekend',
      sheetNames: [],
      sheetIds: isNaN(Number(transactionSheetId)) ? [] : [Number(transactionSheetId)]
    };

    var targetDates = AppConfig.getBilluWeekendTargetDates();
    var targetDateIndex = targetDates.reduce(function (acc, dateKey) {
      acc[String(dateKey || '').trim()] = true;
      return acc;
    }, {});
    var minCargo = Number(AppConfig.getBilluWeekendMinCargoAmount() || 500);
    var requiredBin = String(AppConfig.getBilluWeekendDigitalBin() || '41309831').replace(/\D/g, '');
    var qualifyingByRewardsId = {};
    var sourceNames = [];
    var reviewedRows = 0;
    var matchedRows = 0;

    if (!config.spreadsheetId) {
      return {
        targetDates: targetDates,
        requiredBin: requiredBin,
        minCargo: minCargo,
        qualifyingByRewardsId: qualifyingByRewardsId,
        sourceNames: sourceNames,
        reviewedRows: reviewedRows,
        matchedRows: matchedRows
      };
    }

    try {
      var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
      var sheet = pickSheetFromConfig_(spreadsheet, config);
      if (!sheet || sheet.getLastRow() < 2) {
        return {
          targetDates: targetDates,
          requiredBin: requiredBin,
          minCargo: minCargo,
          qualifyingByRewardsId: qualifyingByRewardsId,
          sourceNames: sourceNames,
          reviewedRows: reviewedRows,
          matchedRows: matchedRows
        };
      }

      sourceNames.push((config.label || spreadsheet.getName()) + ' / ' + sheet.getName());
      var values = sheet.getDataRange().getDisplayValues();

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (isEmptyRow_(row)) continue;

        var rewardsId = String(row[TRANSACTION_COLUMNS.rewardsId] || '').trim().toUpperCase();
        if (!rewardsId || !audienceMap[rewardsId]) continue;

        var processDate = parseFlexibleDate_(row[TRANSACTION_COLUMNS.processDate]);
        if (!(processDate instanceof Date) || isNaN(processDate.getTime())) continue;
        var dateKey = Utilities.formatDate(processDate, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM-dd');
        if (!targetDateIndex[dateKey]) continue;

        var binDigits = String(row[TRANSACTION_COLUMNS.bin] || '').replace(/\D/g, '');
        if (!binDigits || binDigits !== requiredBin) continue;

        var cargoAmount = Math.abs(parseAmount_(row[TRANSACTION_COLUMNS.cargo]));
        if (!cargoAmount || cargoAmount < minCargo) continue;

        reviewedRows += 1;
        matchedRows += 1;
        if (!qualifyingByRewardsId[rewardsId]) {
          qualifyingByRewardsId[rewardsId] = {
            rewardsId: rewardsId,
            transactionCount: 0,
            totalCargo: 0,
            maxCargo: 0,
            dateKeys: {}
          };
        }
        var item = qualifyingByRewardsId[rewardsId];
        item.transactionCount += 1;
        item.totalCargo += cargoAmount;
        item.maxCargo = Math.max(item.maxCargo, cargoAmount);
        item.dateKeys[dateKey] = true;
      }
    } catch (error) {
      Logger.log('No fue posible leer transacciones Billú weekend: ' + error.message);
    }

    return {
      targetDates: targetDates,
      requiredBin: requiredBin,
      minCargo: minCargo,
      qualifyingByRewardsId: qualifyingByRewardsId,
      sourceNames: sourceNames,
      reviewedRows: reviewedRows,
      matchedRows: matchedRows
    };
  }

  function loadBilluWeekendData_(masterData) {
    var audienceData = loadBilluWeekendAudience_(masterData);
    var transactionData = loadBilluWeekendTransactions_(audienceData.audienceMap);
    return {
      source: audienceData.source,
      audience: audienceData.audience,
      audienceMap: audienceData.audienceMap,
      loadedRows: audienceData.loadedRows,
      targetDates: transactionData.targetDates,
      requiredBin: transactionData.requiredBin,
      minCargo: transactionData.minCargo,
      qualifyingByRewardsId: transactionData.qualifyingByRewardsId,
      sourceNames: transactionData.sourceNames,
      reviewedRows: transactionData.reviewedRows,
      matchedRows: transactionData.matchedRows
    };
  }

  function getCampaignDefinitionById_(campaignId) {
    var campaigns = resolveFixedCampaigns_();
    var normalized = normalizeKey_(campaignId || FIXED_CAMPAIGNS[0].campaignId);
    var match = campaigns.filter(function (campaign) {
      return normalizeKey_(campaign.campaignId) === normalized;
    })[0];
    if (!match) throw new Error('No se encontró la campaña solicitada.');
    return match;
  }

  function calculateBirthdayMetrics_(campaign, masterData, logRows, logIndex) {
    var audience = loadBirthdayAudience_(masterData);
    var yearKey = String(new Date().getFullYear());
    var todayKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM-dd');
    var monthKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM');
    var birthdayAudience = audience.birthdaysToday.map(function (client) {
      var key = [campaign.campaignId, yearKey, client.rewardsId].join('::');
      return {
        rewardsId: client.rewardsId,
        email: client.email,
        balance: client.balance,
        birthDate: client.birthDate,
        displayName: client.displayName,
        firstName: client.firstName,
        alreadySentYear: !!logIndex[key]
      };
    });
    var withEmailToday = birthdayAudience.filter(function (client) {
      return !!client.email;
    });
    var pendingToday = withEmailToday.filter(function (client) {
      return !client.alreadySentYear;
    });
    var sentToday = logRows.filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ENVIADO'
        && String(row.sentAt || '').indexOf(todayKey) === 0;
    }).length;
    var sentMonth = logRows.filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ENVIADO'
        && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var errorMonth = logRows.filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ERROR'
        && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var lastSendAt = logRows.filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId);
    }).map(function (row) { return row.sentAt; })[0] || '';

    return {
      yearKey: yearKey,
      audience: birthdayAudience,
      eligibleToday: withEmailToday,
      pendingToday: pendingToday,
      missingEmailToday: birthdayAudience.filter(function (client) { return !client.email; }),
      sentToday: sentToday,
      sentMonth: sentMonth,
      errorMonth: errorMonth,
      participationPct: withEmailToday.length ? (sentToday / withEmailToday.length) * 100 : 0,
      lastSendAt: lastSendAt,
      metricSubtext: Number(birthdayAudience.filter(function (client) { return !client.email; }).length) > 0
        ? Number(pendingToday.length).toLocaleString('es-MX') + ' pendientes · ' + Number(birthdayAudience.filter(function (client) { return !client.email; }).length).toLocaleString('es-MX') + ' sin email'
        : Number(pendingToday.length).toLocaleString('es-MX') + ' pendientes'
    };
  }

  function calculateMonthlyDepositMetrics_(campaign, masterData, depositData, logRows) {
    var universe = (masterData.clients || []).map(function (client) {
      var deposited = Number(depositData.totalsByRewardsId[client.rewardsId] || 0);
      var depositCount = Number(depositData.depositCountByRewardsId[client.rewardsId] || 0);
      var remaining = Math.max(0, MONTHLY_DEPOSIT_TARGET - deposited);
      return {
        rewardsId: client.rewardsId,
        email: client.email,
        balance: client.balance,
        birthDate: client.birthDate,
        displayName: client.displayName,
        firstName: client.firstName,
        isActive: !!client.isActive,
        accountStatus: client.accountStatus,
        depositedMonth: deposited,
        depositCountMonth: depositCount,
        remainingAmount: remaining,
        achieved: deposited >= MONTHLY_DEPOSIT_TARGET
      };
    });

    var achieved = universe.filter(function (client) { return client.achieved; });
    var pending = universe.filter(function (client) { return !client.achieved; });
    var activeCount = universe.filter(function (client) { return client.isActive; }).length;
    var inactiveCount = universe.length - activeCount;
    var lowAdvance = pending.filter(function (client) {
      return client.depositedMonth > 0 && client.depositedMonth < 250;
    }).length;
    var highAdvance = pending.filter(function (client) {
      return client.depositedMonth >= 250 && client.depositedMonth < MONTHLY_DEPOSIT_TARGET;
    }).length;
    var zeroAdvance = pending.filter(function (client) {
      return client.depositedMonth <= 0;
    }).length;
    var monthKey = depositData.monthKey || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM');
    var sentMonth = logRows.filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ENVIADO'
        && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var errorMonth = logRows.filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ERROR'
        && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;

    return {
      yearKey: String(new Date().getFullYear()),
      audience: universe,
      eligibleToday: universe,
      pendingToday: pending,
      missingEmailToday: [],
      sentToday: 0,
      sentMonth: sentMonth,
      errorMonth: errorMonth,
      participationPct: universe.length ? (achieved.length / universe.length) * 100 : 0,
      lastSendAt: '',
      achievedCount: achieved.length,
      pendingCount: pending.length,
      activeCount: activeCount,
      inactiveCount: inactiveCount,
      monthDepositsTotal: universe.reduce(function (sum, client) {
        return sum + Number(client.depositedMonth || 0);
      }, 0),
      zeroAdvanceCount: zeroAdvance,
      lowAdvanceCount: lowAdvance,
      highAdvanceCount: highAdvance,
      metricSubtext: Number(pending.length).toLocaleString('es-MX') + ' pendientes · ' + Number(achieved.length).toLocaleString('es-MX') + ' cumplieron'
    };
  }

  function calculateBilluWeekendMetrics_(campaign, weekendData, logRows) {
    var audience = (weekendData.audience || []).map(function (client) {
      var match = weekendData.qualifyingByRewardsId[client.rewardsId];
      return Object.assign({}, client, {
        qualifyingPurchase: !!match,
        qualifyingPurchaseCount: match ? Number(match.transactionCount || 0) : 0,
        qualifyingPurchaseMax: match ? Number(match.maxCargo || 0) : 0,
        qualifyingPurchaseTotal: match ? Number(match.totalCargo || 0) : 0
      });
    });
    var eligible = audience.filter(function (client) { return client.qualifyingPurchase; });
    var pending = audience.filter(function (client) { return !client.qualifyingPurchase; });
    var monthKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM');
    var sentMonth = (logRows || []).filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ENVIADO'
        && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var errorMonth = (logRows || []).filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId)
        && normalizeKey_(row.status) === 'ERROR'
        && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var lastSendAt = (logRows || []).filter(function (row) {
      return normalizeKey_(row.campaignId) === normalizeKey_(campaign.campaignId);
    }).map(function (row) { return row.sentAt; })[0] || '';

    return {
      yearKey: String(new Date().getFullYear()),
      audience: audience,
      eligibleToday: eligible,
      pendingToday: pending,
      missingEmailToday: eligible.filter(function (client) { return !client.email; }),
      sentToday: 0,
      sentMonth: sentMonth,
      errorMonth: errorMonth,
      participationPct: audience.length ? (eligible.length / audience.length) * 100 : 0,
      lastSendAt: lastSendAt,
      achievedCount: eligible.length,
      pendingCount: pending.length,
      metricSubtext: Number(eligible.length).toLocaleString('es-MX') + ' cumplieron · ' + Number(pending.length).toLocaleString('es-MX') + ' no cumplieron'
    };
  }

  function calculateMetrics_(campaign, datasets, logRows, logIndex) {
    if (normalizeKey_(campaign.type) === 'BILLU_WEEKEND') {
      return calculateBilluWeekendMetrics_(campaign, datasets.weekendData || {}, logRows || []);
    }
    if (normalizeKey_(campaign.type) === 'DEPOSITO_MENSUAL') {
      return calculateMonthlyDepositMetrics_(campaign, datasets.masterData, datasets.depositData, logRows || []);
    }
    return calculateBirthdayMetrics_(campaign, datasets.masterData, logRows || [], logIndex || {});
  }

  function buildBirthdayPreviewData_(campaign, recipient) {
    recipient = recipient || {
      firstName: 'cliente',
      displayName: 'Cliente Billú',
      email: '',
      rewardsId: '',
      birthDate: new Date()
    };

    var heroCopy = campaign.bodyCopy || 'En Billú queremos acompañarte también en tu día. Que sea un año lleno de buenas noticias, metas cumplidas y grandes momentos.';
    var plainText = [
      'Hola ' + (recipient.firstName || 'cliente') + ',',
      '',
      '¡Feliz cumpleaños!',
      heroCopy,
      '',
      'Gracias por ser parte de Billú.',
      'Equipo Billú'
    ].join('\n');

    var logoMarkup = [
      '<div style="display:inline-block;">',
      '<div style="font-size:58px;line-height:0.9;font-weight:800;letter-spacing:-0.04em;color:#ffffff;">Billú</div>',
      '<div style="margin-top:6px;font-size:18px;line-height:1;font-weight:500;letter-spacing:0.02em;color:rgba(255,255,255,0.88);">de Afirme</div>',
      '</div>'
    ].join('');

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
      '<div style="margin-top:18px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a1e9d1;">Campaña de cumpleaños</div>',
      '<div style="margin-top:10px;font-size:34px;line-height:1.12;font-weight:700;color:#ffffff;">' + escapeHtml_(campaign.heroTitle || 'Hoy celebramos contigo') + '</div>',
      '<div style="margin-top:12px;font-size:17px;line-height:1.7;color:rgba(255,255,255,0.92);">Hola ' + escapeHtml_(recipient.firstName || 'cliente') + ', hoy queremos desearte un gran día y agradecerte por formar parte de Billú.</div>',
      '</td></tr>',
      '<tr><td style="padding:28px 32px 18px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6faf8;border:1px solid #d7e3dd;border-radius:20px;">',
      '<tr><td style="padding:24px;">',
      '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Mensaje especial</div>',
      '<div style="margin-top:10px;font-size:30px;line-height:1.2;font-weight:700;color:#173126;">¡Feliz cumpleaños!</div>',
      '<div style="margin-top:14px;font-size:17px;line-height:1.8;color:#4f665d;">' + escapeHtml_(heroCopy) + '</div>',
      recipient.birthDate ? '<div style="margin-top:18px;padding:14px 16px;border-radius:16px;background:#ffffff;border:1px dashed #9ecfc3;">'
        + '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Tu fecha especial</div>'
        + '<div style="margin-top:8px;font-size:24px;line-height:1.1;font-weight:700;color:#0d4d4a;">' + escapeHtml_(formatBirthday_(recipient.birthDate)) + '</div>'
        + '</div>' : '',
      '<div style="margin-top:22px;font-size:15px;line-height:1.8;color:#5f766c;">Que este nuevo año te traiga grandes momentos y muchas razones para celebrar.</div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:0 32px 32px;">',
      '<div style="padding:18px 20px;border-radius:18px;background:#eef6f3;border:1px dashed #b9ddd2;">',
      '<div style="font-size:16px;font-weight:700;color:#173126;">Gracias por confiar en nosotros</div>',
      '<div style="margin-top:8px;font-size:14px;line-height:1.7;color:#5f766c;">Seguiremos construyendo experiencias más simples, cercanas y útiles para acompañarte en tu vida financiera.</div>',
      '</div>',
      '<div style="margin-top:18px;font-size:12px;line-height:1.7;color:#7a9187;">Este mensaje fue enviado como parte de la campaña Feliz Cumpleaños Billú.</div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body>',
      '</html>'
    ].join('');

    return {
      subject: campaign.subject,
      plainText: plainText,
      htmlBody: htmlBody,
      recipient: recipient
    };
  }

  function buildMonthlyDepositPreviewData_(campaign, recipient, metrics) {
    recipient = recipient || {
      firstName: 'cliente',
      displayName: 'Cliente Billú',
      email: '',
      rewardsId: '',
      depositedMonth: 0,
      remainingAmount: MONTHLY_DEPOSIT_TARGET
    };

    var depositedText = formatCurrency_(recipient.depositedMonth || 0);
    var remainingText = formatCurrency_(recipient.remainingAmount || MONTHLY_DEPOSIT_TARGET);
    var plainText = [
      'Hola ' + (recipient.firstName || 'cliente') + ',',
      '',
      'Este mes llevas ' + depositedText + ' en depósitos acumulados.',
      'Tu meta mensual para esta campaña es de $500.00.',
      'Te faltan ' + remainingText + ' para completarla.',
      '',
      'Seguiremos recordándotelo durante el mes.',
      'Equipo Billú'
    ].join('\n');

    var logoMarkup = [
      '<div style="display:inline-block;">',
      '<div style="font-size:58px;line-height:0.9;font-weight:800;letter-spacing:-0.04em;color:#ffffff;">Billú</div>',
      '<div style="margin-top:6px;font-size:18px;line-height:1;font-weight:500;letter-spacing:0.02em;color:rgba(255,255,255,0.88);">de Afirme</div>',
      '</div>'
    ].join('');

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
      '<div style="margin-top:18px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a1e9d1;">Campaña de depósitos</div>',
      '<div style="margin-top:10px;font-size:34px;line-height:1.12;font-weight:700;color:#ffffff;">' + escapeHtml_(campaign.heroTitle || 'Sigue avanzando hacia tu meta del mes') + '</div>',
      '<div style="margin-top:12px;font-size:17px;line-height:1.7;color:rgba(255,255,255,0.92);">Hola ' + escapeHtml_(recipient.firstName || 'cliente') + ', queremos acompañarte para que completes tu meta mensual de depósitos.</div>',
      '</td></tr>',
      '<tr><td style="padding:28px 32px 18px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6faf8;border:1px solid #d7e3dd;border-radius:20px;">',
      '<tr><td style="padding:24px;">',
      '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Avance del mes</div>',
      '<div style="margin-top:10px;font-size:30px;line-height:1.2;font-weight:700;color:#173126;">Llevas ' + escapeHtml_(depositedText) + '</div>',
      '<div style="margin-top:14px;font-size:17px;line-height:1.8;color:#4f665d;">Tu meta mensual es de <strong>$500.00</strong>. Te faltan <strong>' + escapeHtml_(remainingText) + '</strong> para completarla.</div>',
      '<div style="margin-top:18px;padding:14px 16px;border-radius:16px;background:#ffffff;border:1px dashed #9ecfc3;">',
      '<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Progreso de la campaña</div>',
      '<div style="margin-top:8px;font-size:24px;line-height:1.1;font-weight:700;color:#0d4d4a;">' + escapeHtml_(Number(metrics.achievedCount || 0).toLocaleString('es-MX')) + ' clientes ya cumplieron</div>',
      '<div style="margin-top:6px;font-size:14px;line-height:1.6;color:#5f766c;">' + escapeHtml_(Number(metrics.pendingCount || 0).toLocaleString('es-MX')) + ' siguen pendientes este mes.</div>',
      '</div>',
      '<div style="margin-top:22px;font-size:15px;line-height:1.8;color:#5f766c;">Seguiremos acompañándote con recordatorios los días 5, 13 y 27 de cada mes.</div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '<tr><td style="padding:0 32px 32px;">',
      '<div style="padding:18px 20px;border-radius:18px;background:#eef6f3;border:1px dashed #b9ddd2;">',
      '<div style="font-size:16px;font-weight:700;color:#173126;">Próximo paso</div>',
      '<div style="margin-top:8px;font-size:14px;line-height:1.7;color:#5f766c;">Más adelante conectaremos los canales de contacto para automatizar correos, SMS, Push y WhatsApp según la vigencia de la campaña.</div>',
      '</div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body>',
      '</html>'
    ].join('');

    return {
      subject: campaign.subject,
      plainText: plainText,
      htmlBody: htmlBody,
      recipient: recipient
    };
  }

  function buildBilluWeekendPreviewData_(campaign, recipient) {
    recipient = recipient || {
      firstName: 'cliente',
      displayName: 'Cliente Billú',
      email: '',
      rewardsId: '',
      qualifyingPurchaseCount: 0,
      qualifyingPurchaseMax: 0
    };

    var targetDates = AppConfig.getBilluWeekendTargetDates();
    var datesLabel = formatWeekendDatesLabel_(targetDates);
    var minCargo = Number(AppConfig.getBilluWeekendMinCargoAmount() || 500);
    var bin = String(AppConfig.getBilluWeekendDigitalBin() || '41309831');
    var plainText = [
      'Hola ' + (recipient.firstName || 'cliente') + ',',
      '',
      'Tu participación en Billú weekend ya fue validada.',
      'Detectamos compras digitales con BIN ' + bin + ' durante ' + datesLabel + ', por un monto mayor o igual a $' + Number(minCargo).toLocaleString('es-MX') + '.',
      '',
      'Gracias por participar en la campaña.',
      'Equipo Billú'
    ].join('\n');

    var htmlBody = [
      '<!DOCTYPE html>',
      '<html>',
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>',
      '<body style="margin:0;padding:0;background:#eef6f3;font-family:Avenir Next,Segoe UI,Arial,sans-serif;color:#173126;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6f3;padding:24px 12px;">',
      '<tr><td align="center">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7e3dd;">',
      '<tr><td style="padding:28px 32px;background:linear-gradient(135deg,#0d4d4a 0%,#009f9c 100%);">',
      '<div style="font-size:58px;line-height:0.9;font-weight:800;letter-spacing:-0.04em;color:#ffffff;">Billú</div>',
      '<div style="margin-top:6px;font-size:18px;line-height:1;font-weight:500;letter-spacing:0.02em;color:rgba(255,255,255,0.88);">de Afirme</div>',
      '<div style="margin-top:18px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a1e9d1;">Campaña Billú weekend</div>',
      '<div style="margin-top:10px;font-size:34px;line-height:1.12;font-weight:700;color:#ffffff;">' + escapeHtml_(campaign.heroTitle || 'Ya participas en Billú weekend') + '</div>',
      '<div style="margin-top:12px;font-size:17px;line-height:1.7;color:rgba(255,255,255,0.92);">Hola ' + escapeHtml_(recipient.firstName || 'cliente') + ', validamos tus compras digitales del fin de semana.</div>',
      '</td></tr>',
      '<tr><td style="padding:28px 32px 24px;">',
      '<div style="font-size:16px;line-height:1.7;color:#4f665d;">Detectamos operaciones que cumplen los criterios de la campaña: monto mínimo <strong>$' + escapeHtml_(Number(minCargo).toLocaleString('es-MX')) + '</strong>, BIN digital <strong>' + escapeHtml_(bin) + '</strong> y fechas <strong>' + escapeHtml_(datesLabel) + '</strong>.</div>',
      '<div style="margin-top:16px;padding:14px 16px;border-radius:16px;background:#f6faf8;border:1px dashed #9ecfc3;">',
      '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5f766c;">Resumen detectado</div>',
      '<div style="margin-top:8px;font-size:16px;color:#173126;">Transacciones válidas: <strong>' + escapeHtml_(Number(recipient.qualifyingPurchaseCount || 0).toLocaleString('es-MX')) + '</strong></div>',
      '<div style="margin-top:4px;font-size:16px;color:#173126;">Cargo mayor detectado: <strong>' + escapeHtml_(formatCurrency_(recipient.qualifyingPurchaseMax || 0)) + '</strong></div>',
      '</div>',
      '</td></tr>',
      '</table>',
      '</td></tr>',
      '</table>',
      '</body>',
      '</html>'
    ].join('');

    return {
      subject: campaign.subject,
      plainText: plainText,
      htmlBody: htmlBody,
      recipient: recipient
    };
  }

  function serializeRecipient_(recipient) {
    if (!recipient) return null;
    return {
      rewardsId: String(recipient.rewardsId || '').trim(),
      email: String(recipient.email || '').trim(),
      displayName: String(recipient.displayName || '').trim(),
      firstName: String(recipient.firstName || '').trim(),
      birthDate: formatBirthday_(recipient.birthDate),
      balance: Number(recipient.balance || 0),
      alreadySentYear: !!recipient.alreadySentYear,
      depositedMonth: Number(recipient.depositedMonth || 0),
      depositCountMonth: Number(recipient.depositCountMonth || 0),
      remainingAmount: Number(recipient.remainingAmount || 0),
      qualifyingPurchase: !!recipient.qualifyingPurchase,
      qualifyingPurchaseCount: Number(recipient.qualifyingPurchaseCount || 0),
      qualifyingPurchaseMax: Number(recipient.qualifyingPurchaseMax || 0),
      qualifyingPurchaseTotal: Number(recipient.qualifyingPurchaseTotal || 0),
      achieved: !!recipient.achieved,
      isActive: !!recipient.isActive
    };
  }

  function buildCampaignRow_(campaign, metrics) {
    return {
      campaignId: campaign.campaignId,
      name: campaign.name,
      type: campaign.type,
      channel: campaign.channel,
      status: campaign.status,
      vigencia: campaign.vigencia,
      conditions: campaign.conditions,
      subject: campaign.subject,
      heroTitle: campaign.heroTitle,
      bodyCopy: campaign.bodyCopy,
      eligibleCount: metrics.eligibleToday.length,
      pendingCount: metrics.pendingToday.length,
      achievedCount: Number(metrics.achievedCount || 0),
      missingEmailCount: metrics.missingEmailToday.length,
      sentToday: metrics.sentToday,
      sentMonth: metrics.sentMonth,
      errorMonth: metrics.errorMonth,
      participationPct: metrics.participationPct,
      lastSendAt: metrics.lastSendAt,
      metricSubtext: metrics.metricSubtext || '',
      activeCount: Number(metrics.activeCount || 0),
      inactiveCount: Number(metrics.inactiveCount || 0),
      zeroAdvanceCount: Number(metrics.zeroAdvanceCount || 0),
      lowAdvanceCount: Number(metrics.lowAdvanceCount || 0),
      highAdvanceCount: Number(metrics.highAdvanceCount || 0),
      monthDepositsTotal: Number(metrics.monthDepositsTotal || 0),
      sendEnabled: !!campaign.sendEnabled,
      previewEnabled: !!campaign.previewEnabled,
      previewRecipient: serializeRecipient_(metrics.pendingToday[0] || metrics.eligibleToday[0] || metrics.audience[0] || null)
    };
  }

  function buildResults_(campaignRows, logRows) {
    var monthKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM');
    var sentMonth = logRows.filter(function (row) {
      return normalizeKey_(row.status) === 'ENVIADO' && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var errorMonth = logRows.filter(function (row) {
      return normalizeKey_(row.status) === 'ERROR' && String(row.sentAt || '').indexOf(monthKey) === 0;
    }).length;
    var birthdayRow = campaignRows.filter(function (row) {
      return normalizeKey_(row.type) === 'CUMPLEANOS';
    })[0];
    var depositRow = campaignRows.filter(function (row) {
      return normalizeKey_(row.type) === 'DEPOSITO_MENSUAL';
    })[0];
    var weekendRow = campaignRows.filter(function (row) {
      return normalizeKey_(row.type) === 'BILLU_WEEKEND';
    })[0];
    var recent = logRows.slice().sort(function (a, b) {
      return String(b.sentAt || '').localeCompare(String(a.sentAt || ''));
    }).slice(0, 20);

    return {
      cards: [
        { label: 'Campañas activas', value: campaignRows.length, sub: 'Fijas y listas para operar' },
        { label: 'Cumpleaños hoy', value: birthdayRow ? birthdayRow.eligibleCount : 0, sub: 'Elegibles del día con correo' },
        { label: 'Cumplieron depósito', value: depositRow ? depositRow.achievedCount : 0, sub: 'Clientes que ya alcanzaron $500 este mes' },
        { label: 'Billú weekend', value: weekendRow ? weekendRow.eligibleCount : 0, sub: 'Clientes con compra digital válida' },
        { label: 'Pendientes depósito', value: depositRow ? depositRow.pendingCount : 0, sub: 'Clientes por debajo de la meta mensual' },
        { label: 'Enviados del mes', value: sentMonth, sub: 'Bitácora de campañas enviadas' },
        { label: 'Errores del mes', value: errorMonth, sub: 'Intentos con error' }
      ],
      recentLogs: recent
    };
  }

  function getDashboard() {
    var cached = getCachedDashboard_();
    if (cached) return cached;

    var campaigns = resolveFixedCampaigns_();
    var masterData = loadMasterClients_();
    var depositData = loadCurrentMonthDepositProgress_();
    var weekendData = loadBilluWeekendData_(masterData);
    var logRows = getLogRows_();
    var logIndex = buildSuccessfulLogIndex_(logRows);
    var campaignRows = campaigns.map(function (campaign) {
      var metrics = calculateMetrics_(campaign, {
        masterData: masterData,
        depositData: depositData,
        weekendData: weekendData
      }, logRows, logIndex);
      return buildCampaignRow_(campaign, metrics);
    });

    var birthdayRow = campaignRows.filter(function (row) {
      return normalizeKey_(row.type) === 'CUMPLEANOS';
    })[0];
    var depositRow = campaignRows.filter(function (row) {
      return normalizeKey_(row.type) === 'DEPOSITO_MENSUAL';
    })[0];
    var weekendRow = campaignRows.filter(function (row) {
      return normalizeKey_(row.type) === 'BILLU_WEEKEND';
    })[0];

    var dashboard = {
      source: {
        campaignSpreadsheetId: AppConfig.getCampaignProgrammingSpreadsheetId(),
        campaignSpreadsheetName: getCampaignSpreadsheet_().getName(),
        logSheetName: AppConfig.getCampaignLogSheetName(),
        masterSpreadsheetId: AppConfig.getSpreadsheetId(),
        masterSpreadsheetName: masterData.source.spreadsheetName,
        masterSheetName: masterData.source.sheetName,
        transactionSources: Object.keys((depositData.sourceNames || []).concat(weekendData.sourceNames || []).reduce(function (acc, sourceName) {
          if (!sourceName) return acc;
          acc[sourceName] = true;
          return acc;
        }, {}))
      },
      summary: {
        cards: [
          { label: 'Campañas activas', value: Number(campaignRows.filter(function (row) { return normalizeKey_(row.status) === 'ACTIVE'; }).length || 0).toLocaleString('es-MX'), sub: 'Configuradas y listas para operar' },
          { label: 'Cumpleaños hoy', value: Number((birthdayRow && birthdayRow.eligibleCount) || 0).toLocaleString('es-MX'), sub: 'Clientes elegibles para el envío de hoy' },
          { label: 'Cumplieron $500', value: Number((depositRow && depositRow.achievedCount) || 0).toLocaleString('es-MX'), sub: 'Clientes que ya alcanzaron la meta mensual' },
          { label: 'Billú weekend', value: Number((weekendRow && weekendRow.eligibleCount) || 0).toLocaleString('es-MX'), sub: 'Clientes con compra digital >= $500 en 28, 29 y 30 marzo' },
          { label: 'Pendientes depósito', value: Number((depositRow && depositRow.pendingCount) || 0).toLocaleString('es-MX'), sub: 'Clientes a impactar durante el mes' }
        ]
      },
      campaigns: campaignRows,
      results: buildResults_(campaignRows, logRows),
      preview: null
    };
    setCachedDashboard_(dashboard);
    return dashboard;
  }

  function previewEmail(payload) {
    var campaign = getCampaignDefinitionById_(payload && payload.campaignId);
    var masterData = loadMasterClients_();
    var depositData = loadCurrentMonthDepositProgress_();
    var weekendData = loadBilluWeekendData_(masterData);
    var logRows = getLogRows_();
    var logIndex = buildSuccessfulLogIndex_(logRows);
    var metrics = calculateMetrics_(campaign, {
      masterData: masterData,
      depositData: depositData,
      weekendData: weekendData
    }, logRows, logIndex);
    var preview;
    var normalizedType = normalizeKey_(campaign.type);
    if (normalizedType === 'DEPOSITO_MENSUAL') {
      preview = buildMonthlyDepositPreviewData_(campaign, metrics.pendingToday[0] || metrics.eligibleToday[0] || metrics.audience[0] || null, metrics);
    } else if (normalizedType === 'BILLU_WEEKEND') {
      preview = buildBilluWeekendPreviewData_(campaign, metrics.eligibleToday[0] || metrics.pendingToday[0] || metrics.audience[0] || null);
    } else {
      preview = buildBirthdayPreviewData_(campaign, metrics.pendingToday[0] || metrics.eligibleToday[0] || metrics.audience[0] || null);
    }
    return {
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      recipient: serializeRecipient_(preview.recipient),
      subject: preview.subject,
      htmlBody: preview.htmlBody,
      plainText: preview.plainText
    };
  }

  function appendLogRow_(sheet, values) {
    sheet.appendRow(values);
  }

  function sendBirthdayCampaign(payload, userContext) {
    var campaign = getCampaignDefinitionById_(payload && payload.campaignId);
    if (normalizeKey_(campaign.status) !== 'ACTIVE') {
      throw new Error('La campaña está desactivada. Actívala para poder ejecutarla.');
    }
    if (!campaign.sendEnabled) {
      throw new Error('Esta campaña aún está en modo planeación. Los canales se conectarán más adelante.');
    }

    var masterData = loadMasterClients_();
    var depositData = loadCurrentMonthDepositProgress_();
    var weekendData = loadBilluWeekendData_(masterData);
    var logSheet = ensureLogSheet_();
    var logRows = getLogRows_();
    var logIndex = buildSuccessfulLogIndex_(logRows);
    var metrics = calculateMetrics_(campaign, {
      masterData: masterData,
      depositData: depositData,
      weekendData: weekendData
    }, logRows, logIndex);
    var forceResend = !!(payload && payload.forceResend);
    var recipients = forceResend ? metrics.eligibleToday : metrics.pendingToday;
    var results = [];
    var failures = [];

    recipients.forEach(function (recipient) {
      var preview = buildBirthdayPreviewData_(campaign, recipient);
      try {
        MailService.sendEmail(recipient.email, preview.subject, preview.plainText, {
          htmlBody: preview.htmlBody,
          replyTo: (userContext && userContext.email) || ''
        });
        appendLogRow_(logSheet, [
          campaign.campaignId,
          campaign.name,
          metrics.yearKey,
          recipient.rewardsId,
          recipient.email,
          formatBirthday_(recipient.birthDate),
          Utils.formatDate(new Date()),
          campaign.channel,
          'ENVIADO',
          preview.subject,
          '',
          (userContext && userContext.email) || ''
        ]);
        results.push(recipient.email);
      } catch (error) {
        appendLogRow_(logSheet, [
          campaign.campaignId,
          campaign.name,
          metrics.yearKey,
          recipient.rewardsId,
          recipient.email,
          formatBirthday_(recipient.birthDate),
          Utils.formatDate(new Date()),
          campaign.channel,
          'ERROR',
          preview.subject,
          error.message,
          (userContext && userContext.email) || ''
        ]);
        failures.push({
          rewardsId: recipient.rewardsId,
          email: recipient.email,
          error: error.message
        });
      }
    });

    clearDashboardCache_();
    return {
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      eligibleToday: metrics.eligibleToday.length,
      processed: recipients.length,
      sent: results.length,
      failed: failures.length,
      forceResend: forceResend,
      failures: failures.slice(0, 10)
    };
  }

  function saveCampaign(payload) {
    var campaign = getCampaignDefinitionById_(payload && payload.campaignId);
    var normalizedStatus = normalizeKey_(payload && payload.status);
    if (normalizedStatus !== 'ACTIVE' && normalizedStatus !== 'INACTIVE') {
      throw new Error('El estatus de la campaña no es válido.');
    }
    var statusMap = getCampaignStatusMap_();
    statusMap[campaign.campaignId] = normalizedStatus;
    setCampaignStatusMap_(statusMap);
    clearDashboardCache_();
    return {
      campaignId: campaign.campaignId,
      status: normalizedStatus
    };
  }

  function deleteCampaign() {
    throw new Error('Las campañas de este módulo están fijas. Por ahora no se pueden eliminar desde la interfaz.');
  }

  function runDailyCampaigns() {
    return resolveFixedCampaigns_().filter(function (campaign) {
      return normalizeKey_(campaign.status) === 'ACTIVE' && normalizeKey_(campaign.type) === 'CUMPLEANOS';
    }).map(function (campaign) {
      return sendBirthdayCampaign({ campaignId: campaign.campaignId }, { email: 'trigger@system.local' });
    });
  }

  return {
    getDashboard: getDashboard,
    previewEmail: previewEmail,
    saveCampaign: saveCampaign,
    deleteCampaign: deleteCampaign,
    sendBirthdayCampaign: sendBirthdayCampaign,
    runDailyCampaigns: runDailyCampaigns
  };
})();
