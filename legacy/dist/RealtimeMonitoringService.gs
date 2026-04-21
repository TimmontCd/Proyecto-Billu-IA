var RealtimeMonitoringService = (function () {
  var LIVE_SYNC_INTERVAL_MINUTES = 1;
  var ROLLUP_INTERVAL_MINUTES = 5;
  var BUFFER_WINDOW_MINUTES = 5;
  var REALTIME_ALERT_TYPE = 'SIN_FINALIZACIONES_ENROLAMIENTO_CONFIRMACION_BILLU';
  var REALTIME_ALERT_MODULE = 'MonitoreoRealtime';
  var COMPLETED_EVENT_TAG = 'enrolamiento_confirmacion_billu';
  var PEAK_START_HOUR = 7;
  var PEAK_END_HOUR = 23;
  var PEAK_ALERT_MINUTES = 45;
  var OFF_HOURS_ALERT_MINUTES = 240;
  var BUFFER_HEADERS = [
    'bucketKey',
    'bucketMinute',
    'eventName',
    'eventLabel',
    'eventCount',
    'dayKey',
    'syncedAt',
    'source'
  ];
  var DAILY_HEADERS = BUFFER_HEADERS.slice();
  var FLOW_DEFINITIONS = [
    {
      id: 'n2',
      title: 'Cuenta Billú N2',
      shortTitle: 'N2',
      events: [
        { key: 'start', tag: 'enrolamiento_paso_1_INE_frontal', label: 'Inicio de Alta de Cuenta' },
        { key: 'step3', tag: 'enrolamiento_paso_3_CODIGO', label: 'Paso 3 Codigo' },
        { key: 'step4', tag: 'enrolamiento_paso_4_DATOS', label: 'Paso 4 Datos' },
        { key: 'step5', tag: 'enrolamiento_paso_5_PASS', label: 'Paso 5 Password' },
        { key: 'step6', tag: 'enrolamiento_paso_6_TYC', label: 'Paso 6 Terminos' },
        { key: 'step7', tag: 'enrolamiento_paso_7_SMS', label: 'Paso 7 SMS' },
        { key: 'completed', tag: 'enrolamiento_confirmacion_billu', label: 'Finalizacion' }
      ]
    },
    {
      id: 'n4',
      title: 'Cuenta Billú Premium N4',
      shortTitle: 'N4',
      events: [
        { key: 'start', tag: 'BIL4MIG_QueremSaberdeti', label: 'Inicio migracion' },
        { key: 'profile', tag: 'BIL4MIG_CatActivProf_Completo', label: 'Cat Activ Prof completo' },
        { key: 'ine', tag: 'BIL4MIG_6_ine_Scan', label: 'INE Scan' },
        { key: 'selfie', tag: 'BIL4MIG_8_sefie_previa', label: 'Selfie previa' },
        { key: 'contract', tag: 'BIL4MIG_18_contratoBilluPremium', label: 'Contrato Billú Premium' },
        { key: 'completed', tag: 'BIL4MIG_22_migracion_fin', label: 'Migracion finalizada' }
      ]
    }
  ];

  function getDashboard() {
    try {
      var now = new Date();
      var bufferSheet = ensureBufferSheet_();
      var dailySheet = ensureDailySheet_();
      var bufferRows = readMonitoringRows_(bufferSheet, BUFFER_HEADERS);
      var dailyRows = readMonitoringRows_(dailySheet, DAILY_HEADERS);
      var lastSyncedAt = getLatestSyncedAt_(bufferRows) || getLatestSyncedAt_(dailyRows) || '';
      var syncResult = {
        syncedAt: lastSyncedAt,
        skipped: true,
        bufferRows: bufferRows.length,
        dailyRows: dailyRows.length
      };

      if (!bufferRows.length && !dailyRows.length && shouldSync_(lastSyncedAt, now, LIVE_SYNC_INTERVAL_MINUTES)) {
        var opportunistic = syncLiveBufferIfAvailable_();
        if (opportunistic) {
          syncResult = opportunistic;
          bufferRows = opportunistic.bufferRowsData || [];
        }
      }

      return buildDashboardPayload_(bufferRows, dailyRows, syncResult, now);
    } catch (error) {
      if (isGaPermissionError_(error)) {
        return buildUnavailableDashboard_(error);
      }
      throw error;
    }
  }

  function syncCache() {
    return rollupDaily_();
  }

  function syncLiveBuffer() {
    return syncLiveBuffer_();
  }

  function detectConfirmationOutageAndAlert() {
    var now = new Date();
    var bufferSheet = ensureBufferSheet_();
    var dailySheet = ensureDailySheet_();
    var bufferRows = readMonitoringRows_(bufferSheet, BUFFER_HEADERS);
    var dailyRows = readMonitoringRows_(dailySheet, DAILY_HEADERS);
    var assessment = evaluateConfirmationAlerting_(bufferRows, dailyRows, now);

    if (assessment.stage === 'healthy' || assessment.stage === 'disabled') {
      return Object.assign({
        ok: true,
        sent: false
      }, assessment);
    }

    var alertRepo = new BaseRepository(APP_CONSTANTS.SHEETS.ALERTS);
    var latestAlert = findLatestConfirmationAlert_(alertRepo);
    var latestAlertAt = latestAlert && latestAlert.fechaEnvio ? parseTimestamp_(latestAlert.fechaEnvio) : null;
    if (latestAlertAt && minutesBetween_(latestAlertAt, now) < assessment.cadenceMinutes) {
      return Object.assign({
        ok: true,
        sent: false,
        throttled: true,
        lastAlertAt: latestAlert ? latestAlert.fechaEnvio : ''
      }, assessment);
    }

    var message = buildConfirmationAlertMessage_(assessment);
    var alert = alertRepo.insert({
      tipo: REALTIME_ALERT_TYPE,
      modulo: REALTIME_ALERT_MODULE,
      severidad: APP_CONSTANTS.ALERT_SEVERITY.WARNING,
      mensaje: message,
      destinatarios: AppConfig.get('ALERT_EMAILS', ''),
      fechaEnvio: Utils.formatDate(now),
      entidadId: COMPLETED_EVENT_TAG,
      metadataJson: Utils.stringifyJson(assessment)
    });
    MailService.sendAlert(alert);

    return Object.assign({
      ok: true,
      sent: true,
      alertId: alert.id,
      alertSentAt: alert.fechaEnvio,
      recipients: alert.destinatarios || ''
    }, assessment);
  }

  function inspectDuplicateBuckets() {
    var now = new Date();
    var bufferSheet = ensureBufferSheet_();
    var dailySheet = ensureDailySheet_();
    return {
      inspectedAt: Utils.formatDate(now),
      eventos5minutos: buildDuplicateSummary_(readMonitoringRows_(bufferSheet, BUFFER_HEADERS)),
      acumuladoDiario: buildDuplicateSummary_(readMonitoringRows_(dailySheet, DAILY_HEADERS))
    };
  }

  function repairRealtimeSheets() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var now = new Date();
      var bufferSheet = ensureBufferSheet_();
      var dailySheet = ensureDailySheet_();
      var fixedBufferRows = normalizeRows_(readMonitoringRows_(bufferSheet, BUFFER_HEADERS));
      var fixedDailyRows = normalizeRows_(readMonitoringRows_(dailySheet, DAILY_HEADERS).filter(function (row) {
        return isSameDay_(row.timestamp, now);
      }));
      writeRows_(bufferSheet, BUFFER_HEADERS, fixedBufferRows);
      writeRows_(dailySheet, DAILY_HEADERS, fixedDailyRows);
      return {
        repairedAt: Utils.formatDate(now),
        eventos5minutos: fixedBufferRows.length,
        acumuladoDiario: fixedDailyRows.length
      };
    } finally {
      lock.releaseLock();
    }
  }

  function rebuildTodayCacheFromAudit() {
    return syncCache();
  }

  function resetAnalyticsBaseline() {
    return cleanupCacheForNewDay();
  }

  function disableAnalyticsRealtime() {
    return cleanupCacheForNewDay();
  }

  function cleanupCacheForNewDay() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var now = new Date();
      var bufferSheet = ensureBufferSheet_();
      var dailySheet = ensureDailySheet_();
      writeRows_(bufferSheet, BUFFER_HEADERS, []);
      writeRows_(dailySheet, DAILY_HEADERS, []);
      return {
        ok: true,
        clearedAt: Utils.formatDate(now),
        eventos5minutos: 0,
        acumuladoDiario: 0
      };
    } finally {
      lock.releaseLock();
    }
  }

  function rollupDaily_() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      return syncCacheInternal_();
    } finally {
      lock.releaseLock();
    }
  }

  function syncLiveBuffer_() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      return syncLiveBufferInternal_();
    } finally {
      lock.releaseLock();
    }
  }

  function syncLiveBufferIfAvailable_() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(1000)) return null;
    try {
      return syncLiveBufferInternal_();
    } finally {
      lock.releaseLock();
    }
  }

  function syncLiveBufferInternal_() {
    var now = new Date();
    var bufferSheet = ensureBufferSheet_();
    var rawRows = getRealtimeRows_(
      AppConfig.getGa4PropertyId(),
      now,
      BUFFER_WINDOW_MINUTES,
      getMonitoredEvents_().map(function (item) { return item.tag; }),
      300
    );
    var bufferRows = buildBufferRows_(rawRows, now);
    writeRows_(bufferSheet, BUFFER_HEADERS, bufferRows);

    return {
      syncedAt: Utils.formatDate(now),
      skipped: false,
      bufferRows: bufferRows.length,
      dailyRows: 0,
      touchedBuckets: rawRows.length,
      bufferRowsData: bufferRows,
      dailyRowsData: []
    };
  }

  function syncCacheInternal_() {
    var now = new Date();
    var dailySheet = ensureDailySheet_();
    var liveResult = syncLiveBufferInternal_();
    var bufferRows = liveResult.bufferRowsData || [];
    var existingDailyRows = readMonitoringRows_(dailySheet, DAILY_HEADERS).filter(function (row) {
      return isSameDay_(row.timestamp, now);
    });
    var mergedDailyRows = normalizeRows_(existingDailyRows.concat(bufferRows));

    writeRows_(dailySheet, DAILY_HEADERS, mergedDailyRows);

    return {
      syncedAt: Utils.formatDate(now),
      skipped: false,
      bufferRows: bufferRows.length,
      dailyRows: mergedDailyRows.length,
      touchedBuckets: liveResult.touchedBuckets || 0,
      bufferRowsData: bufferRows,
      dailyRowsData: mergedDailyRows
    };
  }

  function buildDashboardPayload_(bufferRows, dailyRows, syncResult, now) {
    var latestAny = bufferRows[0] || dailyRows[0] || null;
    var flows = FLOW_DEFINITIONS.map(function (flow) {
      return buildFlowPayload_(flow, bufferRows, dailyRows, now);
    });

    return {
      ok: true,
      propertyConnection: 'ga4-5min-sheets',
      generatedAt: Utils.formatDate(now),
      connection: {
        propertyId: AppConfig.getGa4PropertyId(),
        source: 'GA4 realtime -> Eventos5minutos (1 min) -> AcumuladoDiario (5 min)',
        monitoredEvents: getMonitoredEvents_().map(function (item) { return item.tag; }).join(', '),
        bufferWindowMinutes: BUFFER_WINDOW_MINUTES,
        syncIntervalMinutes: LIVE_SYNC_INTERVAL_MINUTES,
        bucketMinutes: BUFFER_WINDOW_MINUTES,
        rollupIntervalMinutes: ROLLUP_INTERVAL_MINUTES,
        cacheSpreadsheetId: AppConfig.getRealtimeCacheSpreadsheetId(),
        cacheSheetName: AppConfig.getRealtimeCacheSheetName(),
        windowSheetName: AppConfig.getRealtimeWindowSheetName(),
        cacheRows: bufferRows.length,
        dailyRows: dailyRows.length,
        lastSyncAt: syncResult && syncResult.syncedAt ? syncResult.syncedAt : '',
        lastEventAt: latestAny ? Utils.formatDate(latestAny.timestamp) : ''
      },
      monitoredEvents: getMonitoredEvents_(),
      flows: flows,
      statusSummary: buildStatusSummary_(flows, now),
      alerting: evaluateConfirmationAlerting_(bufferRows, dailyRows, now)
    };
  }

  function buildUnavailableDashboard_(error) {
    var now = new Date();
    return {
      ok: false,
      propertyConnection: 'ga4-restricted',
      generatedAt: Utils.formatDate(now),
      connection: {
        propertyId: AppConfig.getGa4PropertyId(),
        source: 'GA4 no disponible para este usuario',
        monitoredEvents: getMonitoredEvents_().map(function (item) { return item.tag; }).join(', '),
        bufferWindowMinutes: BUFFER_WINDOW_MINUTES,
        syncIntervalMinutes: LIVE_SYNC_INTERVAL_MINUTES,
        bucketMinutes: BUFFER_WINDOW_MINUTES,
        rollupIntervalMinutes: ROLLUP_INTERVAL_MINUTES,
        cacheSpreadsheetId: AppConfig.getRealtimeCacheSpreadsheetId(),
        cacheSheetName: AppConfig.getRealtimeCacheSheetName(),
        windowSheetName: AppConfig.getRealtimeWindowSheetName(),
        cacheRows: 0,
        dailyRows: 0,
        lastSyncAt: '',
        lastEventAt: ''
      },
      monitoredEvents: getMonitoredEvents_(),
      flows: FLOW_DEFINITIONS.map(function (flow) {
        return buildFlowPayload_(flow, [], [], now);
      }),
      statusSummary: 'No fue posible consultar GA4 para poblar Eventos5minutos y AcumuladoDiario.',
      alerting: {
        stage: 'warning',
        syncIntervalMinutes: LIVE_SYNC_INTERVAL_MINUTES,
        rollupIntervalMinutes: ROLLUP_INTERVAL_MINUTES,
        warningMinutes: 0,
        criticalMinutes: 0,
        pendingSince: ''
      },
      userMessage: error && error.message ? error.message : ''
    };
  }

  function ensureBufferSheet_() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getRealtimeCacheSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(AppConfig.getRealtimeCacheSheetName()) || spreadsheet.insertSheet(AppConfig.getRealtimeCacheSheetName());
    ensureHeaders_(sheet, BUFFER_HEADERS);
    return sheet;
  }

  function ensureDailySheet_() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getRealtimeCacheSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(AppConfig.getRealtimeWindowSheetName()) || spreadsheet.insertSheet(AppConfig.getRealtimeWindowSheetName());
    ensureHeaders_(sheet, DAILY_HEADERS);
    return sheet;
  }

  function readMonitoringRows_(sheet, headers) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    return normalizeRows_(values.map(function (row) {
      var timestamp = parseTimestamp_(row[1]);
      if (!row[0] || !timestamp || !row[2]) return null;
      return {
        bucketKey: String(row[0] || ''),
        bucketMinute: String(row[1] || ''),
        timestamp: timestamp,
        eventName: String(row[2] || ''),
        eventLabel: String(row[3] || findLabelByTag_(row[2]) || row[2]),
        eventCount: Number(row[4] || 0),
        dayKey: String(row[5] || ''),
        syncedAt: String(row[6] || ''),
        source: String(row[7] || 'GA4 realtime')
      };
    }).filter(Boolean));
  }

  function writeRows_(sheet, headers, rows) {
    var existingRows = Math.max(0, sheet.getLastRow() - 1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if ((rows || []).length) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map(function (row) {
        return [
          row.bucketKey,
          row.bucketMinute,
          row.eventName,
          row.eventLabel,
          row.eventCount,
          row.dayKey,
          row.syncedAt,
          row.source
        ];
      }));
    }
    if (existingRows > (rows || []).length) {
      sheet.getRange((rows || []).length + 2, 1, existingRows - (rows || []).length, headers.length).clearContent();
    }
    sheet.setFrozenRows(1);
  }

  function buildBufferRows_(rawRows, now) {
    var bucketStart = floorToInterval_(now, BUFFER_WINDOW_MINUTES);
    var byEvent = {};

    getMonitoredEvents_().forEach(function (item) {
      byEvent[item.tag] = 0;
    });

    (rawRows || []).forEach(function (row) {
      if (!byEvent.hasOwnProperty(row.eventName)) return;
      byEvent[row.eventName] += Number(row.eventCount || 0);
    });

    return normalizeRows_(Object.keys(byEvent).map(function (eventName) {
      var total = Number(byEvent[eventName] || 0);
      if (!total) return null;
      return buildRow_(bucketStart, eventName, total, now);
    }).filter(Boolean));
  }

  function buildRow_(bucketStart, eventName, eventCount, now) {
    return {
      bucketKey: buildBucketKey_(bucketStart, eventName),
      bucketMinute: Utils.formatDate(bucketStart),
      timestamp: bucketStart,
      eventName: eventName,
      eventLabel: findLabelByTag_(eventName) || eventName,
      eventCount: Number(eventCount || 0),
      dayKey: Utilities.formatDate(bucketStart, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, APP_CONSTANTS.DATE_FORMAT),
      syncedAt: Utils.formatDate(now),
      source: 'GA4 realtime'
    };
  }

  function buildBreakdown_(rows, events, valueKey) {
    var grouped = {};
    (events || []).forEach(function (item) {
      grouped[item.tag] = {
        evento: item.label,
        tag: item.tag
      };
      grouped[item.tag][valueKey] = 0;
    });

    (rows || []).forEach(function (row) {
      if (!grouped[row.eventName]) {
        grouped[row.eventName] = {
          evento: row.eventLabel || row.eventName,
          tag: row.eventName
        };
        grouped[row.eventName][valueKey] = 0;
      }
      grouped[row.eventName][valueKey] += Number(row.eventCount || 0);
    });

    return (events || []).map(function (item) {
      return grouped[item.tag];
    });
  }

  function buildRecentEvents_(rows) {
    return (rows || []).map(function (row) {
      return {
        bucket: row.bucketMinute,
        evento: row.eventLabel,
        tag: row.eventName,
        eventos: row.eventCount,
        sincronizadoEn: row.syncedAt
      };
    });
  }

  function getRealtimeRows_(propertyId, now, windowMinutes, eventNames, limit) {
    var payload = {
      minuteRanges: [{ startMinutesAgo: Math.max(1, Number(windowMinutes || BUFFER_WINDOW_MINUTES)) - 1, endMinutesAgo: 0 }],
      dimensions: [{ name: 'eventName' }, { name: 'minutesAgo' }],
      metrics: [{ name: 'eventCount' }],
      limit: Number(limit || 200)
    };
    var filter = buildEventNameFilter_(eventNames);
    if (filter) payload.dimensionFilter = filter;

    var response = AnalyticsService.runRealtimeReport(payload);
    return (response.rows || []).map(function (row) {
      return {
        eventName: String(row.dimensionValues[0].value || ''),
        minutesAgo: Number(row.dimensionValues[1].value || 0),
        eventCount: Number(row.metricValues[0].value || 0)
      };
    });
  }

  function buildEventNameFilter_(eventNames) {
    var values = Utils.ensureArray(eventNames).map(function (eventName) {
      return String(eventName || '').trim();
    }).filter(Boolean);
    if (!values.length) return null;
    return {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: values
        }
      }
    };
  }

  function normalizeRows_(rows) {
    var rowMap = {};
    (rows || []).forEach(function (row) {
      if (!row || !row.bucketKey || !row.timestamp) return;
      rowMap[row.bucketKey] = mergeRows_(rowMap[row.bucketKey], row);
    });
    return Object.keys(rowMap).map(function (key) {
      return rowMap[key];
    }).sort(function (left, right) {
      if (left.timestamp.getTime() === right.timestamp.getTime()) {
        return String(left.eventName).localeCompare(String(right.eventName));
      }
      return right.timestamp.getTime() - left.timestamp.getTime();
    });
  }

  function mergeRows_(left, right) {
    if (!left) return right;
    return {
      bucketKey: right.bucketKey || left.bucketKey,
      bucketMinute: right.bucketMinute || left.bucketMinute,
      timestamp: right.timestamp || left.timestamp,
      eventName: right.eventName || left.eventName,
      eventLabel: right.eventLabel || left.eventLabel,
      eventCount: Math.max(Number(left.eventCount || 0), Number(right.eventCount || 0)),
      dayKey: right.dayKey || left.dayKey,
      syncedAt: right.syncedAt || left.syncedAt,
      source: right.source || left.source
    };
  }

  function buildDuplicateSummary_(rows) {
    var counts = {};
    (rows || []).forEach(function (row) {
      var key = String(row && row.bucketKey || '');
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return {
      totalRows: (rows || []).length,
      uniqueBuckets: Object.keys(counts).length,
      duplicateBuckets: Object.keys(counts).filter(function (key) { return counts[key] > 1; }).length
    };
  }

  function ensureHeaders_(sheet, headers) {
    var currentHeaders = sheet.getLastRow()
      ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
      : [];
    headers.forEach(function (header, index) {
      if (currentHeaders[index] !== header) {
        sheet.getRange(1, index + 1).setValue(header);
      }
    });
    sheet.setFrozenRows(1);
  }

  function parseTimestamp_(value) {
    if (!value) return null;
    if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
      return value;
    }
    var raw = String(value).trim();
    if (!raw) return null;
    var parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return parsed;
    var withoutLocaleHint = raw.replace(/\s*\([^)]*\)\s*$/, '');
    parsed = new Date(withoutLocaleHint);
    if (!isNaN(parsed.getTime())) return parsed;
    if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}$/.test(raw)) {
      parsed = new Date(raw.replace(/\s+/, 'T'));
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }

  function getLatestSyncedAt_(rows) {
    var latest = '';
    (rows || []).forEach(function (row) {
      var value = String(row && row.syncedAt || '');
      if (!value) return;
      if (!latest) {
        latest = value;
        return;
      }
      var left = parseTimestamp_(latest);
      var right = parseTimestamp_(value);
      if (right && (!left || right.getTime() > left.getTime())) {
        latest = value;
      }
    });
    return latest;
  }

  function shouldSync_(lastSyncedAt, now, intervalMinutes) {
    if (!lastSyncedAt) return true;
    var parsed = parseTimestamp_(lastSyncedAt);
    if (!parsed) return true;
    return minutesBetween_(parsed, now) >= Number(intervalMinutes || LIVE_SYNC_INTERVAL_MINUTES);
  }

  function sumEventCounts_(rows, eventName) {
    return (rows || []).reduce(function (sum, row) {
      return row.eventName === eventName ? sum + Number(row.eventCount || 0) : sum;
    }, 0);
  }

  function findLatestByTag_(rows, eventName) {
    return (rows || []).filter(function (row) {
      return row.eventName === eventName;
    }).sort(function (left, right) {
      return right.timestamp.getTime() - left.timestamp.getTime();
    })[0] || null;
  }

  function findLabelByTag_(eventName) {
    var found = getMonitoredEvents_().filter(function (item) {
      return item.tag === eventName;
    })[0];
    return found ? found.label : '';
  }

  function getTagByKey_(flow, key) {
    var found = ((flow && flow.events) || []).filter(function (item) {
      return item.key === key;
    })[0];
    return found ? found.tag : '';
  }

  function getMonitoredEvents_() {
    return FLOW_DEFINITIONS.reduce(function (items, flow) {
      return items.concat(flow.events || []);
    }, []);
  }

  function belongsToFlow_(flow, eventName) {
    return ((flow && flow.events) || []).some(function (item) {
      return item.tag === eventName;
    });
  }

  function buildFlowPayload_(flow, bufferRows, dailyRows, now) {
    var startTag = getTagByKey_(flow, 'start');
    var completedTag = getTagByKey_(flow, 'completed');
    var flowBufferRows = (bufferRows || []).filter(function (row) {
      return belongsToFlow_(flow, row.eventName);
    });
    var flowDailyRows = (dailyRows || []).filter(function (row) {
      return belongsToFlow_(flow, row.eventName);
    });
    var startsToday = sumEventCounts_(flowDailyRows, startTag);
    var completedToday = sumEventCounts_(flowDailyRows, completedTag);
    var startsWindow = sumEventCounts_(flowBufferRows, startTag);
    var completedWindow = sumEventCounts_(flowBufferRows, completedTag);
    var latestStart = findLatestByTag_(flowDailyRows, startTag);
    var latestCompleted = findLatestByTag_(flowDailyRows, completedTag);

    return {
      id: flow.id,
      title: flow.title,
      shortTitle: flow.shortTitle,
      monitoredEvents: flow.events || [],
      kpis: {
        startsToday: startsToday,
        completedToday: completedToday,
        startsCurrentWindow: startsWindow,
        completedCurrentWindow: completedWindow,
        latestStartAt: latestStart ? Utils.formatDate(latestStart.timestamp) : '',
        latestCompletedAt: latestCompleted ? Utils.formatDate(latestCompleted.timestamp) : '',
        completionRateToday: startsToday ? roundNumber_(completedToday / startsToday * 100, 1) : 0
      },
      dailyBreakdown: buildBreakdown_(flowDailyRows, flow.events || [], 'totalHoy'),
      bufferBreakdown: buildBreakdown_(flowBufferRows, flow.events || [], 'totalUltimos5Min'),
      recentEvents: buildRecentEvents_(flowBufferRows),
      statusSummary: buildFlowStatusSummary_(flow, startsToday, completedToday, now)
    };
  }

  function buildFlowStatusSummary_(flow, startsToday, completedToday, now) {
    return flow.title
      + ': al corte de '
      + Utils.formatDate(now)
      + ' tenemos '
      + Number(startsToday || 0).toLocaleString('es-MX')
      + ' inicio(s) y '
      + Number(completedToday || 0).toLocaleString('es-MX')
      + ' finalizacion(es).';
  }

  function buildStatusSummary_(flows, now) {
    var parts = (flows || []).map(function (flow) {
      return flow.shortTitle
        + ' '
        + Number(flow.kpis && flow.kpis.startsToday || 0).toLocaleString('es-MX')
        + '/'
        + Number(flow.kpis && flow.kpis.completedToday || 0).toLocaleString('es-MX');
    });
    return 'Eventos5minutos se refresca en linea cada minuto y AcumuladoDiario consolida el corte cada 5 minutos. Al corte de '
      + Utils.formatDate(now)
      + ' el monitor muestra '
      + parts.join(' | ')
      + ' (inicios/finalizaciones) para N2 y N4.';
  }

  function evaluateConfirmationAlerting_(bufferRows, dailyRows, now) {
    var latestCompleted = findLatestByTag_((bufferRows || []).concat(dailyRows || []), COMPLETED_EVENT_TAG);
    var scriptTz = Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE;
    var hour = Number(Utilities.formatDate(now, scriptTz, 'H'));
    var isPeakHours = hour >= PEAK_START_HOUR && hour <= PEAK_END_HOUR;
    var cadenceMinutes = isPeakHours ? PEAK_ALERT_MINUTES : OFF_HOURS_ALERT_MINUTES;
    var baseline = latestCompleted ? new Date(latestCompleted.timestamp) : buildNoCompletionBaseline_(now, isPeakHours);
    var elapsedMinutes = minutesBetween_(baseline, now);
    var pendingSince = Utils.formatDate(baseline);

    return {
      stage: elapsedMinutes >= cadenceMinutes ? 'warning' : 'healthy',
      syncIntervalMinutes: LIVE_SYNC_INTERVAL_MINUTES,
      rollupIntervalMinutes: ROLLUP_INTERVAL_MINUTES,
      warningMinutes: cadenceMinutes,
      criticalMinutes: 0,
      cadenceMinutes: cadenceMinutes,
      pendingSince: elapsedMinutes >= cadenceMinutes ? pendingSince : '',
      pendingSinceRaw: pendingSince,
      latestCompletedAt: latestCompleted ? Utils.formatDate(latestCompleted.timestamp) : '',
      elapsedMinutes: elapsedMinutes,
      windowLabel: isPeakHours ? '07:00-23:59' : '00:00-06:59',
      alertEventTag: COMPLETED_EVENT_TAG
    };
  }

  function buildNoCompletionBaseline_(now, isPeakHours) {
    var baseline = new Date(now);
    if (isPeakHours) {
      baseline.setHours(PEAK_START_HOUR, 0, 0, 0);
      return baseline;
    }
    baseline.setHours(0, 0, 0, 0);
    return baseline;
  }

  function findLatestConfirmationAlert_(alertRepo) {
    return alertRepo.getAll().filter(function (item) {
      return String(item.tipo || '') === REALTIME_ALERT_TYPE
        && String(item.entidadId || '') === COMPLETED_EVENT_TAG;
    }).sort(function (left, right) {
      var leftDate = parseTimestamp_(left.fechaEnvio) || new Date(0);
      var rightDate = parseTimestamp_(right.fechaEnvio) || new Date(0);
      return rightDate.getTime() - leftDate.getTime();
    })[0] || null;
  }

  function buildConfirmationAlertMessage_(assessment) {
    var lines = [
      'Evento monitoreado: ' + COMPLETED_EVENT_TAG,
      'Estado: sin finalizaciones dentro de la ventana esperada',
      'Ventana actual: ' + assessment.windowLabel,
      'Frecuencia de alerta aplicada: cada ' + formatCadenceLabel_(assessment.cadenceMinutes),
      assessment.latestCompletedAt
        ? 'Ultima finalizacion detectada: ' + assessment.latestCompletedAt
        : 'No se detectaron finalizaciones en la ventana base de evaluacion',
      'Pendiente desde: ' + (assessment.pendingSinceRaw || assessment.pendingSince || ''),
      'Minutos transcurridos sin finalizacion: ' + Number(assessment.elapsedMinutes || 0).toLocaleString('es-MX')
    ];
    return lines.join('\n');
  }

  function buildBucketKey_(timestamp, eventName) {
    return Utilities.formatDate(timestamp, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyyMMddHHmm') + ':' + eventName;
  }

  function floorToInterval_(value, intervalMinutes) {
    var date = new Date(value);
    var interval = Math.max(1, Number(intervalMinutes || 1));
    var minutes = date.getMinutes();
    date.setMinutes(minutes - (minutes % interval), 0, 0);
    return date;
  }

  function startOfDay_(value) {
    var date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function minutesBetween_(date, now) {
    return Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  }

  function isSameDay_(left, right) {
    return Utilities.formatDate(left, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, APP_CONSTANTS.DATE_FORMAT) ===
      Utilities.formatDate(right, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, APP_CONSTANTS.DATE_FORMAT);
  }

  function roundNumber_(value, decimals) {
    var factor = Math.pow(10, decimals || 0);
    return Math.round(Number(value || 0) * factor) / factor;
  }

  function isGaPermissionError_(error) {
    var message = String(error && error.message || error || '');
    return message.indexOf('PERMISSION_DENIED') !== -1
      || message.indexOf('does not have sufficient permissions') !== -1
      || message.indexOf('GA4 API error') !== -1;
  }

  function formatCadenceLabel_(minutes) {
    var value = Number(minutes || 0);
    if (value === 240) return '4 horas';
    if (value === 45) return '45 minutos';
    if (value % 60 === 0 && value > 0) return (value / 60) + ' horas';
    return value + ' minutos';
  }

  return {
    getDashboard: getDashboard,
    detectConfirmationOutageAndAlert: detectConfirmationOutageAndAlert,
    inspectDuplicateBuckets: inspectDuplicateBuckets,
    repairRealtimeSheets: repairRealtimeSheets,
    syncLiveBuffer: syncLiveBuffer,
    syncCache: syncCache,
    rebuildTodayCacheFromAudit: rebuildTodayCacheFromAudit,
    resetAnalyticsBaseline: resetAnalyticsBaseline,
    disableAnalyticsRealtime: disableAnalyticsRealtime,
    cleanupCacheForNewDay: cleanupCacheForNewDay
  };
})();
