var OutlookRealOpeningsService = (function () {
  var HEADERS = ['timestamp', 'messageId', 'tipo', 'subject', 'source', 'bucketKey', 'eventCount'];
  var MIN_GRID_ROWS = 1000;
  var MIN_GRID_COLUMNS = 7;

  function ingest(payload) {
    validateToken_(payload);
    Utils.requireFields(payload, ['timestamp', 'messageId', 'tipo']);

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var sheet = ensureSheet_();
      var messageId = String(payload.messageId || '').trim();
      if (findRowByMessageId_(sheet, messageId)) {
        return {
          status: 'duplicate',
          messageId: messageId,
          sheetName: sheet.getName()
        };
      }

      sheet.appendRow([
        String(payload.timestamp || ''),
        messageId,
        String(payload.tipo || ''),
        String(payload.subject || ''),
        String(payload.source || 'apps-script'),
        String(payload.bucketKey || buildBucketKey_(payload.timestamp)),
        Number(payload.eventCount || 1)
      ]);

      return {
        status: 'inserted',
        messageId: messageId,
        sheetName: sheet.getName(),
        spreadsheetId: sheet.getParent().getId()
      };
    } finally {
      lock.releaseLock();
    }
  }

  function ensureSheet() {
    var sheet = ensureSheet_();
    return {
      ok: true,
      spreadsheetId: sheet.getParent().getId(),
      sheetName: sheet.getName(),
      headers: HEADERS.slice()
    };
  }

  function getWebhookConfig() {
    var sheet = ensureSheet_();
    return {
      ok: true,
      webAppUrl: ScriptApp.getService().getUrl(),
      spreadsheetId: sheet.getParent().getId(),
      sheetName: sheet.getName(),
      token: AppConfig.getOutlookIngressToken()
    };
  }

  function rotateToken() {
    var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    AppConfig.set('OUTLOOK_INGEST_TOKEN', token);
    return {
      ok: true,
      token: token
    };
  }

  function cleanupSheet() {
    var now = new Date();
    var sheet = ensureSheet_();
    return {
      ok: true,
      spreadsheetId: sheet.getParent().getId(),
      sheetName: sheet.getName(),
      cleanedAt: Utils.formatDate(now),
      retentionHours: null,
      removedRows: 0,
      remainingRows: Math.max(0, sheet.getLastRow() - 1),
      note: 'No automatic cleanup was applied. Outlook sheet is preserved for manual maintenance.'
    };
  }

  function ensureSheet_() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getOutlookRealSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(AppConfig.getOutlookRealSheetName()) || spreadsheet.insertSheet(AppConfig.getOutlookRealSheetName());
    var currentHeaders = sheet.getLastRow() ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0] : [];
    HEADERS.forEach(function (header, index) {
      if (currentHeaders[index] !== header) {
        sheet.getRange(1, index + 1).setValue(header);
      }
    });
    sheet.setFrozenRows(1);
    ensureGridCapacity_(sheet);
    return sheet;
  }

  function findRowByMessageId_(sheet, messageId) {
    if (!messageId) return null;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    var values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var index = 0; index < values.length; index += 1) {
      if (String(values[index][0] || '').trim() === messageId) {
        return index + 2;
      }
    }
    return null;
  }

  function validateToken_(payload) {
    var expectedToken = AppConfig.getOutlookIngressToken();
    if (!expectedToken) throw new Error('Missing OUTLOOK_INGEST_TOKEN configuration.');
    if (String(payload.token || '') !== String(expectedToken)) {
      throw new Error('Invalid ingest token.');
    }
  }

  function ensureGridCapacity_(sheet) {
    if (sheet.getMaxRows() < MIN_GRID_ROWS) {
      sheet.insertRowsAfter(sheet.getMaxRows(), MIN_GRID_ROWS - sheet.getMaxRows());
    }
    if (sheet.getMaxColumns() < MIN_GRID_COLUMNS) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), MIN_GRID_COLUMNS - sheet.getMaxColumns());
    }
  }

  function buildBucketKey_(value) {
    var timestamp = value ? new Date(value) : new Date();
    if (isNaN(timestamp.getTime())) timestamp = new Date();
    var minutes = timestamp.getMinutes();
    timestamp.setMinutes(minutes - (minutes % 5), 0, 0);
    return Utilities.formatDate(timestamp, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyyMMddHHmm');
  }

  return {
    ingest: ingest,
    ensureSheet: ensureSheet,
    cleanupSheet: cleanupSheet,
    getWebhookConfig: getWebhookConfig,
    rotateToken: rotateToken
  };
})();
