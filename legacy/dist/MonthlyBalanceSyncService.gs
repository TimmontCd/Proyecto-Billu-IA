var MonthlyBalanceSyncService = (function () {
  var MASTER_CLIENTS_BIRTHDATE_COLUMN_INDEX = 6;
  var ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var STATUS_HEADERS = ['ESTATUS DE LA CUENTA', 'ESTATUS_DE_LA_CUENTA', 'ESTATUS CUENTA'];
  var OPENING_DATE_HEADERS = ['FECHA DE APERTURA CUENTA', 'FECHA_APERTURA_CUENTA', 'FECHA APERTURA CUENTA'];
  var PRODUCT_HEADERS = ['PRODUCTO DE LA CUENTA', 'PRODUCTO_DE_LA_CUENTA', 'PRODUCTO', 'PRODUCTO CUENTA'];
  var STATE_HEADERS = ['ESTADO'];
  var GENDER_HEADERS = ['GENERO', 'GÉNERO'];
  var BIRTHDATE_HEADERS = ['FECHA DE NACIMIENTO', 'FECHA DE NACIMIENTO CLIENTE', 'FECHA_NACIMIENTO', 'FECHA_NACIMIENTO_CLIENTE'];
  var AGE_HEADERS = ['EDAD', 'EDAD_ACTUAL'];
  var BALANCE_HEADERS = ['SALDO PROMEDIO HOY', 'SALDO PROMEDIO', 'SALDO PROMEDIO ACTUAL'];
  var MONTHLY_BALANCE_PREFIX = 'SALDO PROMEDIO ';
  var THREE_MONTH_AVERAGE_HEADER = 'SALDO PROMEDIO 3 MESES';
  var ACTIVE_STATUS = 'A-ACTIVA';
  var PRODUCT_DEFINITIONS = [
    { code: 'CUENTA_N2', label: 'Cuenta nivel 2' },
    { code: 'CUENTA_N4', label: 'Cuenta nivel 4' },
    { code: 'AHORRO_PROGRAMADO', label: 'Ahorro programado' },
    { code: 'INVERSION_DIARIA', label: 'Inversion diaria' },
    { code: 'TARJETA_CREDITO', label: 'Tarjeta de credito' }
  ];
  var MONTH_NAMES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  function getActivePortfolioSnapshot(referenceDate) {
    var source = openMasterClientsSource_();
    var values = source.values;
    if (!values || values.length < 2) {
      return {
        source: buildSourceMeta_(source, 0, 0),
        sourceRows: 0,
        activeClients: [],
        monthHeader: buildMonthHeader_(referenceDate || new Date())
      };
    }

    var headers = buildHeaders_(values[0], values[0].length);
    var indexMap = {
      id: resolveHeaderIndex_(headers, ID_HEADERS, 0),
      status: resolveHeaderIndex_(headers, STATUS_HEADERS, 1),
      openingDate: resolveHeaderIndex_(headers, OPENING_DATE_HEADERS, 2),
      product: resolveHeaderIndex_(headers, PRODUCT_HEADERS, 3),
      state: resolveHeaderIndex_(headers, STATE_HEADERS, 4),
      gender: resolveHeaderIndex_(headers, GENDER_HEADERS, 5),
      // Google Sheet maestro confirmado por negocio: la fecha de nacimiento correcta vive en la columna G.
      birthDate: MASTER_CLIENTS_BIRTHDATE_COLUMN_INDEX,
      age: resolveHeaderIndex_(headers, AGE_HEADERS, -1),
      balance: resolveHeaderIndex_(headers, BALANCE_HEADERS, 7)
    };
    var activeMap = {};
    var sourceRows = 0;

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (isEmptyRow_(row)) continue;
      sourceRows += 1;

      var rewardsId = normalizeLookupValue_(row[indexMap.id]);
      if (!rewardsId) continue;

      var status = normalizeStatus_(row[indexMap.status]);
      if (status !== ACTIVE_STATUS) continue;

      var productCode = resolveCanonicalProductCode_(row[indexMap.product]);
      var stateName = stringifyCell_(row[indexMap.state]);
      var gender = normalizeGender_(row[indexMap.gender]);
      var birthDate = parseFlexibleDate_(row[indexMap.birthDate]);
      var age = indexMap.age > -1 ? sanitizeAge_(row[indexMap.age]) : null;
      var openingDate = parseFlexibleDate_(row[indexMap.openingDate]);
      var balance = sanitizeNumber_(row[indexMap.balance]);

      if (!activeMap[rewardsId]) {
        activeMap[rewardsId] = {
          rewardsId: rewardsId,
          accountStatus: status,
          openingDate: openingDate,
          stateName: stateName,
          gender: gender,
          birthDate: birthDate,
          age: age,
          currentBalance: 0,
          productFlags: buildEmptyProductFlags_(),
          productBalances: buildEmptyProductBalances_(),
          productLabels: [],
          sourceRows: 0
        };
      }

      var current = activeMap[rewardsId];
      current.sourceRows += 1;
      current.currentBalance = round2_(current.currentBalance + balance);
      if (!current.openingDate || (openingDate && openingDate.getTime() < current.openingDate.getTime())) {
        current.openingDate = openingDate;
      }
      if (!current.stateName && stateName) current.stateName = stateName;
      if (!current.gender && gender) current.gender = gender;
      if (!current.birthDate && birthDate) current.birthDate = birthDate;
      if ((current.age === null || current.age === undefined) && age !== null && age !== undefined) current.age = age;
      if (productCode) {
        current.productFlags[productCode] = true;
        current.productBalances[productCode] = round2_(Number(current.productBalances[productCode] || 0) + balance);
        if (current.productLabels.indexOf(getProductLabel_(productCode)) === -1) {
          current.productLabels.push(getProductLabel_(productCode));
        }
      }
    }

    var activeClients = Object.keys(activeMap).sort().map(function (rewardsId) {
      var item = activeMap[rewardsId];
      item.productLabels.sort();
      item.productsMissing = getMissingProducts_(item.productFlags);
      item.isPortfolioActive = PRODUCT_DEFINITIONS.some(function (definition) {
        return item.productFlags[definition.code];
      });
      return item;
    }).filter(function (item) {
      return item.isPortfolioActive;
    });

    return {
      source: buildSourceMeta_(source, sourceRows, activeClients.length),
      sourceRows: sourceRows,
      activeClients: activeClients,
      monthHeader: buildMonthHeader_(referenceDate || new Date())
    };
  }

  function syncCurrentMonthBalances(referenceDate) {
    var snapshot = getActivePortfolioSnapshot(referenceDate);
    var target = openMonthlyBalanceTarget_();
    var sheet = target.sheet;
    var monthHeader = snapshot.monthHeader;
    var targetValues = target.values;
    var headers = targetValues.length ? buildHeaders_(targetValues[0], Math.max(targetValues[0].length, 1)) : ['ID RECOMPENSAS'];
    var idIndex = resolveHeaderIndex_(headers, ID_HEADERS, 0);
    var monthIndex = findHeaderIndex_(headers, monthHeader);
    var threeMonthAverageIndex = findHeaderIndex_(headers, THREE_MONTH_AVERAGE_HEADER);
    var currentWidth = Math.max(sheet.getLastColumn(), headers.length, 1);

    if (headers.length < currentWidth) {
      for (var headerFillIndex = headers.length; headerFillIndex < currentWidth; headerFillIndex += 1) {
        headers.push('COLUMN_' + (headerFillIndex + 1));
      }
    }

    if (monthIndex === -1) {
      headers.push(monthHeader);
      monthIndex = headers.length - 1;
    } else if (monthIndex >= headers.length) {
      headers[monthIndex] = monthHeader;
    } else {
      headers[monthIndex] = monthHeader;
    }

    if (threeMonthAverageIndex === -1) {
      headers.push(THREE_MONTH_AVERAGE_HEADER);
      threeMonthAverageIndex = headers.length - 1;
    } else {
      headers[threeMonthAverageIndex] = THREE_MONTH_AVERAGE_HEADER;
    }

    var width = headers.length;
    var monthColumns = getMonthColumnsFromHeaders_(headers, idIndex);
    var lastThreeMonthColumns = monthColumns.slice(-3);
    var activeById = snapshot.activeClients.reduce(function (acc, item) {
      acc[item.rewardsId] = item;
      return acc;
    }, {});
    var seen = {};
    var outputRows = [];
    var existingRows = targetValues.length > 1 ? targetValues.slice(1) : [];
    var retainedExistingRows = 0;

    existingRows.forEach(function (row) {
      if (isEmptyRow_(row)) return;
      var paddedRow = padRow_(row, width);
      var rewardsId = normalizeLookupValue_(paddedRow[idIndex]);
      if (!rewardsId || !activeById[rewardsId]) return;

      paddedRow[idIndex] = activeById[rewardsId].rewardsId;
      paddedRow[monthIndex] = activeById[rewardsId].currentBalance;
      paddedRow[threeMonthAverageIndex] = computeAverageFromRow_(paddedRow, lastThreeMonthColumns);
      outputRows.push(paddedRow);
      seen[rewardsId] = true;
      retainedExistingRows += 1;
    });

    snapshot.activeClients.forEach(function (item) {
      if (seen[item.rewardsId]) return;
      var newRow = buildEmptyRow_(width);
      newRow[idIndex] = item.rewardsId;
      newRow[monthIndex] = item.currentBalance;
      newRow[threeMonthAverageIndex] = computeAverageFromRow_(newRow, lastThreeMonthColumns);
      outputRows.push(newRow);
    });

    sheet.getRange(1, 1, 1, width).setValues([headers]);
    sheet.setFrozenRows(1);

    var writableRows = Math.max(outputRows.length, Math.max(sheet.getLastRow() - 1, 0), 1);
    sheet.getRange(2, 1, writableRows, width).clearContent();
    if (outputRows.length) {
      sheet.getRange(2, 1, outputRows.length, width).setValues(outputRows);
      sheet.getRange(2, monthIndex + 1, outputRows.length, 1).setNumberFormat('[$$-es-MX]#,##0.00');
      if (threeMonthAverageIndex > -1) {
        sheet.getRange(2, threeMonthAverageIndex + 1, outputRows.length, 1).setNumberFormat('[$$-es-MX]#,##0.00');
      }
    }

    var extraRows = sheet.getLastRow() - (outputRows.length + 1);
    if (extraRows > 0) {
      sheet.deleteRows(outputRows.length + 2, extraRows);
    }

    return {
      ok: true,
      source: snapshot.source,
      target: {
        spreadsheetId: target.spreadsheetId,
        spreadsheetName: target.spreadsheet.getName(),
        sheetName: sheet.getName()
      },
      monthHeader: monthHeader,
      averageHeader: THREE_MONTH_AVERAGE_HEADER,
      monthColumnsUsedForAverage: lastThreeMonthColumns.map(function (column) { return column.header; }),
      activeClients: snapshot.activeClients.length,
      updatedExistingRows: retainedExistingRows,
      appendedRows: outputRows.length - retainedExistingRows,
      removedRows: existingRows.filter(function (row) {
        if (isEmptyRow_(row)) return false;
        var rewardsId = normalizeLookupValue_(row[idIndex]);
        return rewardsId && !activeById[rewardsId];
      }).length,
      totalRowsWritten: outputRows.length
    };
  }

  function getMonthlyBalanceSnapshot() {
    var target = openMonthlyBalanceTarget_();
    var values = target.values;
    if (!values || !values.length) {
      return {
        source: {
          spreadsheetId: target.spreadsheetId,
          spreadsheetName: target.spreadsheet.getName(),
          sheetName: target.sheet.getName()
        },
        headers: ['ID RECOMPENSAS'],
        rowsById: {},
        monthColumns: []
      };
    }

    var headers = buildHeaders_(values[0], values[0].length);
    var idIndex = resolveHeaderIndex_(headers, ID_HEADERS, 0);
    var monthColumns = [];
    headers.forEach(function (header, index) {
      if (
        String(header || '').toUpperCase().indexOf(MONTHLY_BALANCE_PREFIX) === 0
        && normalizeHeader_(header) !== normalizeHeader_(THREE_MONTH_AVERAGE_HEADER)
        && index !== idIndex
      ) {
        monthColumns.push({ header: header, index: index });
      }
    });

    var rowsById = {};
    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (isEmptyRow_(row)) continue;
      var rewardsId = normalizeLookupValue_(row[idIndex]);
      if (!rewardsId) continue;
      rowsById[rewardsId] = padRow_(row, headers.length);
    }

    return {
      source: {
        spreadsheetId: target.spreadsheetId,
        spreadsheetName: target.spreadsheet.getName(),
        sheetName: target.sheet.getName()
      },
      headers: headers,
      idIndex: idIndex,
      rowsById: rowsById,
      monthColumns: monthColumns,
      threeMonthAverageIndex: findHeaderIndex_(headers, THREE_MONTH_AVERAGE_HEADER)
    };
  }

  function getProductDefinitions() {
    return PRODUCT_DEFINITIONS.slice();
  }

  function getProductLabel(code) {
    return getProductLabel_(code);
  }

  function resolveCampaign(productFlags) {
    var missing = getMissingProducts_(productFlags);
    if (!missing.length) return 'Fidelizacion portafolio completo';
    return 'Cross-sell ' + missing.map(function (code) {
      return getProductLabel_(code);
    }).join(' + ');
  }

  function openMasterClientsSource_() {
    var spreadsheetId = AppConfig.getSpreadsheetId();
    var sheetName = AppConfig.getMasterClientsSheetName();
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('No se encontro la pestaña "' + sheetName + '" en el spreadsheet maestro.');
    }
    return {
      spreadsheetId: spreadsheetId,
      spreadsheet: spreadsheet,
      sheet: sheet,
      values: sheet.getDataRange().getValues()
    };
  }

  function openMonthlyBalanceTarget_() {
    var spreadsheetId = AppConfig.getMonthlyBalanceSpreadsheetId();
    var sheetName = AppConfig.getMonthlyBalanceSheetName();
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    if (sheet.getLastRow() < 1) {
      sheet.getRange(1, 1).setValue('ID RECOMPENSAS');
      sheet.setFrozenRows(1);
    }
    return {
      spreadsheetId: spreadsheetId,
      spreadsheet: spreadsheet,
      sheet: sheet,
      values: sheet.getDataRange().getValues()
    };
  }

  function buildSourceMeta_(source, sourceRows, activeClients) {
    var fileUpdatedAt = '';
    try {
      fileUpdatedAt = Utils.formatDate(DriveApp.getFileById(source.spreadsheetId).getLastUpdated());
    } catch (error) {
      fileUpdatedAt = '';
    }

    return {
      spreadsheetId: source.spreadsheetId,
      spreadsheetName: source.spreadsheet.getName(),
      sheetName: source.sheet.getName(),
      sourceRows: sourceRows,
      activeClients: activeClients,
      activeStatus: ACTIVE_STATUS,
      lastUpdatedAt: fileUpdatedAt
    };
  }

  function buildHeaders_(headerRow, length) {
    return Array.from({ length: length || 0 }, function (_, index) {
      var value = stringifyCell_(headerRow[index]);
      return value || ('COLUMN_' + (index + 1));
    });
  }

  function resolveHeaderIndex_(headers, candidates, fallbackIndex) {
    var normalizedCandidates = (candidates || []).map(normalizeHeader_);
    for (var index = 0; index < headers.length; index += 1) {
      if (normalizedCandidates.indexOf(normalizeHeader_(headers[index])) > -1) return index;
    }
    return fallbackIndex;
  }

  function findHeaderIndex_(headers, header) {
    var target = normalizeHeader_(header);
    for (var index = 0; index < headers.length; index += 1) {
      if (normalizeHeader_(headers[index]) === target) return index;
    }
    return -1;
  }

  function buildMonthHeader_(date) {
    var safeDate = date instanceof Date ? date : new Date(date || new Date());
    return MONTHLY_BALANCE_PREFIX + MONTH_NAMES[safeDate.getMonth()];
  }

  function buildEmptyProductFlags_() {
    return PRODUCT_DEFINITIONS.reduce(function (acc, definition) {
      acc[definition.code] = false;
      return acc;
    }, {});
  }

  function buildEmptyProductBalances_() {
    return PRODUCT_DEFINITIONS.reduce(function (acc, definition) {
      acc[definition.code] = 0;
      return acc;
    }, {});
  }

  function getMissingProducts_(productFlags) {
    return PRODUCT_DEFINITIONS.filter(function (definition) {
      return !(productFlags && productFlags[definition.code]);
    }).map(function (definition) {
      return definition.code;
    });
  }

  function getProductLabel_(code) {
    var match = PRODUCT_DEFINITIONS.filter(function (definition) {
      return definition.code === code;
    })[0];
    return match ? match.label : (code || '');
  }

  function getMonthColumnsFromHeaders_(headers, idIndex) {
    var columns = [];
    (headers || []).forEach(function (header, index) {
      if (
        String(header || '').toUpperCase().indexOf(MONTHLY_BALANCE_PREFIX) === 0
        && normalizeHeader_(header) !== normalizeHeader_(THREE_MONTH_AVERAGE_HEADER)
        && index !== idIndex
      ) {
        columns.push({ header: header, index: index });
      }
    });
    return columns;
  }

  function computeAverageFromRow_(row, monthColumns) {
    var values = (monthColumns || []).map(function (column) {
      var raw = row[column.index];
      if (raw === '' || raw === null || raw === undefined) return null;
      return sanitizeNumber_(raw);
    }).filter(function (value) {
      return value !== null && !isNaN(value);
    });
    if (!values.length) return 0;
    return round2_(values.reduce(function (acc, value) { return acc + value; }, 0) / values.length);
  }

  function resolveCanonicalProductCode_(value) {
    var normalized = normalizeLookupValue_(value)
      .replace(/[ÚÜ]/g, 'U')
      .replace(/[Ó]/g, 'O')
      .replace(/[Í]/g, 'I')
      .replace(/[É]/g, 'E')
      .replace(/[Á]/g, 'A');
    if (!normalized) return '';
    if (normalized.indexOf('BIL4') > -1 || normalized.indexOf('NIVEL 4') > -1 || normalized.indexOf('N4') > -1 || normalized.indexOf('PREMIUM') > -1) {
      return 'CUENTA_N4';
    }
    if (normalized.indexOf('BIL2') > -1 || normalized.indexOf('NIVEL 2') > -1 || normalized.indexOf('N2') > -1) {
      return 'CUENTA_N2';
    }
    if (normalized.indexOf('AHORRO PROGRAMADO') > -1) {
      return 'AHORRO_PROGRAMADO';
    }
    if (normalized.indexOf('INVERSION DIARIA') > -1 || normalized.indexOf('INVERSION') > -1) {
      return 'INVERSION_DIARIA';
    }
    if (normalized.indexOf('TARJETA') > -1 && normalized.indexOf('CREDITO') > -1) {
      return 'TARJETA_CREDITO';
    }
    return '';
  }

  function padRow_(row, width) {
    var output = (row || []).slice(0, width);
    while (output.length < width) output.push('');
    return output;
  }

  function buildEmptyRow_(width) {
    return Array.from({ length: width }, function () { return ''; });
  }

  function normalizeHeader_(value) {
    return String(value || '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeLookupValue_(value) {
    return stringifyCell_(value).toUpperCase();
  }

  function normalizeStatus_(value) {
    return stringifyCell_(value).toUpperCase();
  }

  function normalizeGender_(value) {
    var normalized = stringifyCell_(value).toUpperCase();
    return normalized === 'M' || normalized === 'F' ? normalized : '';
  }

  function stringifyCell_(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date && !isNaN(value.getTime())) return Utils.formatDate(value, APP_CONSTANTS.DATE_FORMAT);
    return String(value).trim();
  }

  function isEmptyRow_(row) {
    return !(row || []).some(function (cell) {
      return String(cell === null || cell === undefined ? '' : cell).trim() !== '';
    });
  }

  function sanitizeNumber_(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return round2_(value);

    var normalized = String(value)
      .trim()
      .replace(/\s+/g, '')
      .replace(/\$/g, '')
      .replace(/[^0-9,\.\-]/g, '');
    if (!normalized) return 0;

    var hasComma = normalized.indexOf(',') > -1;
    var hasDot = normalized.indexOf('.') > -1;
    if (hasComma && hasDot) {
      if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
        normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
      } else {
        normalized = normalized.replace(/,/g, '');
      }
    } else if (hasComma) {
      normalized = normalized.replace(/,/g, '');
    }

    var parsed = Number(normalized);
    return round2_(isNaN(parsed) ? 0 : parsed);
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
    } else if (digits.length >= 8 && Number(digits.slice(4, 8)) > 1900) {
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

  function sanitizeAge_(value) {
    if (value === null || value === undefined || value === '') return null;
    var parsed = Number(String(value).trim().replace(/[^\d\.]/g, ''));
    if (isNaN(parsed)) return null;
    if (parsed <= 0 || parsed > 120) return null;
    return Math.round(parsed);
  }

  function round2_(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  return {
    getActivePortfolioSnapshot: getActivePortfolioSnapshot,
    syncCurrentMonthBalances: syncCurrentMonthBalances,
    getMonthlyBalanceSnapshot: getMonthlyBalanceSnapshot,
    getProductDefinitions: getProductDefinitions,
    getProductLabel: getProductLabel,
    resolveCampaign: resolveCampaign
  };
})();
