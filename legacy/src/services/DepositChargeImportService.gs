var DepositChargeImportService = (function () {
  var FILES = {
    RAW_NAME: 'DepositosCargosRaw_sanitized.csv',
    SUMMARY_NAME: 'DepositosCargosSummary.csv',
    KPI_NAME: 'DepositosCargosKpi.csv',
    RAW_ID: '18qqkg-5Qcj8OOaLj_SJttnnzHb6uZ_yc',
    SUMMARY_ID: '1QHCO_PAIV4auXcfXWeJ1N2pgn3GuUimm',
    KPI_ID: '17GKdoXvsd1311yDf4VSBuOCdUZqgnYcm'
  };

  function importBundleFromDrive() {
    var rawFile = getFile_('DEPOSIT_CHARGE_RAW_FILE_ID', FILES.RAW_ID, FILES.RAW_NAME);
    var summaryFile = getFile_('DEPOSIT_CHARGE_SUMMARY_FILE_ID', FILES.SUMMARY_ID, FILES.SUMMARY_NAME);
    var kpiFile = getFile_('DEPOSIT_CHARGE_KPI_FILE_ID', FILES.KPI_ID, FILES.KPI_NAME);

    if (!rawFile || !summaryFile || !kpiFile) {
      throw new Error('No se encontraron los archivos CSV saneados en la carpeta raiz de Drive.');
    }

    writeCsvFileToSheet_(rawFile, APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_RAW);
    writeCsvFileToSheet_(summaryFile, APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_SUMMARY);
    writeCsvFileToSheet_(kpiFile, APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_KPI);

    AuditLogger.log('DepositosCargos', 'CSV_BUNDLE', 'IMPORT', {
      rawFileId: rawFile.getId(),
      summaryFileId: summaryFile.getId(),
      kpiFileId: kpiFile.getId()
    }, AuthService.getCurrentEmail());

    return DepositChargeCorrelationService.getModuleDashboard();
  }

  function importFromManualSheet(sheetName) {
    return DepositChargeCorrelationService.rebuildSummaryFromManual();
  }

  function uploadWorkbookAndSummarize(payload, userContext) {
    Utils.requireFields(payload, ['fileName', 'mimeType', 'base64']);
    var tempSpreadsheetId = isCsvPayload_(payload)
      ? createTemporarySpreadsheetFromCsv_(payload)
      : uploadAsTemporarySpreadsheet_(payload);
    try {
      var tempSpreadsheet = SpreadsheetApp.openById(tempSpreadsheetId);
      var firstSheet = tempSpreadsheet.getSheets()[0];
      if (!firstSheet || firstSheet.getLastRow() < 2) {
        throw new Error('El archivo no contiene informacion util para procesar.');
      }

      var result = DepositChargeCorrelationService.replaceDatasetFromSheet(firstSheet);

      writeMonthlyLoadLog_({
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        userEmail: userContext.email,
        loadedMonths: (result && result.availableMonths) || [],
        kpis: (result && result.kpis) || {}
      });

      AuditLogger.log('DepositosCargos', tempSpreadsheetId, 'UPLOAD_PROCESS', {
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        tempSpreadsheetId: tempSpreadsheetId
      }, userContext.email);
      return result;
    } finally {
      try {
        DriveApp.getFileById(tempSpreadsheetId).setTrashed(true);
      } catch (cleanupError) {
        Logger.log('No fue posible eliminar spreadsheet temporal: ' + cleanupError.message);
      }
    }
  }

  function writeCsvFileToSheet_(file, sheetName) {
    var csv = removeUtf8Bom_(file.getBlob().getDataAsString('UTF-8'));
    var rows = Utilities.parseCsv(csv);
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    sheet.clearContents();
    if (!rows.length) return;
    for (var start = 0; start < rows.length; start += 1000) {
      var chunk = rows.slice(start, start + 1000);
      sheet.getRange(start + 1, 1, chunk.length, chunk[0].length).setValues(chunk);
    }
    sheet.setFrozenRows(1);
  }

  function getFile_(propertyKey, fallbackId, fallbackName) {
    var fileId = AppConfig.get(propertyKey, fallbackId || '');
    if (fileId) {
      try {
        return DriveApp.getFileById(fileId);
      } catch (error) {
        Logger.log('No fue posible abrir archivo por id: ' + fileId + ' / ' + error.message);
      }
    }
    if (fallbackName) {
      var files = DriveApp.getFilesByName(fallbackName);
      if (files.hasNext()) return files.next();
    }
    return null;
  }

  function uploadAsTemporarySpreadsheet_(payload) {
    var bytes = Utilities.base64Decode(payload.base64);
    var boundary = 'controltower-upload-boundary';
    var metadata = {
      name: 'TMP_' + new Date().getTime() + '_' + payload.fileName,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    };

    var body = Utilities.newBlob(
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: ' + payload.mimeType + '\r\n\r\n'
    ).getBytes()
      .concat(bytes)
      .concat(Utilities.newBlob('\r\n--' + boundary + '--').getBytes());

    var response = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'post',
      contentType: 'multipart/related; boundary=' + boundary,
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: body,
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 300) {
      throw new Error('No fue posible convertir el archivo a Google Sheets: ' + response.getContentText());
    }

    var parsed = Utils.parseJson(response.getContentText(), {});
    if (!parsed.id) throw new Error('No se recibio el id del spreadsheet temporal.');
    return parsed.id;
  }

  function isCsvPayload_(payload) {
    var fileName = String(payload.fileName || '').toLowerCase();
    var mimeType = String(payload.mimeType || '').toLowerCase();
    return fileName.slice(-4) === '.csv'
      || mimeType === 'text/csv'
      || mimeType === 'application/csv'
      || mimeType === 'text/plain';
  }

  function createTemporarySpreadsheetFromCsv_(payload) {
    var csv = removeUtf8Bom_(Utilities.newBlob(
      Utilities.base64Decode(payload.base64),
      payload.mimeType || 'text/csv',
      payload.fileName || 'upload.csv'
    ).getDataAsString('UTF-8'));
    var rows = Utilities.parseCsv(csv);
    if (!rows.length) {
      throw new Error('El archivo CSV no contiene informacion util para procesar.');
    }

    var spreadsheet = SpreadsheetApp.create('TMP_' + new Date().getTime() + '_' + payload.fileName);
    var sheet = spreadsheet.getSheets()[0];
    sheet.clearContents();
    for (var start = 0; start < rows.length; start += 2000) {
      var chunk = rows.slice(start, start + 2000);
      sheet.getRange(start + 1, 1, chunk.length, chunk[0].length).setValues(chunk);
    }
    sheet.setFrozenRows(1);
    return spreadsheet.getId();
  }

  function removeUtf8Bom_(content) {
    return String(content || '').replace(/^\uFEFF/, '');
  }

  function writeMonthlyLoadLog_(payload) {
    var headers = ['timestamp', 'fileName', 'mimeType', 'userEmail', 'availableMonths', 'totalRecords', 'uniqueClients', 'dateMin', 'dateMax'];
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_LOADS) || spreadsheet.insertSheet(APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_LOADS);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, APP_CONSTANTS.DATETIME_FORMAT),
      payload.fileName || '',
      payload.mimeType || '',
      payload.userEmail || '',
      (payload.loadedMonths || []).join(','),
      payload.kpis.total_records || 0,
      payload.kpis.unique_clients || 0,
      payload.kpis.date_min || '',
      payload.kpis.date_max || ''
    ]);
  }

  return {
    importBundleFromDrive: importBundleFromDrive,
    importFromManualSheet: importFromManualSheet,
    uploadWorkbookAndSummarize: uploadWorkbookAndSummarize
  };
})();
