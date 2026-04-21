var CustomerTransactionSourceService = (function () {
  var DEFAULT_SHEET_NAMES = ['Transacciones de Febrero', 'Transacciones de febrero'];
  var ID_HEADERS = ['ID CLIENTE', 'CLIENTE', 'ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var DATE_HEADERS = ['FECHA PROCESO', 'FECHA', 'FECHA TRANSACCION', 'FECHA TRANSACCIÓN'];
  var ABONO_HEADERS = ['ABONO'];
  var CARGO_HEADERS = ['CARGO'];
  var AUTO_CONVERT_SUFFIX = ' [AUTO GS]';
  var XLSX_MIME_TYPES = {
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/vnd.ms-excel': true,
    'text/csv': true,
    'application/csv': true,
    'text/plain': true
  };

  function getSourceSheets() {
    var diagnostics = getDiagnostics();
    var configs = AppConfig.getCustomerTransactionSourceConfigs() || [];
    var sources = [];
    var seen = {};

    diagnostics.forEach(function (diagnostic, index) {
      if (!diagnostic || !diagnostic.ok || !diagnostic.spreadsheet) return;
      var config = configs[index] || {};
      var spreadsheet = diagnostic.spreadsheet;
      var candidates = [];
      var seenCandidates = {};
      var preferredNames = Array.isArray(config.sheetNames) && config.sheetNames.length
        ? config.sheetNames
        : DEFAULT_SHEET_NAMES;
      var preferredSheetIds = Array.isArray(config.sheetIds) && config.sheetIds.length
        ? config.sheetIds.map(function (value) { return Number(value); }).filter(function (value) { return !isNaN(value); })
        : [];

      preferredSheetIds.forEach(function (sheetId) {
        spreadsheet.getSheets().forEach(function (sheet) {
          if (!sheet || sheet.getSheetId() !== sheetId) return;
          var key = String(sheet.getSheetId());
          if (seenCandidates[key]) return;
          seenCandidates[key] = true;
          candidates.push(sheet);
        });
      });

      preferredNames.forEach(function (sheetName) {
        var sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) return;
        var key = String(sheet.getSheetId());
        if (seenCandidates[key]) return;
        seenCandidates[key] = true;
        candidates.push(sheet);
      });

      spreadsheet.getSheets().forEach(function (sheet) {
        var key = String(sheet.getSheetId());
        if (seenCandidates[key]) return;
        seenCandidates[key] = true;
        candidates.push(sheet);
      });

      for (var sheetIndex = 0; sheetIndex < candidates.length; sheetIndex += 1) {
        var candidate = candidates[sheetIndex];
        if (!candidate || candidate.getLastRow() < 2) continue;
        if (!isTransactionSheetCandidate_(candidate)) continue;

        var key = diagnostic.fileId + ':' + candidate.getSheetId();
        if (seen[key]) break;
        seen[key] = true;
        sources.push({
          spreadsheetId: diagnostic.fileId,
          spreadsheetName: spreadsheet.getName(),
          sheet: candidate,
          label: config.label || diagnostic.fileName || spreadsheet.getName(),
          displayLabel: (config.label || diagnostic.fileName || spreadsheet.getName()) + ' / ' + candidate.getName(),
          fileName: diagnostic.fileName || spreadsheet.getName(),
          fileUpdatedAt: diagnostic.fileUpdatedAt || '',
          mimeType: diagnostic.mimeType || ''
        });
        break;
      }
    });

    return sources;
  }

  function getDiagnostics() {
    var configs = AppConfig.getCustomerTransactionSourceConfigs() || [];
    return configs.map(function (config) {
      return inspectSource_(config);
    });
  }

  function inspectSource_(config) {
    if (!config) {
      return {
        ok: false,
        reason: 'Configuracion vacia.'
      };
    }

    if (config.spreadsheetId) {
      try {
        var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
        return {
          ok: true,
          spreadsheet: spreadsheet,
          fileId: config.spreadsheetId,
          fileName: spreadsheet.getName(),
          fileUpdatedAt: Utils.formatDate(DriveApp.getFileById(config.spreadsheetId).getLastUpdated()),
          mimeType: 'application/vnd.google-apps.spreadsheet',
          reason: ''
        };
      } catch (error) {
        return {
          ok: false,
          spreadsheetId: config.spreadsheetId,
          reason: 'No fue posible abrir spreadsheet por id: ' + error.message
        };
      }
    }

    if (config.driveFolderId && config.fileName) {
      var file = findDriveFile_(config.driveFolderId, config.fileName);
      if (!file) {
        return {
          ok: false,
          driveFolderId: config.driveFolderId,
          targetFileName: config.fileName,
          reason: 'No se encontro un archivo con ese nombre en la carpeta.'
        };
      }

      var mimeType = String(file.getMimeType() || '');
      if (mimeType === MimeType.GOOGLE_SHEETS || mimeType === 'application/vnd.google-apps.spreadsheet') {
        try {
          return {
            ok: true,
            spreadsheet: SpreadsheetApp.openById(file.getId()),
            fileId: file.getId(),
            fileName: file.getName(),
            fileUpdatedAt: Utils.formatDate(file.getLastUpdated()),
            mimeType: mimeType,
            reason: ''
          };
        } catch (error) {
          return {
            ok: false,
            fileId: file.getId(),
            fileName: file.getName(),
            mimeType: mimeType,
            reason: 'Se encontro el archivo, pero no se pudo abrir como Google Sheet: ' + error.message
          };
        }
      }

      if (isConvertibleSpreadsheetMimeType_(mimeType)) {
        try {
          var converted = convertDriveSpreadsheetToGoogleSheet_(file, config.driveFolderId, config.fileName);
          return {
            ok: true,
            spreadsheet: SpreadsheetApp.openById(converted.id),
            fileId: converted.id,
            fileName: converted.name,
            fileUpdatedAt: Utils.formatDate(converted.updatedAt),
            mimeType: 'application/vnd.google-apps.spreadsheet',
            reason: 'Archivo convertido automaticamente desde ' + mimeType + '.',
            sourceFileName: file.getName(),
            sourceMimeType: mimeType
          };
        } catch (error) {
          return {
            ok: false,
            fileId: file.getId(),
            fileName: file.getName(),
            mimeType: mimeType,
            reason: 'Se encontro el archivo, pero no se pudo convertir a Google Sheet: ' + error.message
          };
        }
      }

      return {
        ok: false,
        fileId: file.getId(),
        fileName: file.getName(),
        mimeType: mimeType,
        reason: 'Se encontro el archivo, pero su formato no es Google Sheet. Convierte el archivo a Google Sheet para procesarlo automaticamente.'
      };
    }

    return {
      ok: false,
      reason: 'Configuracion incompleta de la fuente transaccional.'
    };
  }

  function findDriveFile_(folderId, targetName) {
    var folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (error) {
      Logger.log('No fue posible abrir carpeta de transacciones: ' + error.message);
      return findDriveFileByApi_(folderId, targetName) || findDriveFileGlobally_(targetName);
    }

    var exactMatches = folder.getFilesByName(targetName);
    var latestExact = pickLatestFile_(exactMatches);
    if (latestExact) return latestExact;

    var files = folder.getFiles();
    var bestMatch = null;
    while (files.hasNext()) {
      var file = files.next();
      if (!matchesDriveFileName_(file.getName(), targetName)) continue;
      if (!bestMatch || file.getLastUpdated().getTime() > bestMatch.getLastUpdated().getTime()) {
        bestMatch = file;
      }
    }
    if (bestMatch) return bestMatch;
    return findDriveFileByApi_(folderId, targetName) || findDriveFileGlobally_(targetName);
  }

  function findDriveFileGlobally_(targetName) {
    try {
      var exactMatches = DriveApp.getFilesByName(targetName);
      var latestExact = pickLatestFile_(exactMatches);
      if (latestExact) return latestExact;
    } catch (error) {
      Logger.log('Busqueda global exacta por nombre fallo: ' + error.message);
    }

    try {
      var byApi = findDriveFileByApi_('', targetName);
      if (byApi) return byApi;
    } catch (error) {
      Logger.log('Busqueda global con API Drive fallo: ' + error.message);
    }

    try {
      var files = DriveApp.searchFiles('trashed = false');
      var bestMatch = null;
      while (files && files.hasNext()) {
        var file = files.next();
        if (!matchesDriveFileName_(file.getName(), targetName)) continue;
        if (!bestMatch || file.getLastUpdated().getTime() > bestMatch.getLastUpdated().getTime()) {
          bestMatch = file;
        }
      }
      return bestMatch;
    } catch (error) {
      Logger.log('Busqueda global expandida en Drive fallo: ' + error.message);
    }
    return null;
  }

  function findDriveFileByApi_(folderId, targetName) {
    var token = ScriptApp.getOAuthToken();
    var normalizedTarget = normalizeFileNameForDisplay_(targetName);
    var baseQueries = [
      "trashed = false",
      "name contains '" + escapeDriveQueryValue_(normalizedTarget) + "'"
    ];

    if (folderId) {
      baseQueries.push("'" + escapeDriveQueryValue_(folderId) + "' in parents");
    }

    var url = 'https://www.googleapis.com/drive/v3/files'
      + '?supportsAllDrives=true'
      + '&includeItemsFromAllDrives=true'
      + '&pageSize=25'
      + '&orderBy=modifiedTime desc'
      + '&fields=files(id,name,mimeType,modifiedTime,shortcutDetails)';

    var response = UrlFetchApp.fetch(url + '&q=' + encodeURIComponent(baseQueries.join(' and ')), {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + token
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 300) {
      throw new Error(response.getContentText() || ('HTTP ' + response.getResponseCode()));
    }

    var parsed = Utils.parseJson(response.getContentText(), {});
    var files = Array.isArray(parsed.files) ? parsed.files : [];
    for (var index = 0; index < files.length; index += 1) {
      var file = resolveDriveApiFileCandidate_(files[index], token);
      if (!file) continue;
      if (!matchesDriveFileName_(file.getName(), targetName)) continue;
      return file;
    }
    return null;
  }

  function resolveDriveApiFileCandidate_(item, token) {
    if (!item || !item.id) return null;
    if (item.mimeType === 'application/vnd.google-apps.shortcut' && item.shortcutDetails && item.shortcutDetails.targetId) {
      try {
        return DriveApp.getFileById(item.shortcutDetails.targetId);
      } catch (error) {
        return null;
      }
    }
    try {
      return DriveApp.getFileById(item.id);
    } catch (error) {
      return null;
    }
  }

  function pickLatestFile_(iterator) {
    var latest = null;
    try {
      while (iterator && typeof iterator.hasNext === 'function' && iterator.hasNext()) {
        var file = iterator.next();
        if (!latest || file.getLastUpdated().getTime() > latest.getLastUpdated().getTime()) {
          latest = file;
        }
      }
    } catch (error) {
      Logger.log('No fue posible iterar archivos en Drive: ' + error.message);
    }
    return latest;
  }

  function matchesDriveFileName_(candidateName, targetName) {
    var candidate = normalizeFileName_(candidateName);
    var target = normalizeFileName_(targetName);
    if (!candidate || !target) return false;
    if (candidate === target) return true;
    if (candidate.indexOf(target + ' ') === 0) return true;
    if (candidate.indexOf(target + '_') === 0) return true;
    if (candidate.indexOf(target + '-') === 0) return true;
    return false;
  }

  function normalizeFileName_(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isConvertibleSpreadsheetMimeType_(mimeType) {
    return XLSX_MIME_TYPES[String(mimeType || '').toLowerCase()] === true;
  }

  function convertDriveSpreadsheetToGoogleSheet_(file, folderId, targetName) {
    var convertedName = buildConvertedFileName_(targetName || file.getName());
    recyclePreviousConvertedFiles_(folderId, convertedName);

    var sourceBlob = file.getBlob();
    var boundary = 'billu-drive-convert-boundary';
    var metadata = {
      name: convertedName,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: folderId ? [folderId] : []
    };

    var body = Utilities.newBlob(
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: ' + (sourceBlob.getContentType() || 'application/octet-stream') + '\r\n\r\n'
    ).getBytes()
      .concat(sourceBlob.getBytes())
      .concat(Utilities.newBlob('\r\n--' + boundary + '--').getBytes());

    var response = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
      method: 'post',
      contentType: 'multipart/related; boundary=' + boundary,
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: body,
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 300) {
      throw new Error(response.getContentText() || ('HTTP ' + response.getResponseCode()));
    }

    var parsed = JSON.parse(response.getContentText() || '{}');
    if (!parsed.id) {
      throw new Error('No se recibio el id del spreadsheet convertido.');
    }

    var convertedFile = DriveApp.getFileById(parsed.id);
    return {
      id: parsed.id,
      name: convertedFile.getName(),
      updatedAt: convertedFile.getLastUpdated()
    };
  }

  function buildConvertedFileName_(name) {
    return normalizeFileNameForDisplay_(name) + AUTO_CONVERT_SUFFIX;
  }

  function normalizeFileNameForDisplay_(value) {
    return String(value || '')
      .replace(/\.[a-z0-9]+$/i, '')
      .trim();
  }

  function escapeDriveQueryValue_(value) {
    return String(value || '').replace(/'/g, "\\'");
  }

  function recyclePreviousConvertedFiles_(folderId, convertedName) {
    if (!folderId) return;
    var folder = DriveApp.getFolderById(folderId);
    var existing = folder.getFilesByName(convertedName);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }
  }

  function isTransactionSheetCandidate_(sheet) {
    if (!sheet || sheet.getLastRow() < 2) return false;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var normalized = headers.map(normalizeHeader_);
    if (hasAnyHeader_(normalized, ID_HEADERS)
      && hasAnyHeader_(normalized, DATE_HEADERS)
      && (hasAnyHeader_(normalized, ABONO_HEADERS) || hasAnyHeader_(normalized, CARGO_HEADERS))) {
      return true;
    }

    return hasTransactionFixedLayoutData_(sheet);
  }

  function hasTransactionFixedLayoutData_(sheet) {
    if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 6) return false;

    var sampleSize = Math.min(Math.max(sheet.getLastRow() - 1, 0), 25);
    if (sampleSize < 1) return false;

    var values = sheet.getRange(2, 1, sampleSize, 6).getValues();
    for (var rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex] || [];
      var rewardsId = String(row[1] === null || row[1] === undefined ? '' : row[1]).trim();
      var dateValue = row[0];
      var abonoValue = String(row[4] === null || row[4] === undefined ? '' : row[4]).trim();
      var cargoValue = String(row[5] === null || row[5] === undefined ? '' : row[5]).trim();

      if (!rewardsId) continue;
      if (!dateValue) continue;
      if (abonoValue || cargoValue) return true;
    }

    return false;
  }

  function hasAnyHeader_(headers, candidates) {
    var normalizedCandidates = candidates.map(normalizeHeader_);
    return headers.some(function (header) {
      return normalizedCandidates.indexOf(header) > -1;
    });
  }

  function normalizeHeader_(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/gi, ' ')
      .trim()
      .toUpperCase();
  }

  return {
    getSourceSheets: getSourceSheets,
    getDiagnostics: getDiagnostics
  };
})();
