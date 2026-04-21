var AccountsService = (function () {
  var ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var STATUS_HEADERS = ['ESTATUS DE LA CUENTA', 'ESTATUS_DE_LA_CUENTA', 'ESTATUS CUENTA'];
  var OPENING_DATE_HEADERS = ['FECHA DE APERTURA CUENTA', 'FECHA_APERTURA_CUENTA', 'FECHA APERTURA CUENTA'];
  var PRODUCT_HEADERS = ['PRODUCTO DE LA CUENTA', 'PRODUCTO_DE_LA_CUENTA', 'PRODUCTO', 'PRODUCTO CUENTA'];
  var STATE_HEADERS = ['ESTADO'];
  var MUNICIPALITY_HEADERS = ['MUNICIPIO'];
  var GENDER_HEADERS = ['GENERO', 'GÉNERO'];
  var BIRTHDATE_HEADERS = ['FECHA DE NACIMIENTO', 'FECHA DE NACIMIENTO CLIENTE', 'FECHA_NACIMIENTO', 'FECHA_NACIMIENTO_CLIENTE'];
  var BALANCE_HEADERS = ['SALDO PROMEDIO HOY', 'SALDO PROMEDIO', 'SALDO PROMEDIO ACTUAL'];
  var CARD_ID_COLUMN_INDEX = 0;
  var CARD_PHYSICAL_COLUMN_INDEX = 1;
  var CARD_DIGITAL_COLUMN_INDEX = 2;
  var CARD_STATUS_COLUMN_INDEX = 3;
  var TRANSACTIONS_SHEET_NAMES = ['Transacciones de Febrero', 'Transacciones de febrero'];
  var TRANSACTION_ID_COLUMN_INDEX = 1;
  var TRANSACTION_DATE_COLUMN_INDEX = 0;
  var TRANSACTION_DESCRIPTION_COLUMN_INDEX = 2;
  var TRANSACTION_DESCRIPTION_CODE_COLUMN_INDEX = 3;
  var TRANSACTION_ABONO_COLUMN_INDEX = 4;
  var TRANSACTION_CARGO_COLUMN_INDEX = 5;
  var TRANSACTION_OPERATOR_COLUMN_INDEX = 7;
  var TRANSACTION_ECOMMERCE_COLUMN_INDEX = 10;
  var TRANSACTION_PHYSICAL_COLUMN_INDEX = 11;
  var TRANSACTION_GIRO_COLUMN_INDEX = 12;
  var TRANSACTION_GIRO_DESCRIPTION_COLUMN_INDEX = 13;
  var TRANSACTION_ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var TRANSACTION_DATE_HEADERS = ['FECHA PROCESO', 'FECHA', 'FECHA TRANSACCION', 'FECHA TRANSACCIÓN'];
  var TRANSACTION_DESCRIPTION_HEADERS = ['DESCRIPCION', 'DESCRIPCIÓN'];
  var TRANSACTION_DESCRIPTION_CODE_HEADERS = ['DESCRIPCION DEL CODIGO', 'DESCRIPCIÓN DEL CODIGO', 'DESCRIPCION DEL CÓDIGO', 'DESCRIPCIÓN DEL CÓDIGO'];
  var TRANSACTION_ABONO_HEADERS = ['ABONO'];
  var TRANSACTION_CARGO_HEADERS = ['CARGO'];
  var TRANSACTION_OPERATOR_HEADERS = ['OPERADOR'];
  var TRANSACTION_ECOMMERCE_HEADERS = ['ECOMMERCE'];
  var TRANSACTION_PHYSICAL_HEADERS = ['TIENDA_FISICA', 'TIENDA FISICA', 'TIENDA_FÍSICA'];
  var TRANSACTION_GIRO_HEADERS = ['GIRO_COMERCIAL', 'GIRO COMERCIAL'];
  var TRANSACTION_GIRO_DESCRIPTION_HEADERS = ['DESCRIPCION_GIRO', 'DESCRIPCIÓN_GIRO', 'DESCRIPCION DEL GIRO', 'DESCRIPCIÓN DEL GIRO'];
  var CARD_ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var CARD_RECENT_PHYSICAL_HEADERS = ['TD_RECIENTE_FISICA', 'TD RECIENTE FISICA', 'TD_RECIENTE_FÍSICA'];
  var CARD_RECENT_DIGITAL_HEADERS = ['TD_RECIENTE_DIGITAL', 'TD RECIENTE DIGITAL'];
  var CARD_PHYSICAL_HEADERS = ['TARJETA FISICA', 'TARJETA FÍSICA'];
  var CARD_DIGITAL_HEADERS = ['TARJETA DIGITAL'];
  var CARD_STATUS_HEADERS = ['ESTATUS DE LA TARJETA', 'ESTATUS TARJETA'];
  var SAVINGS_GOALS_SHEET_NAME = 'Metas de Ahorro';
  var SAVINGS_GOALS_ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var SAVINGS_GOALS_BALANCE_HEADERS = ['SALDO ACTUAL', 'SALDO'];
  var SAVINGS_GOALS_OPEN_DATE_HEADERS = ['FECHA APERTURA INVERSION', 'FECHA APERTURA INVERSIÓN', 'FECHA APERTURA'];
  var SAVINGS_GOALS_STATUS_HEADERS = ['ESTATUS', 'ESTADO'];
  var CREDIT_CARD_SHEET_NAME = 'TDC';
  var CREDIT_CARD_ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var CREDIT_CARD_ACCOUNT_STATUS_HEADERS = ['ESTATUS CUENTA BILLÚ', 'ESTATUS CUENTA BILLU', 'ESTATUS CUENTA'];
  var CREDIT_CARD_PRODUCT_HEADERS = ['PRODUCTO TDC', 'PRODUCTO'];
  var CREDIT_CARD_STATUS_HEADERS = ['ESTATUS TDC', 'ESTATUS'];
  var PRODUCT_DEFINITIONS = [
    { code: 'CUENTA_N2', label: 'Cuenta Billú N2' },
    { code: 'CUENTA_N4', label: 'Cuenta Billú Premium N4' },
    { code: 'AHORRO_PROGRAMADO', label: 'Ahorro programado' },
    { code: 'INVERSION_DIARIA', label: 'Inversión diaria' },
    { code: 'TARJETA_CREDITO', label: 'Tarjeta de crédito' }
  ];
  var PRODUCT_ALLOWED_STATUSES = ['A-ACTIVA'];
  var FIRST30_START_DATE = new Date(2026, 0, 1);
  var FIRST30_MIN_CARGOS = 3;
  var FIRST30_MIN_ABONOS = 1;

  function getDashboard() {
    var prepared = getPreparedRows_();
    var source = prepared.source;
    var clientRows = prepared.rows;

    var totalAccounts = clientRows.length;
    var totalBalance = sumBalance_(clientRows);
    var statusSummary = buildStatusSummary_(clientRows, totalAccounts);
    var productUniverseRows = clientRows.filter(isAllowedProductStatus_);
    var cardSummary = null;
    try {
      cardSummary = buildCardSummary_(clientRows);
    } catch (error) {
      cardSummary = {
        error: error && error.message ? error.message : 'No fue posible cargar el resumen de tarjetas.'
      };
    }
    var productSummary = buildProductSummary_(clientRows, clientRows);
    var topStates = buildTopStates_(clientRows);
    var activeAccounts = clientRows.filter(function (item) { return normalizeStatus_(item.accountStatus) === 'A-ACTIVA'; }).length;
    var inactiveAccounts = clientRows.filter(function (item) { return normalizeStatus_(item.accountStatus) === 'I-INACTIVA'; }).length;
    var topProduct = productSummary.slice().sort(function (a, b) { return b.accounts - a.accounts; })[0] || null;

    return {
      ready: true,
      source: buildSourceMeta_(source, totalAccounts, productUniverseRows.length),
      kpis: {
        total_accounts: totalAccounts,
        total_balance: round2_(totalBalance),
        active_accounts: activeAccounts,
        inactive_accounts: inactiveAccounts,
        billu_n2_accounts: findProductAccounts_(productSummary, 'CUENTA_N2'),
        billu_premium_n4_accounts: findProductAccounts_(productSummary, 'CUENTA_N4'),
        ahorro_programado_accounts: findProductAccounts_(productSummary, 'AHORRO_PROGRAMADO'),
        inversion_diaria_accounts: findProductAccounts_(productSummary, 'INVERSION_DIARIA'),
        tarjeta_credito_accounts: findProductAccounts_(productSummary, 'TARJETA_CREDITO')
      },
      executiveSummary: buildExecutiveSummary_(totalAccounts, totalBalance, topProduct, productUniverseRows.length),
      cardSummary: cardSummary,
      productSummary: productSummary,
      topStates: topStates,
      consumptionSummary: buildConsumptionSummary_(clientRows)
    };
  }

  function getHistorical(payload) {
    var prepared = getPreparedRows_();
    var source = prepared.source;
    var rows = prepared.rows;
    var historicalRows = rows.filter(function (item) { return item.openingDate !== null; });
    if (!historicalRows.length) {
      throw new Error('No hay fechas validas de apertura en la columna C para construir el histórico.');
    }

    var normalizedFilters = normalizeHistoricalFilters_(historicalRows, payload || {});
    var trendRows = filterRowsByDateRange_(historicalRows, normalizedFilters.startDate, normalizedFilters.endDate);
    var monthRows = filterRowsByYearMonth_(historicalRows, normalizedFilters.selectedYear, normalizedFilters.selectedMonth);
    var transactionMap = readTransactionsByRewardsId_();
    var availableMonths = buildAvailableMonths_(historicalRows, normalizedFilters.selectedYear);
    var trendSeries = buildTrendSeries_(trendRows, normalizedFilters.startDate, normalizedFilters.endDate);
    var monthStatusSummary = buildStatusSummary_(monthRows, monthRows.length);
    var activeMonthAccounts = monthRows.filter(function (item) { return normalizeStatus_(item.accountStatus) === 'A-ACTIVA'; }).length;
    var inactiveMonthAccounts = monthRows.filter(function (item) { return normalizeStatus_(item.accountStatus) === 'I-INACTIVA'; }).length;
    var cancelledMonthAccounts = monthRows.filter(function (item) { return isCancelledStatus_(item.accountStatus); }).length;
    var topMonthStatus = monthStatusSummary[0] || null;

    return {
      ready: true,
      source: buildSourceMeta_(source, rows.length, rows.filter(isAllowedProductStatus_).length),
      filters: {
        startDate: formatDateOnly_(normalizedFilters.startDate),
        endDate: formatDateOnly_(normalizedFilters.endDate),
        selectedYear: normalizedFilters.selectedYear,
        selectedMonth: normalizedFilters.selectedMonth,
        selectedMonthLabel: buildMonthLabel_(normalizedFilters.selectedYear, normalizedFilters.selectedMonth)
      },
      availablePeriods: buildAvailablePeriods_(historicalRows),
      trend: {
        series: trendSeries,
        totalAccounts: trendRows.length,
        minDate: historicalRows.length ? formatDateOnly_(historicalRows[0].openingDate) : '',
        maxDate: historicalRows.length ? formatDateOnly_(historicalRows[historicalRows.length - 1].openingDate) : '',
        averagePerDay: round2_(trendSeries.length ? trendRows.length / trendSeries.length : 0),
        peak: findTrendPeak_(trendSeries)
      },
      monthlySummary: {
        year: normalizedFilters.selectedYear,
        month: normalizedFilters.selectedMonth,
        monthLabel: buildMonthLabel_(normalizedFilters.selectedYear, normalizedFilters.selectedMonth),
        totalAccounts: monthRows.length,
        activeAccounts: activeMonthAccounts,
        inactiveAccounts: inactiveMonthAccounts,
        cancelledAccounts: cancelledMonthAccounts,
        activeSharePct: round2_(monthRows.length ? (activeMonthAccounts / monthRows.length) * 100 : 0),
        inactiveSharePct: round2_(monthRows.length ? (inactiveMonthAccounts / monthRows.length) * 100 : 0),
        cancelledSharePct: round2_(monthRows.length ? (cancelledMonthAccounts / monthRows.length) * 100 : 0),
        topStatus: topMonthStatus,
        executiveSummary: buildMonthlyExecutiveSummary_(monthRows.length, activeMonthAccounts, inactiveMonthAccounts, cancelledMonthAccounts, topMonthStatus, normalizedFilters.selectedYear, normalizedFilters.selectedMonth),
        statusSummary: monthStatusSummary
      },
      monthlyOpeningSummary: buildMonthlyOpeningSummary_(historicalRows, transactionMap)
    };
  }

  function getFirst30Summary() {
    var prepared = getPreparedRows_();
    var source = prepared.source;
    var rows = prepared.rows;
    var transactionData = readTransactionTimelineByRewardsId_();
    var referenceDate = transactionData.referenceDate || stripTime_(new Date());
    var cohortRows = rows.filter(function (item) {
      return item.openingDate
        && item.openingDate.getTime() >= stripTime_(FIRST30_START_DATE).getTime()
        && item.openingDate.getTime() <= referenceDate.getTime();
    }).map(function (item) {
      return buildFirst30CohortRow_(item, transactionData.map[normalizeLookupValue_(item.rewardsId)] || []);
    }).sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return String(a.rewardsId || '').localeCompare(String(b.rewardsId || ''));
    });

    return {
      ready: true,
      source: buildSourceMeta_(source, rows.length, rows.filter(isAllowedProductStatus_).length),
      referenceDate: formatDateOnly_(referenceDate),
      rangeLabel: 'Enero 2026 a ' + formatDateOnly_(referenceDate),
      totalSummary: buildFirst30TotalSummary_(cohortRows),
      monthlySummary: buildFirst30MonthlySummary_(cohortRows)
    };
  }

  function exportFirst30Month(payload) {
    payload = payload || {};
    Utils.requireFields(payload, ['selectedYear', 'selectedMonth']);

    var prepared = getPreparedRows_();
    var transactionData = readTransactionTimelineByRewardsId_();
    var referenceDate = transactionData.referenceDate || stripTime_(new Date());
    var rows = prepared.rows.filter(function (item) {
      return item.openingDate
        && item.openingDate.getFullYear() === Number(payload.selectedYear)
        && (item.openingDate.getMonth() + 1) === Number(payload.selectedMonth)
        && item.openingDate.getTime() >= stripTime_(FIRST30_START_DATE).getTime()
        && item.openingDate.getTime() <= referenceDate.getTime();
    }).map(function (item) {
      return buildFirst30CohortRow_(item, transactionData.map[normalizeLookupValue_(item.rewardsId)] || []);
    });

    if (!rows.length) {
      throw new Error('No hay cuentas aperturadas en el mes seleccionado para descargar.');
    }

    return {
      year: Number(payload.selectedYear),
      month: Number(payload.selectedMonth),
      rowCount: rows.length,
      fileName: buildFirst30MonthFileName_(payload.selectedYear, payload.selectedMonth),
      csvContent: buildCsvFromObjects_(rows.map(buildFirst30ExportRow_))
    };
  }

  function exportHistoricalMonth(payload) {
    payload = payload || {};
    Utils.requireFields(payload, ['selectedYear', 'selectedMonth']);

    var prepared = getPreparedRows_();
    var rows = filterRowsByYearMonth_(prepared.rows.filter(function (item) { return item.openingDate !== null; }), payload.selectedYear, payload.selectedMonth);
    if (!rows.length) {
      throw new Error('No hay cuentas aperturadas en el mes seleccionado para descargar.');
    }

    return {
      year: Number(payload.selectedYear),
      month: Number(payload.selectedMonth),
      rowCount: rows.length,
      fileName: buildHistoricalMonthFileName_(payload.selectedYear, payload.selectedMonth),
      csvContent: buildCsvFromObjects_(rows.map(buildHistoricalExportRow_))
    };
  }

  function exportCardCoverage() {
    var prepared = getPreparedRows_();
    var coverageRows = buildActiveCardCoverageRows_(prepared.rows);
    if (!coverageRows.length) {
      throw new Error('No hay clientes activos para descargar en la base de tarjetas.');
    }

    return {
      rowCount: coverageRows.length,
      fileName: 'clientes_tarjetas_cobertura.csv',
      csvContent: buildCsvFromObjects_(coverageRows.map(buildCardCoverageExportRow_))
    };
  }

  function openSource_() {
    var spreadsheetId = AppConfig.getSpreadsheetId();
    var sheetName = AppConfig.getMasterClientsSheetName();
    var spreadsheet;
    var sheet;

    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      throw new Error('No fue posible abrir el spreadsheet maestro de cuentas.');
    }

    sheet = spreadsheet.getSheetByName(sheetName);
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

  function getPreparedRows_() {
    var source = openSource_();
    var values = source.values;
    if (!values || values.length < 2) {
      throw new Error('La fuente de cuentas no contiene filas para procesar.');
    }

    var headers = buildHeaders_(values[0], values[0].length);
    var idIndex = resolveHeaderIndex_(headers, ID_HEADERS, 0);
    var statusIndex = resolveHeaderIndex_(headers, STATUS_HEADERS, 1);
    var openingDateIndex = resolveHeaderIndex_(headers, OPENING_DATE_HEADERS, 2);
    var productIndex = resolveHeaderIndex_(headers, PRODUCT_HEADERS, 3);
    var stateIndex = resolveHeaderIndex_(headers, STATE_HEADERS, 4);
    var municipalityIndex = resolveHeaderIndex_(headers, MUNICIPALITY_HEADERS, -1);
    var genderIndex = resolveHeaderIndex_(headers, GENDER_HEADERS, 5);
    var birthDateIndex = resolveHeaderIndex_(headers, BIRTHDATE_HEADERS, 6);
    var balanceIndex = resolveHeaderIndex_(headers, BALANCE_HEADERS, 7);
    var rows = [];
    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (isEmptyRow_(row)) continue;
      rows.push({
        rewardsId: stringifyCell_(row[idIndex]),
        accountStatus: stringifyCell_(row[statusIndex]) || 'SIN ESTATUS',
        openingDate: parseOpeningDate_(row[openingDateIndex]),
        productCode: normalizeCode_(row[productIndex]) || 'SIN PRODUCTO',
        productLabel: resolveProductLabel_(row[productIndex]),
        stateName: stringifyCell_(row[stateIndex]) || 'SIN ESTADO',
        municipalityName: municipalityIndex > -1 ? stringifyCell_(row[municipalityIndex]) : '',
        gender: normalizeGender_(row[genderIndex]),
        age: calculateAge_(row[birthDateIndex]),
        balance: sanitizeBalance_(row[balanceIndex]),
        exportRow: buildRowObject_(headers, row)
      });
    }

    rows.sort(function (a, b) {
      var timeA = a.openingDate ? a.openingDate.getTime() : 0;
      var timeB = b.openingDate ? b.openingDate.getTime() : 0;
      return timeA - timeB;
    });

    return {
      source: source,
      rows: rows
    };
  }

  function buildSourceMeta_(source, totalRows, productUniverseRows) {
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
      totalRows: totalRows,
      productUniverseRows: productUniverseRows,
      productUniverseStatuses: PRODUCT_ALLOWED_STATUSES.join(', '),
      lastUpdatedAt: fileUpdatedAt
    };
  }

  function buildStatusSummary_(rows, totalAccounts) {
    var grouped = Utils.groupBy(rows, function (item) {
      return item.accountStatus || 'SIN ESTATUS';
    });

    return Object.keys(grouped).map(function (status) {
      var statusRows = grouped[status] || [];
      var totalBalance = sumBalance_(statusRows);
      return {
        status: status,
        accounts: statusRows.length,
        sharePct: round2_(totalAccounts ? (statusRows.length / totalAccounts) * 100 : 0),
        totalBalance: round2_(totalBalance),
        averageBalance: round2_(statusRows.length ? totalBalance / statusRows.length : 0)
      };
    }).sort(function (a, b) {
      if (b.accounts !== a.accounts) return b.accounts - a.accounts;
      return String(a.status).localeCompare(String(b.status));
    });
  }

  function buildMonthlyOpeningSummary_(rows, transactionMap) {
    var groups = {};
    rows.forEach(function (item) {
      if (!item.openingDate) return;
      var year = item.openingDate.getFullYear();
      var month = item.openingDate.getMonth() + 1;
      var key = year + '-' + (month < 10 ? '0' + month : String(month));
      if (!groups[key]) {
        groups[key] = {
          year: year,
          month: month,
          monthLabel: buildMonthLabel_(year, month),
          rows: []
        };
      }
      groups[key].rows.push(item);
    });

    return Object.keys(groups).map(function (key) {
      var group = groups[key];
      var cohortRows = group.rows || [];
      var activeRows = cohortRows.filter(function (item) { return normalizeStatus_(item.accountStatus) === 'A-ACTIVA'; });
      var activeAccounts = activeRows.length;
      var cancelledAccounts = cohortRows.filter(function (item) { return isCancelledStatus_(item.accountStatus); }).length;
      var transactionalAccounts = activeRows.filter(function (item) {
        var tx = transactionMap[normalizeLookupValue_(item.rewardsId)] || null;
        return !!(tx && tx.hasRecentActivity30d);
      }).length;
      var totalBalance = sumBalance_(cohortRows);

      return {
        year: group.year,
        month: group.month,
        monthLabel: group.monthLabel,
        monthName: buildMonthName_(group.month),
        openingAccounts: cohortRows.length,
        activeAccounts: activeAccounts,
        activePct: round2_(cohortRows.length ? (activeAccounts / cohortRows.length) * 100 : 0),
        cancelledAccounts: cancelledAccounts,
        cancelledPct: round2_(cohortRows.length ? (cancelledAccounts / cohortRows.length) * 100 : 0),
        transactionalAccounts: transactionalAccounts,
        transactionalPct: round2_(activeAccounts ? (transactionalAccounts / activeAccounts) * 100 : 0),
        totalBalance: round2_(totalBalance)
      };
    }).sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  function buildProductSummary_(clientRows, balanceRows) {
    var totalActiveAccounts = (clientRows || []).filter(isAllowedProductStatus_).length;
    var groupedClients = Utils.groupBy(clientRows || [], function (item) {
      return item.productCode || 'SIN PRODUCTO';
    });
    var groupedBalances = Utils.groupBy(balanceRows || [], function (item) {
      return item.productCode || 'SIN PRODUCTO';
    });
    var activeClientProfiles = buildActiveClientProfileByRewardsId_(clientRows || []);
    var savingsGoalsSnapshot = readSavingsGoalsByRewardsId_(activeClientProfiles);
    var creditCardSnapshot = readCreditCardByRewardsId_(activeClientProfiles);

    return PRODUCT_DEFINITIONS.map(function (definition) {
      if (definition.code === 'AHORRO_PROGRAMADO' && savingsGoalsSnapshot.rows.length) {
        return buildExternalProductSummary_(definition, savingsGoalsSnapshot.rows, totalActiveAccounts, 5);
      }
      if (definition.code === 'TARJETA_CREDITO' && creditCardSnapshot.rows.length) {
        return buildExternalProductSummary_(definition, creditCardSnapshot.rows, totalActiveAccounts, 5);
      }

      var productClientRows = groupedClients[definition.code] || [];
      var activeProductRows = productClientRows.filter(isAllowedProductStatus_);
      var productBalanceRows = groupedBalances[definition.code] || [];
      var totalBalance = sumBalance_(productBalanceRows);
      var maleClients = activeProductRows.filter(function (item) { return item.gender === 'M'; }).length;
      var femaleClients = activeProductRows.filter(function (item) { return item.gender === 'F'; }).length;
      var validAgeRows = activeProductRows.filter(function (item) { return item.age !== null; });
      var ageSum = validAgeRows.reduce(function (acc, item) {
        return acc + Number(item.age || 0);
      }, 0);
      var modeAge = calculateModeAgeFromRows_(validAgeRows);

      return {
        productCode: definition.code,
        productLabel: definition.label,
        accounts: activeProductRows.length,
        sharePct: round2_(totalActiveAccounts ? (activeProductRows.length / totalActiveAccounts) * 100 : 0),
        totalBalance: round2_(totalBalance),
        averageBalance: round2_(productBalanceRows.length ? totalBalance / productBalanceRows.length : 0),
        maleClients: maleClients,
        femaleClients: femaleClients,
        malePct: round2_(activeProductRows.length ? (maleClients / activeProductRows.length) * 100 : 0),
        femalePct: round2_(activeProductRows.length ? (femaleClients / activeProductRows.length) * 100 : 0),
        validAgeClients: validAgeRows.length,
        averageAge: round2_(validAgeRows.length ? ageSum / validAgeRows.length : 0),
        modeAge: modeAge,
        topStates: buildProductStateRows_(productBalanceRows, activeProductRows, 5)
      };
    });
  }

  function buildActiveClientProfileByRewardsId_(rows) {
    var map = {};

    (rows || []).forEach(function (item) {
      if (!isAllowedProductStatus_(item)) return;
      var rewardsId = normalizeLookupValue_(item.rewardsId);
      if (!rewardsId) return;

      if (!map[rewardsId]) {
        map[rewardsId] = {
          rewardsId: rewardsId,
          stateName: item.stateName || '',
          municipalityName: item.municipalityName || '',
          gender: item.gender || '',
          age: item.age,
          openingDate: item.openingDate || null
        };
        return;
      }

      if (!map[rewardsId].stateName && item.stateName) map[rewardsId].stateName = item.stateName;
      if (!map[rewardsId].municipalityName && item.municipalityName) map[rewardsId].municipalityName = item.municipalityName;
      if (!map[rewardsId].gender && item.gender) map[rewardsId].gender = item.gender;
      if ((map[rewardsId].age === null || map[rewardsId].age === undefined) && item.age !== null && item.age !== undefined) {
        map[rewardsId].age = item.age;
      }
      if (!map[rewardsId].openingDate && item.openingDate) map[rewardsId].openingDate = item.openingDate;
    });

    return map;
  }

  function buildClientProfileByRewardsId_(rows) {
    var map = {};

    (rows || []).forEach(function (item) {
      var rewardsId = normalizeLookupValue_(item.rewardsId);
      if (!rewardsId) return;

      if (!map[rewardsId]) {
        map[rewardsId] = {
          rewardsId: rewardsId,
          stateName: item.stateName || '',
          municipalityName: item.municipalityName || '',
          gender: item.gender || '',
          age: item.age,
          openingDate: item.openingDate || null,
          balance: Number(item.balance || 0),
          accountStatus: item.accountStatus || ''
        };
        return;
      }

      if (normalizeStatus_(item.accountStatus) === 'A-ACTIVA') {
        map[rewardsId].accountStatus = item.accountStatus || map[rewardsId].accountStatus;
      }
      if (!map[rewardsId].stateName && item.stateName) map[rewardsId].stateName = item.stateName;
      if (!map[rewardsId].municipalityName && item.municipalityName) map[rewardsId].municipalityName = item.municipalityName;
      if (!map[rewardsId].gender && item.gender) map[rewardsId].gender = item.gender;
      if ((map[rewardsId].age === null || map[rewardsId].age === undefined) && item.age !== null && item.age !== undefined) {
        map[rewardsId].age = item.age;
      }
      if (!map[rewardsId].openingDate && item.openingDate) map[rewardsId].openingDate = item.openingDate;
      if (Number(map[rewardsId].balance || 0) < Number(item.balance || 0)) map[rewardsId].balance = Number(item.balance || 0);
    });

    return map;
  }

  function buildConsumptionSummary_(rows) {
    var profileMap = buildClientProfileByRewardsId_(rows || []);
    var transactionSources = loadTransactionValueSources_();
    var merchantRules = loadMerchantHomologationRules_();
    var stats = createConsumptionStatsAccumulator_();
    var monthlyStatsByKey = {};
    var quarterlyStatsByKey = {};

    transactionSources.forEach(function (source) {
      var values = source && source.values ? source.values : [];
      if (!values || values.length < 2) return;

      var headers = buildHeaders_(values[0], values[0].length);
      var idIndex = resolveHeaderIndex_(headers, TRANSACTION_ID_HEADERS, TRANSACTION_ID_COLUMN_INDEX);
      var dateIndex = resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, TRANSACTION_DATE_COLUMN_INDEX);
      var cargoIndex = resolveHeaderIndex_(headers, TRANSACTION_CARGO_HEADERS, TRANSACTION_CARGO_COLUMN_INDEX);
      var operatorIndex = resolveHeaderIndex_(headers, TRANSACTION_OPERATOR_HEADERS, TRANSACTION_OPERATOR_COLUMN_INDEX);
      var descriptionIndex = resolveHeaderIndex_(headers, TRANSACTION_DESCRIPTION_HEADERS, TRANSACTION_DESCRIPTION_COLUMN_INDEX);
      var descriptionCodeIndex = resolveHeaderIndex_(headers, TRANSACTION_DESCRIPTION_CODE_HEADERS, TRANSACTION_DESCRIPTION_CODE_COLUMN_INDEX);
      var ecommerceIndex = resolveHeaderIndex_(headers, TRANSACTION_ECOMMERCE_HEADERS, TRANSACTION_ECOMMERCE_COLUMN_INDEX);
      var physicalIndex = resolveHeaderIndex_(headers, TRANSACTION_PHYSICAL_HEADERS, TRANSACTION_PHYSICAL_COLUMN_INDEX);
      var giroIndex = resolveHeaderIndex_(headers, TRANSACTION_GIRO_HEADERS, TRANSACTION_GIRO_COLUMN_INDEX);
      var giroDescriptionIndex = resolveHeaderIndex_(headers, TRANSACTION_GIRO_DESCRIPTION_HEADERS, TRANSACTION_GIRO_DESCRIPTION_COLUMN_INDEX);

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var rewardsId = normalizeLookupValue_(row[idIndex]);
        if (!rewardsId) continue;

        var cargo = sanitizeBalance_(row[cargoIndex]);
        if (cargo <= 0) continue;
        if (normalizeLookupValue_(row[operatorIndex]) !== 'COMPRAS') continue;

        var merchantName = normalizeConsumptionLabel_(row[descriptionIndex], 'Comercio no identificado');
        var merchantMatch = resolveMerchantHomologation_(merchantName, merchantRules);
        var merchantKey = merchantMatch.key;
        var merchantLabel = merchantMatch.label;
        var descriptionCode = normalizeConsumptionLabel_(row[descriptionCodeIndex], '');
        var giroName = normalizeConsumptionLabel_(row[giroIndex], '');
        var giroDescription = normalizeConsumptionLabel_(row[giroDescriptionIndex], '');
        var categoryName = giroDescription || giroName || descriptionCode || 'Sin categoría comercial';
        var channel = resolveConsumptionChannel_(row[ecommerceIndex], row[physicalIndex]);
        var profile = profileMap[rewardsId] || {};
        var transactionDate = parseDateValue_(row[dateIndex]) || parseOpeningDate_(row[dateIndex]);
        ingestConsumptionEvent_(stats, {
          rewardsId: rewardsId,
          cargo: cargo,
          categoryName: categoryName,
          giroName: giroName,
          merchantKey: merchantKey,
          merchantLabel: merchantLabel,
          channel: channel,
          transactionDate: transactionDate
        }, profile);

        if (transactionDate) {
          var monthKey = buildConsumptionMonthKey_(transactionDate);
          if (!monthlyStatsByKey[monthKey]) monthlyStatsByKey[monthKey] = createConsumptionStatsAccumulator_();
          ingestConsumptionEvent_(monthlyStatsByKey[monthKey], {
            rewardsId: rewardsId,
            cargo: cargo,
            categoryName: categoryName,
            giroName: giroName,
            merchantKey: merchantKey,
            merchantLabel: merchantLabel,
            channel: channel,
            transactionDate: transactionDate
          }, profile);

          var quarterKey = buildConsumptionQuarterKey_(transactionDate);
          if (!quarterlyStatsByKey[quarterKey]) quarterlyStatsByKey[quarterKey] = createConsumptionStatsAccumulator_();
          ingestConsumptionEvent_(quarterlyStatsByKey[quarterKey], {
            rewardsId: rewardsId,
            cargo: cargo,
            categoryName: categoryName,
            giroName: giroName,
            merchantKey: merchantKey,
            merchantLabel: merchantLabel,
            channel: channel,
            transactionDate: transactionDate
          }, profile);
        }
      }
    });

    var summary = finalizeConsumptionStats_(stats);
    var monthKeys = Object.keys(monthlyStatsByKey || {}).sort(sortPeriodKeysDesc_);
    var quarterKeys = Object.keys(quarterlyStatsByKey || {}).sort(sortPeriodKeysDesc_);
    var monthSnapshots = {};
    var quarterSnapshots = {};

    monthKeys.forEach(function (key) {
      var monthSummary = finalizeConsumptionStats_(monthlyStatsByKey[key]);
      monthSummary.periodKey = key;
      monthSummary.periodMode = 'month';
      monthSummary.periodLabel = buildConsumptionMonthLabelFromKey_(key);
      monthSnapshots[key] = monthSummary;
    });

    quarterKeys.forEach(function (key) {
      var quarterSummary = finalizeConsumptionStats_(quarterlyStatsByKey[key]);
      quarterSummary.periodKey = key;
      quarterSummary.periodMode = 'quarter';
      quarterSummary.periodLabel = buildConsumptionQuarterLabelFromKey_(key);
      quarterSnapshots[key] = quarterSummary;
    });

    summary.periodOptions = {
      months: monthKeys.map(function (key) {
        return { value: key, label: buildConsumptionMonthLabelFromKey_(key) };
      }),
      quarters: quarterKeys.map(function (key) {
        return { value: key, label: buildConsumptionQuarterLabelFromKey_(key) };
      })
    };
    summary.periodSnapshots = {
      month: monthSnapshots,
      quarter: quarterSnapshots
    };
    return summary;
  }

  function createConsumptionStatsAccumulator_() {
    return {
      totalSpend: 0,
      transactionCount: 0,
      buyersById: {},
      categoryMap: {},
      giroMap: {},
      merchantSpendMap: {},
      merchantTxMap: {},
      stateMap: {},
      clientMap: {},
      ecommerceCount: 0,
      physicalCount: 0,
      minDate: null,
      maxDate: null
    };
  }

  function ingestConsumptionEvent_(stats, event, profile) {
    if (!stats || !event) return;

    var rewardsId = event.rewardsId || '';
    var cargo = Number(event.cargo || 0);
    var categoryName = event.categoryName || 'Sin categoría comercial';
    var giroName = event.giroName || '';
    var merchantKey = event.merchantKey || 'COMERCIO NO IDENTIFICADO';
    var merchantLabel = event.merchantLabel || merchantKey;
    var channel = event.channel || '';
    var transactionDate = event.transactionDate || null;
    var stateName = normalizeConsumptionLabel_(profile && profile.stateName, 'Sin estado');

    stats.totalSpend += cargo;
    stats.transactionCount += 1;
    stats.buyersById[rewardsId] = true;
    if (channel === 'ECOMMERCE') stats.ecommerceCount += 1;
    if (channel === 'FISICA') stats.physicalCount += 1;

    if (transactionDate) {
      if (!stats.minDate || transactionDate.getTime() < stats.minDate.getTime()) stats.minDate = transactionDate;
      if (!stats.maxDate || transactionDate.getTime() > stats.maxDate.getTime()) stats.maxDate = transactionDate;
    }

    aggregateConsumptionMetric_(stats.categoryMap, categoryName, cargo);
    if (giroName) aggregateConsumptionMetric_(stats.giroMap, giroName, cargo);
    aggregateConsumptionMetric_(stats.merchantSpendMap, merchantKey, cargo, merchantLabel);
    aggregateConsumptionMetric_(stats.merchantTxMap, merchantKey, 1, merchantLabel);
    aggregateConsumptionMetric_(stats.stateMap, stateName, cargo);

    if (!stats.clientMap[rewardsId]) {
      stats.clientMap[rewardsId] = {
        rewardsId: rewardsId,
        spend: 0,
        transactions: 0,
        ecommerceCount: 0,
        physicalCount: 0,
        topCategories: {},
        topMerchants: {},
        stateName: profile && profile.stateName ? profile.stateName : 'Sin estado',
        gender: profile && profile.gender ? profile.gender : '',
        age: profile && profile.age !== undefined ? profile.age : null
      };
    }

    stats.clientMap[rewardsId].spend += cargo;
    stats.clientMap[rewardsId].transactions += 1;
    if (channel === 'ECOMMERCE') stats.clientMap[rewardsId].ecommerceCount += 1;
    if (channel === 'FISICA') stats.clientMap[rewardsId].physicalCount += 1;
    aggregateConsumptionMetric_(stats.clientMap[rewardsId].topCategories, categoryName, cargo);
    aggregateConsumptionMetric_(stats.clientMap[rewardsId].topMerchants, merchantKey, cargo, merchantLabel);
  }

  function finalizeConsumptionStats_(stats) {
    var buyerCount = Object.keys(stats && stats.buyersById || {}).length;
    var topCategories = sortConsumptionMap_(stats && stats.categoryMap || {}).slice(0, 12);
    var topGiros = sortConsumptionMap_(stats && stats.giroMap || {}).slice(0, 12);
    var topMerchantsBySpend = sortConsumptionMap_(stats && stats.merchantSpendMap || {}).slice(0, 50);
    var topMerchantsByTransactions = sortConsumptionMap_(stats && stats.merchantTxMap || {}).slice(0, 50);
    var topStates = sortConsumptionMap_(stats && stats.stateMap || {}).slice(0, 5);
    var transactionCount = Number(stats && stats.transactionCount || 0);
    var ecommerceCount = Number(stats && stats.ecommerceCount || 0);
    var physicalCount = Number(stats && stats.physicalCount || 0);
    var totalSpend = Number(stats && stats.totalSpend || 0);

    return {
      ready: true,
      totalSpend: round2_(totalSpend),
      transactionCount: transactionCount,
      buyerCount: buyerCount,
      averageTicket: round2_(transactionCount ? totalSpend / transactionCount : 0),
      averageSpendPerBuyer: round2_(buyerCount ? totalSpend / buyerCount : 0),
      averageTransactionsPerBuyer: round2_(buyerCount ? transactionCount / buyerCount : 0),
      ecommerceSharePct: round2_(transactionCount ? (ecommerceCount / transactionCount) * 100 : 0),
      physicalSharePct: round2_(transactionCount ? (physicalCount / transactionCount) * 100 : 0),
      unknownChannelSharePct: round2_(transactionCount ? ((transactionCount - ecommerceCount - physicalCount) / transactionCount) * 100 : 0),
      topCategories: topCategories,
      topGiros: topGiros,
      topMerchantsBySpend: topMerchantsBySpend,
      topMerchantsByTransactions: topMerchantsByTransactions,
      topStates: topStates,
      protoPersona: buildConsumptionProtoPersona_(stats && stats.clientMap || {}),
      executiveSummary: buildConsumptionExecutiveSummary_(buyerCount, totalSpend, topCategories[0], topMerchantsBySpend[0]),
      windowStart: stats && stats.minDate ? formatDateOnly_(stats.minDate) : '',
      windowEnd: stats && stats.maxDate ? formatDateOnly_(stats.maxDate) : '',
      windowLabel: buildConsumptionWindowLabel_(stats && stats.minDate, stats && stats.maxDate)
    };
  }

  function buildConsumptionMonthKey_(date) {
    if (!date) return '';
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    return year + '-' + (month < 10 ? '0' + month : String(month));
  }

  function buildConsumptionQuarterKey_(date) {
    if (!date) return '';
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var quarter = Math.floor((month - 1) / 3) + 1;
    return year + '-Q' + quarter;
  }

  function sortPeriodKeysDesc_(left, right) {
    var a = String(left || '');
    var b = String(right || '');
    if (a === b) return 0;
    return a > b ? -1 : 1;
  }

  function buildConsumptionMonthLabelFromKey_(key) {
    var text = String(key || '');
    var parts = text.split('-');
    if (parts.length !== 2) return text;
    return buildMonthLabel_(Number(parts[0]), Number(parts[1]));
  }

  function buildConsumptionQuarterLabelFromKey_(key) {
    var text = String(key || '');
    var parts = text.split('-Q');
    if (parts.length !== 2) return text;
    return 'T' + parts[1] + ' ' + parts[0];
  }

  function buildConsumptionWindowLabel_(startDate, endDate) {
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) {
      return buildMonthLabel_(startDate.getFullYear(), startDate.getMonth() + 1);
    }
    if (!startDate && endDate) {
      return buildMonthLabel_(endDate.getFullYear(), endDate.getMonth() + 1);
    }
    var startLabel = buildMonthLabel_(startDate.getFullYear(), startDate.getMonth() + 1);
    var endLabel = buildMonthLabel_(endDate.getFullYear(), endDate.getMonth() + 1);
    if (startLabel === endLabel) return startLabel;
    return startLabel + ' a ' + endLabel;
  }

  function aggregateConsumptionMetric_(target, key, amount, displayLabel) {
    if (!target || !key) return;
    if (!target[key]) {
      target[key] = {
        label: displayLabel || key,
        value: 0,
        count: 0
      };
    }
    if (displayLabel && (!target[key].label || target[key].label === key)) {
      target[key].label = displayLabel;
    }
    target[key].value = round2_(Number(target[key].value || 0) + Number(amount || 0));
    target[key].count = Number(target[key].count || 0) + 1;
  }

  function sortConsumptionMap_(map) {
    return Object.keys(map || {}).map(function (key) {
      return map[key];
    }).sort(function (a, b) {
      if (Number(b.value || 0) !== Number(a.value || 0)) {
        return Number(b.value || 0) - Number(a.value || 0);
      }
      return Number(b.count || 0) - Number(a.count || 0);
    }).map(function (item) {
      return {
        label: item.label,
        value: round2_(item.value || 0),
        count: Number(item.count || 0)
      };
    });
  }

  function normalizeConsumptionLabel_(value, fallback) {
    var text = stringifyCell_(value);
    if (!text) return fallback || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  function loadMerchantHomologationRules_() {
    var spreadsheetId = AppConfig.getMerchantHomologationSpreadsheetId();
    if (!spreadsheetId) return [];

    try {
      var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      var configuredSheetName = AppConfig.getMerchantHomologationSheetName();
      var sheet = configuredSheetName
        ? spreadsheet.getSheetByName(configuredSheetName)
        : null;
      if (!sheet) sheet = spreadsheet.getSheets()[0];
      if (!sheet) return [];

      var values = sheet.getDataRange().getValues();
      if (!values || values.length < 2) return [];

      var headers = buildHeaders_(values[0], values[0].length);
      var sourceIndex = resolveHeaderIndex_(headers, ['TEXTO ORIGEN', 'ORIGEN', 'MATCH', 'PATRON', 'PATRÓN', 'COMERCIO ORIGEN'], 0);
      var targetIndex = resolveHeaderIndex_(headers, ['TEXTO HOMOLOGADO', 'HOMOLOGADO', 'AGRUPADOR', 'COMERCIO HOMOLOGADO', 'ETIQUETA'], 1);
      var matchTypeIndex = resolveHeaderIndex_(headers, ['TIPO DE MATCH', 'TIPO MATCH', 'TIPO', 'MATCH TYPE'], 2);
      var activeIndex = resolveHeaderIndex_(headers, ['ACTIVO', 'ESTATUS', 'STATUS'], 3);
      var rules = [];

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var sourceValue = normalizeConsumptionLabel_(row[sourceIndex], '');
        var targetValue = normalizeConsumptionLabel_(row[targetIndex], '');
        if (!sourceValue || !targetValue) continue;

        var activeValue = activeIndex > -1 ? normalizeLookupValue_(row[activeIndex]) : 'SI';
        if (activeValue && ['NO', 'FALSE', '0', 'INACTIVO', 'N'].indexOf(activeValue) > -1) continue;

        var matchType = matchTypeIndex > -1 ? normalizeLookupValue_(row[matchTypeIndex]) : 'CONTAINS';
        if (!matchType) matchType = 'CONTAINS';
        rules.push({
          sourceRaw: sourceValue,
          sourceMatch: normalizeMerchantMatchValue_(sourceValue),
          targetRaw: targetValue,
          targetKey: normalizeMerchantKey_(targetValue),
          targetLabel: targetValue,
          matchType: matchType
        });
      }

      rules.sort(function (a, b) {
        return b.sourceMatch.length - a.sourceMatch.length;
      });
      return rules;
    } catch (error) {
      return [];
    }
  }

  function normalizeMerchantMatchValue_(value) {
    return normalizeConsumptionLabel_(value, '')
      .toUpperCase()
      .replace(/[ÁÀÄ]/g, 'A')
      .replace(/[ÉÈË]/g, 'E')
      .replace(/[ÍÌÏ]/g, 'I')
      .replace(/[ÓÒÖ]/g, 'O')
      .replace(/[ÚÙÜ]/g, 'U')
      .replace(/[*_\-\/\\.,:;()#]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function resolveMerchantHomologation_(merchantName, rules) {
    var raw = normalizeConsumptionLabel_(merchantName, 'Comercio no identificado');
    var normalizedRaw = normalizeMerchantMatchValue_(raw);
    var effectiveRules = rules || [];

    for (var index = 0; index < effectiveRules.length; index += 1) {
      var rule = effectiveRules[index];
      if (!rule || !rule.sourceMatch || !rule.targetKey) continue;

      var matchType = normalizeLookupValue_(rule.matchType || 'CONTAINS');
      var matched = false;

      if (matchType === 'EXACT') {
        matched = normalizedRaw === rule.sourceMatch;
      } else if (matchType === 'REGEX') {
        try {
          matched = !!normalizedRaw.match(new RegExp(rule.sourceRaw, 'i'));
        } catch (error) {
          matched = false;
        }
      } else {
        matched = normalizedRaw.indexOf(rule.sourceMatch) > -1;
      }

      if (matched) {
        return {
          key: rule.targetKey,
          label: rule.targetLabel || buildMerchantDisplayLabel_(raw, rule.targetKey)
        };
      }
    }

    var fallbackKey = normalizeMerchantKey_(raw);
    return {
      key: fallbackKey,
      label: buildMerchantDisplayLabel_(raw, fallbackKey)
    };
  }

  function normalizeMerchantKey_(value) {
    var text = normalizeConsumptionLabel_(value, '');
    if (!text) return 'COMERCIO NO IDENTIFICADO';

    var normalized = normalizeMerchantMatchValue_(text)
      .replace(/[*_\-\/\\.,:;()#]+/g, ' ')
      .replace(/\b(CONEKTA|PAY|PAYTRANS|TRANS|CLIP|MP|MERCADOPAGO|MERCADO PAGO|OPENPAY|STRIPE|SR|SA|CV|DE|RL)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) return 'COMERCIO NO IDENTIFICADO';
    if (normalized.indexOf('URBANI') > -1) return 'URBANI';
    if (normalized.indexOf('UBER') > -1) return 'UBER';
    if (normalized.indexOf('DIDI') > -1) return 'DIDI';
    if (
      normalized.indexOf('GOOGLE') > -1 ||
      normalized.indexOf('YOUTUBE') > -1 ||
      normalized.indexOf('GOOGPLAY') > -1 ||
      normalized.indexOf('GOOG PLAY') > -1 ||
      normalized.indexOf('GOOGLEPLAY') > -1 ||
      normalized.indexOf('GOOGLE PLAY') > -1
    ) return 'GOOGLE';
    if (normalized.indexOf('NETFLIX') > -1) return 'NETFLIX';
    if (normalized.indexOf('SPOTIFY') > -1) return 'SPOTIFY';
    if (normalized.indexOf('AMAZON') > -1) return 'AMAZON';
    if (normalized.indexOf('MERCADO LIBRE') > -1 || normalized.indexOf('MERCADOLIBRE') > -1) return 'MERCADO LIBRE';

    return normalized;
  }

  function buildMerchantDisplayLabel_(rawValue, normalizedKey) {
    var raw = normalizeConsumptionLabel_(rawValue, '');
    if (!normalizedKey) return raw || 'Comercio no identificado';
    if (normalizedKey === 'COMERCIO NO IDENTIFICADO') return 'Comercio no identificado';
    if (normalizedKey === 'URBANI') return 'URBANI';
    if (normalizedKey === 'UBER') return 'UBER';
    if (normalizedKey === 'DIDI') return 'DIDI';
    if (normalizedKey === 'GOOGLE') return 'GOOGLE';
    if (normalizedKey === 'NETFLIX') return 'NETFLIX';
    if (normalizedKey === 'SPOTIFY') return 'SPOTIFY';
    if (normalizedKey === 'AMAZON') return 'AMAZON';
    if (normalizedKey === 'MERCADO LIBRE') return 'MERCADO LIBRE';
    return raw || normalizedKey;
  }

  function resolveConsumptionChannel_(ecommerceValue, physicalValue) {
    var ecommerce = normalizeLookupValue_(ecommerceValue);
    var physical = normalizeLookupValue_(physicalValue);
    if (ecommerce && ecommerce !== '0' && ecommerce !== 'NO') return 'ECOMMERCE';
    if (physical && physical !== '0' && physical !== 'NO') return 'FISICA';
    return 'SIN_CANAL';
  }

  function buildConsumptionProtoPersona_(clientMap) {
    var customers = Object.keys(clientMap || {}).map(function (key) {
      return clientMap[key];
    }).filter(function (item) {
      return Number(item.transactions || 0) > 0;
    }).sort(function (a, b) {
      return Number(b.spend || 0) - Number(a.spend || 0);
    });

    if (!customers.length) {
      return {
        archetype: 'Sin perfil disponible',
        customerCount: 0,
        averageAge: 0,
        malePct: 0,
        femalePct: 0,
        averageTicket: 0,
        averageTransactions: 0,
        topState: 'Sin estado',
        topCategory: 'Sin categoría',
        topMerchants: []
      };
    }

    var sampleSize = Math.max(1, Math.ceil(customers.length * 0.2));
    var sample = customers.slice(0, sampleSize);
    var ageRows = sample.filter(function (item) { return item.age !== null && item.age !== undefined; });
    var maleCount = sample.filter(function (item) { return String(item.gender || '').toUpperCase() === 'M'; }).length;
    var femaleCount = sample.filter(function (item) { return String(item.gender || '').toUpperCase() === 'F'; }).length;
    var ecommerceCount = sample.reduce(function (acc, item) { return acc + Number(item.ecommerceCount || 0); }, 0);
    var physicalCount = sample.reduce(function (acc, item) { return acc + Number(item.physicalCount || 0); }, 0);
    var categoryMap = {};
    var merchantMap = {};
    var stateMap = {};

    sample.forEach(function (item) {
      aggregateConsumptionMetric_(stateMap, normalizeConsumptionLabel_(item.stateName, 'Sin estado'), item.spend || 0);
      Object.keys(item.topCategories || {}).forEach(function (key) {
        aggregateConsumptionMetric_(categoryMap, key, item.topCategories[key].value || 0);
      });
      Object.keys(item.topMerchants || {}).forEach(function (key) {
        aggregateConsumptionMetric_(merchantMap, key, item.topMerchants[key].value || 0);
      });
    });

    var topState = sortConsumptionMap_(stateMap)[0];
    var topCategory = sortConsumptionMap_(categoryMap)[0];
    var topMerchants = sortConsumptionMap_(merchantMap).slice(0, 3);
    var sampleSpend = sample.reduce(function (acc, item) { return acc + Number(item.spend || 0); }, 0);
    var sampleTransactions = sample.reduce(function (acc, item) { return acc + Number(item.transactions || 0); }, 0);
    var ecommerceShare = sampleTransactions ? (ecommerceCount / sampleTransactions) * 100 : 0;
    var averageTicket = sampleTransactions ? sampleSpend / sampleTransactions : 0;
    var archetype = ecommerceShare >= 60
      ? 'Comprador digital'
      : averageTicket >= 600
        ? 'Comprador premium'
        : 'Comprador cotidiano';

    return {
      archetype: archetype,
      customerCount: sample.length,
      averageAge: round2_(ageRows.length ? ageRows.reduce(function (acc, item) { return acc + Number(item.age || 0); }, 0) / ageRows.length : 0),
      malePct: round2_(sample.length ? (maleCount / sample.length) * 100 : 0),
      femalePct: round2_(sample.length ? (femaleCount / sample.length) * 100 : 0),
      averageTicket: round2_(averageTicket),
      averageTransactions: round2_(sample.length ? sampleTransactions / sample.length : 0),
      ecommerceSharePct: round2_(ecommerceShare),
      physicalSharePct: round2_(sampleTransactions ? (physicalCount / sampleTransactions) * 100 : 0),
      topState: topState ? topState.label : 'Sin estado',
      topCategory: topCategory ? topCategory.label : 'Sin categoría',
      topMerchants: topMerchants
    };
  }

  function buildConsumptionExecutiveSummary_(buyerCount, totalSpend, topCategory, topMerchant) {
    if (!buyerCount || !totalSpend) {
      return 'Todavía no hay consumos clasificados en los últimos 3 meses para construir el PFM comercial.';
    }

    return 'Se analizaron los cargos de los últimos 3 meses para identificar hábitos de compra. ' +
      'Detectamos ' + Number(buyerCount || 0).toLocaleString('es-MX') + ' clientes compradores y un gasto total de ' + formatCurrency_(totalSpend) + '. ' +
      'La categoría dominante es ' + (topCategory ? topCategory.label : 'Sin categoría') +
      ' y el comercio con mayor volumen es ' + (topMerchant ? topMerchant.label : 'Sin comercio identificado') + '.';
  }

  function buildExternalProductSummary_(definition, rows, totalActiveAccounts, limit) {
    var totalBalance = rows.reduce(function (acc, item) {
      return acc + Number(item.balance || 0);
    }, 0);
    var maleClients = rows.filter(function (item) { return item.gender === 'M'; }).length;
    var femaleClients = rows.filter(function (item) { return item.gender === 'F'; }).length;
    var validAgeRows = rows.filter(function (item) { return item.age !== null && item.age !== undefined; });
    var ageSum = validAgeRows.reduce(function (acc, item) {
      return acc + Number(item.age || 0);
    }, 0);
    var modeAge = calculateModeAgeFromRows_(validAgeRows);

    return {
      productCode: definition.code,
      productLabel: definition.label,
      accounts: rows.length,
      sharePct: round2_(totalActiveAccounts ? (rows.length / totalActiveAccounts) * 100 : 0),
      totalBalance: round2_(totalBalance),
      averageBalance: round2_(rows.length ? totalBalance / rows.length : 0),
      maleClients: maleClients,
      femaleClients: femaleClients,
      malePct: round2_(rows.length ? (maleClients / rows.length) * 100 : 0),
      femalePct: round2_(rows.length ? (femaleClients / rows.length) * 100 : 0),
      validAgeClients: validAgeRows.length,
      averageAge: round2_(validAgeRows.length ? ageSum / validAgeRows.length : 0),
      modeAge: modeAge,
      topStates: buildStateRows_(rows, limit || 5)
    };
  }

  function readSavingsGoalsByRewardsId_(activeClientProfiles) {
    var rows = [];
    var profileMap = activeClientProfiles || {};
    var source = openSavingsGoalsSheet_();
    if (!source || !source.sheet) return { rows: rows };

    var values = source.sheet.getDataRange().getValues();
    if (!values || values.length < 2) return { rows: rows };

    var headers = buildHeaders_(values[0], values[0].length);
    var idIndex = resolveHeaderIndex_(headers, SAVINGS_GOALS_ID_HEADERS, 0);
    var balanceIndex = resolveHeaderIndex_(headers, SAVINGS_GOALS_BALANCE_HEADERS, 1);
    var statusIndex = resolveHeaderIndex_(headers, SAVINGS_GOALS_STATUS_HEADERS, 3);
    var grouped = {};

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (!row || !row.length) continue;

      var rewardsId = normalizeLookupValue_(row[idIndex]);
      if (!rewardsId || !profileMap[rewardsId]) continue;
      if (!isActiveSavingsGoalStatus_(row[statusIndex])) continue;

      if (!grouped[rewardsId]) {
        grouped[rewardsId] = {
          rewardsId: rewardsId,
          balance: 0
        };
      }

      grouped[rewardsId].balance = round2_(Number(grouped[rewardsId].balance || 0) + sanitizeBalance_(row[balanceIndex]));
    }

    Object.keys(grouped).forEach(function (rewardsId) {
      var profile = profileMap[rewardsId];
      rows.push({
        rewardsId: rewardsId,
        balance: grouped[rewardsId].balance,
        stateName: profile.stateName || 'SIN ESTADO',
        municipalityName: profile.municipalityName || '',
        gender: profile.gender || '',
        age: profile.age === undefined ? null : profile.age
      });
    });

    return { rows: rows };
  }

  function openSavingsGoalsSheet_() {
    try {
      var spreadsheet = SpreadsheetApp.openById(AppConfig.getMonthlyBalanceSpreadsheetId());
      var sheet = spreadsheet.getSheetByName(SAVINGS_GOALS_SHEET_NAME);
      if (!sheet) return null;
      return {
        spreadsheet: spreadsheet,
        sheet: sheet
      };
    } catch (error) {
      Logger.log('No fue posible abrir la pestaña ' + SAVINGS_GOALS_SHEET_NAME + ': ' + error.message);
      return null;
    }
  }

  function isActiveSavingsGoalStatus_(value) {
    var normalized = normalizeStatus_(value);
    if (!normalized) return false;
    if (normalized === 'A') return true;
    if (normalized === 'A-ACTIVA') return true;
    return normalized.indexOf('ACTIV') > -1;
  }

  function readCreditCardByRewardsId_(activeClientProfiles) {
    var rows = [];
    var profileMap = activeClientProfiles || {};
    var source = openCreditCardSheet_();
    if (!source || !source.sheet) return { rows: rows };

    var values = source.sheet.getDataRange().getValues();
    if (!values || values.length < 2) return { rows: rows };

    var headers = buildHeaders_(values[0], values[0].length);
    var idIndex = resolveHeaderIndex_(headers, CREDIT_CARD_ID_HEADERS, 0);
    var accountStatusIndex = resolveHeaderIndex_(headers, CREDIT_CARD_ACCOUNT_STATUS_HEADERS, 1);
    var cardStatusIndex = resolveHeaderIndex_(headers, CREDIT_CARD_STATUS_HEADERS, 4);
    var grouped = {};

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (!row || !row.length) continue;

      var rewardsId = normalizeLookupValue_(row[idIndex]);
      if (!rewardsId || !profileMap[rewardsId]) continue;
      if (normalizeStatus_(row[accountStatusIndex]) !== 'A-ACTIVA') continue;
      if (!isActiveCreditCardStatus_(row[cardStatusIndex])) continue;

      grouped[rewardsId] = true;
    }

    Object.keys(grouped).forEach(function (rewardsId) {
      var profile = profileMap[rewardsId];
      rows.push({
        rewardsId: rewardsId,
        balance: 0,
        stateName: profile.stateName || 'SIN ESTADO',
        municipalityName: profile.municipalityName || '',
        gender: profile.gender || '',
        age: profile.age === undefined ? null : profile.age
      });
    });

    return { rows: rows };
  }

  function openCreditCardSheet_() {
    try {
      var spreadsheet = SpreadsheetApp.openById(AppConfig.getMonthlyBalanceSpreadsheetId());
      var sheet = spreadsheet.getSheetByName(CREDIT_CARD_SHEET_NAME);
      if (!sheet) return null;
      return {
        spreadsheet: spreadsheet,
        sheet: sheet
      };
    } catch (error) {
      Logger.log('No fue posible abrir la pestaña ' + CREDIT_CARD_SHEET_NAME + ': ' + error.message);
      return null;
    }
  }

  function isActiveCreditCardStatus_(value) {
    var normalized = normalizeStatus_(value);
    if (!normalized) return false;
    if (normalized === 'A') return true;
    if (normalized === 'ACTIVO') return true;
    if (normalized === 'ACTIVA') return true;
    return normalized.indexOf('ACTIV') > -1;
  }

  function buildCardSummary_(rows) {
    var coverageRows = buildActiveCardCoverageRows_(rows);
    var totalActiveAccounts = coverageRows.length;
    var summaryMap = {
      physical: {
        key: 'physical',
        label: 'Fisica',
        description: 'Plastico fisico activado',
        accounts: 0,
        transactionalAccounts: 0
      },
      digital: {
        key: 'digital',
        label: 'Digital',
        description: 'Plastico digital activado',
        accounts: 0,
        transactionalAccounts: 0
      },
      both: {
        key: 'both',
        label: 'Ambas',
        description: 'Fisica y digital activadas',
        accounts: 0,
        transactionalAccounts: 0
      }
    };

    coverageRows.forEach(function (item) {
      if (item.hasPhysical) {
        summaryMap.physical.accounts += 1;
        if (item.hasRecentActivity30d) summaryMap.physical.transactionalAccounts += 1;
      }

      if (item.hasDigital) {
        summaryMap.digital.accounts += 1;
        if (item.hasRecentActivity30d) summaryMap.digital.transactionalAccounts += 1;
      }

      if (item.hasPhysical && item.hasDigital) {
        summaryMap.both.accounts += 1;
        if (item.hasRecentActivity30d) summaryMap.both.transactionalAccounts += 1;
      }
    });

    var categories = ['physical', 'digital', 'both'].map(function (key) {
      var item = summaryMap[key];
      return {
        key: item.key,
        label: item.label,
        description: item.description,
        accounts: item.accounts,
        transactionalAccounts: item.transactionalAccounts,
        sharePct: round2_(totalActiveAccounts ? (item.accounts / totalActiveAccounts) * 100 : 0)
      };
    });

    var coveredAccounts = coverageRows.reduce(function (acc, item) {
      return acc + (item.hasCard ? 1 : 0);
    }, 0);
    var coveredTransactionalAccounts = coverageRows.reduce(function (acc, item) {
      return acc + (item.hasCard && item.hasRecentActivity30d ? 1 : 0);
    }, 0);
    var uncoveredAccounts = coverageRows.reduce(function (acc, item) {
      return acc + (!item.hasCard ? 1 : 0);
    }, 0);
    var uncoveredTransactionalAccounts = coverageRows.reduce(function (acc, item) {
      return acc + (!item.hasCard && item.hasRecentActivity30d ? 1 : 0);
    }, 0);
    var transactionalAccounts = coverageRows.reduce(function (acc, item) {
      return acc + (item.hasRecentActivity30d ? 1 : 0);
    }, 0);

    return {
      totalActiveAccounts: totalActiveAccounts,
      coveredAccounts: coveredAccounts,
      coveredSharePct: round2_(totalActiveAccounts ? (coveredAccounts / totalActiveAccounts) * 100 : 0),
      uncoveredAccounts: uncoveredAccounts,
      transactionalAccounts: transactionalAccounts,
      transactionalSharePct: round2_(totalActiveAccounts ? (transactionalAccounts / totalActiveAccounts) * 100 : 0),
      coveredTransactionalAccounts: coveredTransactionalAccounts,
      uncoveredTransactionalAccounts: uncoveredTransactionalAccounts,
      categories: categories
    };
  }

  function buildActiveCardCoverageRows_(rows) {
    var cardMap = readCardsByRewardsId_();
    var transactionMap = readTransactionsByRewardsId_();
    var grouped = {};

    (rows || []).forEach(function (item) {
      if (normalizeStatus_(item.accountStatus) !== 'A-ACTIVA') return;

      var rewardsId = normalizeLookupValue_(item.rewardsId);
      if (!rewardsId) return;

      if (!grouped[rewardsId]) {
        grouped[rewardsId] = {
          rewardsId: rewardsId,
          stateName: item.stateName || '',
          municipalityName: item.municipalityName || '',
          gender: item.gender || '',
          accountCount: 0,
          totalBalance: 0,
          products: {}
        };
      }

      grouped[rewardsId].accountCount += 1;
      grouped[rewardsId].totalBalance += Number(item.balance || 0);
      if (item.productLabel) grouped[rewardsId].products[item.productLabel] = true;
      if (!grouped[rewardsId].stateName && item.stateName) grouped[rewardsId].stateName = item.stateName;
      if (!grouped[rewardsId].municipalityName && item.municipalityName) grouped[rewardsId].municipalityName = item.municipalityName;
      if (!grouped[rewardsId].gender && item.gender) grouped[rewardsId].gender = item.gender;
    });

    return Object.keys(grouped).map(function (rewardsId) {
      var base = grouped[rewardsId];
      var cardFlags = cardMap[rewardsId] || { hasPhysical: false, hasDigital: false };
      var hasCard = !!(cardFlags.hasPhysical || cardFlags.hasDigital);
      var hasRecentActivity30d = !!(transactionMap[rewardsId] && transactionMap[rewardsId].hasRecentActivity30d);
      var cardType = 'SIN_TARJETA';

      if (cardFlags.hasPhysical && cardFlags.hasDigital) {
        cardType = 'AMBAS';
      } else if (cardFlags.hasPhysical) {
        cardType = 'FISICA';
      } else if (cardFlags.hasDigital) {
        cardType = 'DIGITAL';
      }

      return {
        rewardsId: rewardsId,
        stateName: base.stateName || '',
        municipalityName: base.municipalityName || '',
        gender: base.gender || '',
        accountCount: base.accountCount,
        totalBalance: round2_(base.totalBalance),
        products: Object.keys(base.products || {}).sort(),
        hasPhysical: !!cardFlags.hasPhysical,
        hasDigital: !!cardFlags.hasDigital,
        hasCard: hasCard,
        cardType: cardType,
        hasRecentActivity30d: hasRecentActivity30d
      };
    }).sort(function (a, b) {
      if (a.hasCard !== b.hasCard) return a.hasCard ? -1 : 1;
      if (a.cardType !== b.cardType) return String(a.cardType).localeCompare(String(b.cardType));
      return String(a.rewardsId).localeCompare(String(b.rewardsId));
    });
  }

  function buildCardCoverageExportRow_(item) {
    return {
      ID_RECOMPENSAS: item.rewardsId || '',
      TIENE_TARJETA: item.hasCard ? 'SI' : 'NO',
      TIPO_TARJETA: item.cardType || 'SIN_TARJETA',
      TARJETA_FISICA: item.hasPhysical ? 'SI' : 'NO',
      TARJETA_DIGITAL: item.hasDigital ? 'SI' : 'NO',
      TRANSACCIONAL_30_DIAS: item.hasRecentActivity30d ? 'SI' : 'NO',
      CUENTAS_ACTIVAS: item.accountCount || 0,
      SALDO_TOTAL_PORTAFOLIO: formatCurrency_(item.totalBalance || 0),
      PRODUCTOS_ACTIVOS: (item.products || []).join(' | '),
      ESTADO: item.stateName || '',
      MUNICIPIO: item.municipalityName || '',
      GENERO: item.gender || ''
    };
  }

  function buildHistoricalExportRow_(item) {
    var exportRow = Object.keys(item.exportRow || {}).reduce(function (acc, key) {
      acc[key] = normalizeExportValue_(key, item.exportRow[key]);
      return acc;
    }, {});
    exportRow.FECHA_APERTURA_NORMALIZADA = item.openingDate ? formatDateOnly_(item.openingDate) : '';
    exportRow.PRODUCTO_ETIQUETA = item.productLabel || resolveProductLabel_(item.productCode);
    exportRow.ESTATUS_ACTUAL = item.accountStatus || 'SIN ESTATUS';
    exportRow.ESTADO_ACTUAL = item.stateName || 'SIN ESTADO';
    exportRow.MUNICIPIO_ACTUAL = item.municipalityName || '';
    exportRow.GENERO_NORMALIZADO = item.gender || '';
    exportRow.EDAD_ACTUAL = item.age === null ? '' : item.age;
    exportRow.SALDO_PROMEDIO_NUMERICO = formatCurrency_(item.balance || 0);
    return exportRow;
  }

  function buildFirst30CohortRow_(item, transactions) {
    var first30WindowEnd = shiftDays_(item.openingDate, 29);
    var first30TxCount = 0;
    var first30AbonoCount = 0;
    var first30CargoCount = 0;
    var first30AbonoAmount = 0;
    var first30CargoAmount = 0;
    var first30NetAmount = 0;

    (transactions || []).forEach(function (tx) {
      if (!tx || !tx.date) return;
      var txTime = tx.date.getTime();
      if (txTime < item.openingDate.getTime() || txTime > first30WindowEnd.getTime()) return;

      first30TxCount += 1;
      first30NetAmount += Number(tx.abono || 0) - Number(tx.cargo || 0);
      if (Number(tx.abono || 0) > 0) {
        first30AbonoCount += 1;
        first30AbonoAmount += Number(tx.abono || 0);
      }
      if (Number(tx.cargo || 0) > 0) {
        first30CargoCount += 1;
        first30CargoAmount += Number(tx.cargo || 0);
      }
    });

    var transactionalFirst30 = first30AbonoCount > 0 || first30CargoCount > 0;
    var qualifiesFirst30 = first30CargoCount >= FIRST30_MIN_CARGOS && first30AbonoCount >= FIRST30_MIN_ABONOS;

    return {
      rewardsId: item.rewardsId,
      openingDate: item.openingDate,
      openingDateLabel: formatDateOnly_(item.openingDate),
      year: item.openingDate.getFullYear(),
      month: item.openingDate.getMonth() + 1,
      monthName: buildMonthName_(item.openingDate.getMonth() + 1),
      monthLabel: buildMonthLabel_(item.openingDate.getFullYear(), item.openingDate.getMonth() + 1),
      accountStatus: item.accountStatus,
      productCode: item.productCode,
      productLabel: item.productLabel,
      stateName: item.stateName,
      municipalityName: item.municipalityName,
      gender: item.gender,
      age: item.age,
      balance: round2_(item.balance || 0),
      transactionalFirst30: transactionalFirst30,
      qualifiesFirst30: qualifiesFirst30,
      first30TxCount: first30TxCount,
      first30AbonoCount: first30AbonoCount,
      first30CargoCount: first30CargoCount,
      first30AbonoAmount: round2_(first30AbonoAmount),
      first30CargoAmount: round2_(first30CargoAmount),
      first30NetAmount: round2_(first30NetAmount)
    };
  }

  function buildFirst30TotalSummary_(rows) {
    var openingAccounts = rows.length;
    var qualifiedAccounts = rows.filter(function (item) { return item.qualifiesFirst30; }).length;
    var transactionalAccounts = rows.filter(function (item) { return item.transactionalFirst30; }).length;
    var netTotal = rows.reduce(function (acc, item) { return acc + Number(item.first30NetAmount || 0); }, 0);

    return {
      openingAccounts: openingAccounts,
      qualifiedAccounts: qualifiedAccounts,
      qualifiedPct: round2_(openingAccounts ? (qualifiedAccounts / openingAccounts) * 100 : 0),
      transactionalAccounts: transactionalAccounts,
      transactionalPct: round2_(openingAccounts ? (transactionalAccounts / openingAccounts) * 100 : 0),
      netTotal: round2_(netTotal)
    };
  }

  function buildFirst30MonthlySummary_(rows) {
    var groups = {};
    (rows || []).forEach(function (item) {
      var key = item.year + '-' + (item.month < 10 ? '0' + item.month : String(item.month));
      if (!groups[key]) {
        groups[key] = {
          year: item.year,
          month: item.month,
          monthName: item.monthName,
          rows: []
        };
      }
      groups[key].rows.push(item);
    });

    return Object.keys(groups).map(function (key) {
      var group = groups[key];
      var groupRows = group.rows || [];
      var qualifiedAccounts = groupRows.filter(function (item) { return item.qualifiesFirst30; }).length;
      var transactionalAccounts = groupRows.filter(function (item) { return item.transactionalFirst30; }).length;
      var netTotal = groupRows.reduce(function (acc, item) { return acc + Number(item.first30NetAmount || 0); }, 0);
      return {
        year: group.year,
        month: group.month,
        monthName: group.monthName,
        openingAccounts: groupRows.length,
        qualifiedAccounts: qualifiedAccounts,
        qualifiedPct: round2_(groupRows.length ? (qualifiedAccounts / groupRows.length) * 100 : 0),
        transactionalAccounts: transactionalAccounts,
        transactionalPct: round2_(groupRows.length ? (transactionalAccounts / groupRows.length) * 100 : 0),
        netTotal: round2_(netTotal)
      };
    }).sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  function buildFirst30ExportRow_(item) {
    return {
      ID_RECOMPENSAS: item.rewardsId || '',
      FECHA_APERTURA: item.openingDateLabel || '',
      ESTATUS_ACTUAL: item.accountStatus || '',
      PRODUCTO: item.productLabel || item.productCode || '',
      ESTADO: item.stateName || '',
      MUNICIPIO: item.municipalityName || '',
      GENERO: item.gender || '',
      EDAD: item.age === null || item.age === undefined ? '' : item.age,
      SALDO_PROMEDIO: formatCurrency_(item.balance || 0),
      USA_FIRST30: item.transactionalFirst30 ? 'SI' : 'NO',
      CUMPLE_REGLA_FIRST30: item.qualifiesFirst30 ? 'SI' : 'NO',
      MOVIMIENTOS_FIRST30: item.first30TxCount || 0,
      ABONOS_FIRST30_CANTIDAD: item.first30AbonoCount || 0,
      ABONOS_FIRST30_MONTO: formatCurrency_(item.first30AbonoAmount || 0),
      CARGOS_FIRST30_CANTIDAD: item.first30CargoCount || 0,
      CARGOS_FIRST30_MONTO: formatCurrency_(item.first30CargoAmount || 0),
      NETO_FIRST30: formatCurrency_(item.first30NetAmount || 0)
    };
  }

  function buildTopStates_(rows) {
    return buildStateRows_(rows, 5);
  }

  function buildProductStateRows_(allRows, activeRows, limit) {
    var activeGrouped = Utils.groupBy(activeRows || [], function (item) {
      return item.stateName || 'SIN ESTADO';
    });
    var allGrouped = Utils.groupBy(allRows || [], function (item) {
      return item.stateName || 'SIN ESTADO';
    });

    return Object.keys(allGrouped).map(function (stateName) {
      var stateAllRows = allGrouped[stateName] || [];
      var stateActiveRows = activeGrouped[stateName] || [];
      return {
        stateName: stateName,
        accounts: stateActiveRows.length,
        sharePct: round2_(activeRows && activeRows.length ? (stateActiveRows.length / activeRows.length) * 100 : 0),
        totalBalance: round2_(sumBalance_(stateAllRows)),
        averageBalance: round2_(stateAllRows.length ? sumBalance_(stateAllRows) / stateAllRows.length : 0)
      };
    }).sort(function (a, b) {
      if (b.accounts !== a.accounts) return b.accounts - a.accounts;
      if (b.totalBalance !== a.totalBalance) return b.totalBalance - a.totalBalance;
      return String(a.stateName).localeCompare(String(b.stateName));
    }).slice(0, limit || 5);
  }

  function buildStateRows_(rows, limit) {
    var grouped = Utils.groupBy(rows, function (item) {
      return item.stateName || 'SIN ESTADO';
    });

    return Object.keys(grouped).map(function (stateName) {
      var stateRows = grouped[stateName] || [];
      var totalBalance = sumBalance_(stateRows);
      return {
        stateName: stateName,
        accounts: stateRows.length,
        sharePct: round2_(rows.length ? (stateRows.length / rows.length) * 100 : 0),
        totalBalance: round2_(totalBalance),
        averageBalance: round2_(stateRows.length ? totalBalance / stateRows.length : 0)
      };
    }).sort(function (a, b) {
      if (b.accounts !== a.accounts) return b.accounts - a.accounts;
      if (b.totalBalance !== a.totalBalance) return b.totalBalance - a.totalBalance;
      return String(a.stateName).localeCompare(String(b.stateName));
    }).slice(0, limit || 5);
  }

  function buildExecutiveSummary_(totalAccounts, totalBalance, topProduct, productUniverseRows) {
    var summary = 'Se analizaron ' + totalAccounts + ' cuentas de la hoja Clientes para el conteo operativo. ';
    summary += 'El saldo total del portafolio identificado es de ' + formatCurrency_(totalBalance) + ', usando la columna SALDO PROMEDIO HOY de la hoja Clientes.';
    if (topProduct) {
      summary += ' El resumen por producto usa solo cuentas A-ACTIVA para el conteo (' + productUniverseRows + ' cuentas) y el producto con mayor volumen es ' + topProduct.productLabel + '.';
    }
    return summary;
  }

  function buildMonthlyExecutiveSummary_(totalAccounts, activeAccounts, inactiveAccounts, cancelledAccounts, topStatus, year, month) {
    if (!totalAccounts) {
      return 'No se identificaron cuentas aperturadas en ' + buildMonthLabel_(year, month) + '.';
    }

    var summary = 'En ' + buildMonthLabel_(year, month) + ' se aperturaron ' + totalAccounts + ' cuentas.';
    summary += ' Hoy ' + activeAccounts + ' siguen A-ACTIVA y ' + inactiveAccounts + ' se encuentran I-INACTIVA.';
    if (cancelledAccounts > 0) {
      summary += ' Además, ' + cancelledAccounts + ' están en estatus cancelada.';
    }
    if (topStatus) {
      summary += ' El estatus actual más común es ' + topStatus.status + ' con ' + topStatus.accounts + ' cuentas.';
    }
    return summary;
  }

  function isCancelledStatus_(value) {
    var normalized = normalizeStatus_(value);
    if (!normalized) return false;
    if (normalized === 'C') return true;
    return normalized.indexOf('CANCEL') > -1;
  }

  function readCardsByRewardsId_() {
    var source = openCardsSheet_();
    var values = source.sheet.getDataRange().getValues();
    var map = {};
    if (!values || values.length < 2) return map;

    var headers = buildHeaders_(values[0], values[0].length);
    var idIndex = resolveHeaderIndex_(headers, CARD_ID_HEADERS, CARD_ID_COLUMN_INDEX);
    var recentPhysicalIndex = resolveHeaderIndex_(headers, CARD_RECENT_PHYSICAL_HEADERS, -1);
    var recentDigitalIndex = resolveHeaderIndex_(headers, CARD_RECENT_DIGITAL_HEADERS, -1);
    var physicalIndex = resolveHeaderIndex_(headers, CARD_PHYSICAL_HEADERS, -1);
    var digitalIndex = resolveHeaderIndex_(headers, CARD_DIGITAL_HEADERS, -1);
    var statusIndex = resolveHeaderIndex_(headers, CARD_STATUS_HEADERS, CARD_STATUS_COLUMN_INDEX);

    for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      var row = values[rowIndex];
      if (!row || !row.length) continue;

      var rewardsId = normalizeLookupValue_(row[idIndex]);
      if (!rewardsId) continue;

      if (normalizeStatus_(row[statusIndex]) !== 'ACTIVADA') continue;

      var hasPhysical = recentPhysicalIndex > -1
        ? hasRecentCardFlag_(row[recentPhysicalIndex])
        : hasPopulatedPlastic_(physicalIndex > -1 ? row[physicalIndex] : '');
      var hasDigital = recentDigitalIndex > -1
        ? hasRecentCardFlag_(row[recentDigitalIndex])
        : hasPopulatedPlastic_(digitalIndex > -1 ? row[digitalIndex] : '');
      if (!hasPhysical && !hasDigital) continue;

      if (!map[rewardsId]) {
        map[rewardsId] = {
          hasPhysical: false,
          hasDigital: false
        };
      }

      map[rewardsId].hasPhysical = map[rewardsId].hasPhysical || hasPhysical;
      map[rewardsId].hasDigital = map[rewardsId].hasDigital || hasDigital;
    }

    return map;
  }

  function openCardsSheet_() {
    var spreadsheetId = AppConfig.getCardsSummarySpreadsheetId();
    var spreadsheet;

    try {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      throw new Error('No fue posible abrir el spreadsheet fuente de tarjetas.');
    }

    var sheets = spreadsheet.getSheets() || [];
    for (var index = 0; index < sheets.length; index += 1) {
      var sheet = sheets[index];
      if (isCardsSheetCandidate_(sheet)) {
        return {
          spreadsheetId: spreadsheetId,
          spreadsheet: spreadsheet,
          sheet: sheet
        };
      }
    }

    throw new Error('No se encontro una pestaña valida en el spreadsheet fuente de tarjetas.');
  }

  function isCardsSheetCandidate_(sheet) {
    if (!sheet || sheet.getLastRow() < 2) return false;
    var headers = buildHeaders_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], sheet.getLastColumn());
    var hasPhysicalSignal = resolveHeaderIndex_(headers, CARD_RECENT_PHYSICAL_HEADERS, -1) > -1
      || resolveHeaderIndex_(headers, CARD_PHYSICAL_HEADERS, -1) > -1;
    var hasDigitalSignal = resolveHeaderIndex_(headers, CARD_RECENT_DIGITAL_HEADERS, -1) > -1
      || resolveHeaderIndex_(headers, CARD_DIGITAL_HEADERS, -1) > -1;
    return resolveHeaderIndex_(headers, CARD_ID_HEADERS, -1) > -1
      && hasPhysicalSignal
      && hasDigitalSignal
      && resolveHeaderIndex_(headers, CARD_STATUS_HEADERS, -1) > -1;
  }

  function normalizeHistoricalFilters_(rows, payload) {
    var availableYears = buildAvailableYears_(rows);
    var maxDate = rows[rows.length - 1].openingDate;
    var minDate = rows[0].openingDate;
    var selectedEndDate = parseOpeningDate_(payload.endDate) || maxDate;
    var tentativeStartDate = parseOpeningDate_(payload.startDate);
    var defaultStartDate = shiftDays_(selectedEndDate, -89);
    var selectedStartDate = tentativeStartDate || (defaultStartDate < minDate ? minDate : defaultStartDate);
    if (selectedStartDate > selectedEndDate) {
      selectedStartDate = selectedEndDate;
    }

    var selectedYear = Number(payload.selectedYear || maxDate.getFullYear());
    if (availableYears.indexOf(selectedYear) === -1) {
      selectedYear = availableYears[availableYears.length - 1];
    }

    var availableMonths = buildAvailableMonths_(rows, selectedYear);
    var selectedMonth = Number(payload.selectedMonth || (availableMonths[availableMonths.length - 1] && availableMonths[availableMonths.length - 1].month) || 1);
    if (!(availableMonths || []).some(function (item) { return Number(item.month) === Number(selectedMonth); })) {
      selectedMonth = (availableMonths[availableMonths.length - 1] && availableMonths[availableMonths.length - 1].month) || 1;
    }

    return {
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      selectedYear: selectedYear,
      selectedMonth: selectedMonth
    };
  }

  function buildAvailableYears_(rows) {
    var grouped = {};
    rows.forEach(function (item) {
      if (!item.openingDate) return;
      grouped[item.openingDate.getFullYear()] = true;
    });

    return Object.keys(grouped).map(function (year) {
      return Number(year);
    }).sort(function (a, b) { return a - b; });
  }

  function buildAvailableMonths_(rows, year) {
    var grouped = {};
    rows.forEach(function (item) {
      if (!item.openingDate || item.openingDate.getFullYear() !== Number(year)) return;
      grouped[item.openingDate.getMonth() + 1] = true;
    });

    return Object.keys(grouped).map(function (month) {
      month = Number(month);
      return {
        month: month,
        label: buildMonthLabel_(year, month)
      };
    }).sort(function (a, b) { return a.month - b.month; });
  }

  function buildAvailablePeriods_(rows) {
    return buildAvailableYears_(rows).sort(function (a, b) { return b - a; }).map(function (year) {
      return {
        year: year,
        months: buildAvailableMonths_(rows, year).sort(function (a, b) { return b.month - a.month; }).map(function (item) {
          return {
            year: year,
            month: item.month,
            label: item.label,
            key: year + '-' + (item.month < 10 ? '0' + item.month : String(item.month))
          };
        })
      };
    });
  }

  function readTransactionsByRewardsId_() {
    var map = {};
    var transactionSources = loadTransactionValueSources_();
    var referenceDate = findLatestTransactionDate_(transactionSources) || stripTime_(new Date());
    var thresholdDate = shiftDays_(referenceDate, -29);

    transactionSources.forEach(function (source) {
      var values = source.values || [];
      if (!values || values.length < 2) return;

      var headers = buildHeaders_(values[0], values[0].length);
      var idIndex = resolveHeaderIndex_(headers, TRANSACTION_ID_HEADERS, TRANSACTION_ID_COLUMN_INDEX);
      var dateIndex = resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, TRANSACTION_DATE_COLUMN_INDEX);
      var abonoIndex = resolveHeaderIndex_(headers, TRANSACTION_ABONO_HEADERS, TRANSACTION_ABONO_COLUMN_INDEX);
      var cargoIndex = resolveHeaderIndex_(headers, TRANSACTION_CARGO_HEADERS, TRANSACTION_CARGO_COLUMN_INDEX);

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var rewardsId = normalizeLookupValue_(row[idIndex]);
        if (!rewardsId) continue;

        var txDate = parseDateValue_(row[dateIndex]);
        var abono = sanitizeBalance_(row[abonoIndex]);
        var cargo = sanitizeBalance_(row[cargoIndex]);

        if (!map[rewardsId]) {
          map[rewardsId] = {
            hasRecentActivity30d: false
          };
        }

        if (!txDate || txDate.getTime() < thresholdDate.getTime()) continue;
        if (abono > 0 || cargo > 0) {
          map[rewardsId].hasRecentActivity30d = true;
        }
      }
    });

    return map;
  }

  function readTransactionTimelineByRewardsId_() {
    var map = {};
    var referenceDate = null;
    var transactionSources = loadTransactionValueSources_();

    transactionSources.forEach(function (source) {
      var values = source.values || [];
      if (!values || values.length < 2) return;

      var headers = buildHeaders_(values[0], values[0].length);
      var idIndex = resolveHeaderIndex_(headers, TRANSACTION_ID_HEADERS, TRANSACTION_ID_COLUMN_INDEX);
      var dateIndex = resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, TRANSACTION_DATE_COLUMN_INDEX);
      var abonoIndex = resolveHeaderIndex_(headers, TRANSACTION_ABONO_HEADERS, TRANSACTION_ABONO_COLUMN_INDEX);
      var cargoIndex = resolveHeaderIndex_(headers, TRANSACTION_CARGO_HEADERS, TRANSACTION_CARGO_COLUMN_INDEX);

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var rewardsId = normalizeLookupValue_(row[idIndex]);
        if (!rewardsId) continue;

        var txDate = parseDateValue_(row[dateIndex]);
        if (!txDate) continue;

        var abono = sanitizeBalance_(row[abonoIndex]);
        var cargo = sanitizeBalance_(row[cargoIndex]);
        if (!map[rewardsId]) map[rewardsId] = [];
        map[rewardsId].push({
          date: txDate,
          abono: abono,
          cargo: cargo
        });
        if (!referenceDate || txDate.getTime() > referenceDate.getTime()) {
          referenceDate = txDate;
        }
      }
    });

    Object.keys(map).forEach(function (rewardsId) {
      map[rewardsId].sort(function (a, b) {
        return a.date.getTime() - b.date.getTime();
      });
    });

    return {
      map: map,
      referenceDate: referenceDate
    };
  }

  function openTransactionSheets_() {
    var configuredSources = openConfiguredTransactionSheets_();
    if (configuredSources.length) return configuredSources;

    return CustomerTransactionSourceService.getSourceSheets().filter(function (source) {
      return source && source.sheet && isTransactionSheetCandidate_(source.sheet);
    }).map(function (source) {
      return {
        spreadsheetId: source.spreadsheetId,
        spreadsheetName: source.spreadsheetName,
        sheet: source.sheet,
        label: source.label
      };
    });
  }

  function loadTransactionValueSources_() {
    var csvSources = loadConfiguredTransactionCsvSources_();
    if (csvSources.length) return csvSources;

    return openTransactionSheets_().map(function (source) {
      return {
        label: source.label || '',
        values: source.sheet.getDataRange().getValues()
      };
    }).filter(function (source) {
      return source && source.values && source.values.length >= 2;
    });
  }

  function loadConfiguredTransactionCsvSources_() {
    var configs = AppConfig.getCustomerTransactionSourceConfigs() || [];
    var sources = [];

    configs.forEach(function (config) {
      if (!config || !config.spreadsheetId) return;

      var sheetIds = Array.isArray(config.sheetIds) && config.sheetIds.length
        ? config.sheetIds
        : [];

      sheetIds.forEach(function (sheetId) {
        var values = fetchTransactionCsvValues_(config.spreadsheetId, sheetId);
        if (!values || values.length < 2) return;
        sources.push({
          label: config.label || '',
          values: values
        });
      });
    });

    return sources;
  }

  function fetchTransactionCsvValues_(spreadsheetId, sheetId) {
    if (!spreadsheetId || sheetId === null || sheetId === undefined || sheetId === '') return [];

    try {
      var response = UrlFetchApp.fetch(
        'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(String(spreadsheetId))
          + '/export?format=csv&gid=' + encodeURIComponent(String(sheetId)),
        {
          method: 'get',
          muteHttpExceptions: true,
          followRedirects: true
        }
      );

      var statusCode = response.getResponseCode();
      if (statusCode < 200 || statusCode >= 300) return [];

      var content = response.getContentText('UTF-8');
      if (!content) return [];
      return Utilities.parseCsv(content);
    } catch (error) {
      Logger.log('No fue posible descargar CSV transaccional ' + String(spreadsheetId) + '/' + String(sheetId) + ': ' + error.message);
      return [];
    }
  }

  function openConfiguredTransactionSheets_() {
    var configs = AppConfig.getCustomerTransactionSourceConfigs() || [];
    var sources = [];
    var seen = {};

    configs.forEach(function (config) {
      if (!config || !config.spreadsheetId) return;

      try {
        var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
        var candidates = [];
        var preferredSheetIds = Array.isArray(config.sheetIds) && config.sheetIds.length
          ? config.sheetIds.map(function (value) { return Number(value); }).filter(function (value) { return !isNaN(value); })
          : [];
        var preferredNames = Array.isArray(config.sheetNames) && config.sheetNames.length
          ? config.sheetNames
          : [];

        preferredSheetIds.forEach(function (sheetId) {
          spreadsheet.getSheets().forEach(function (sheet) {
            if (sheet && sheet.getSheetId() === sheetId) candidates.push(sheet);
          });
        });

        preferredNames.forEach(function (sheetName) {
          var sheet = spreadsheet.getSheetByName(sheetName);
          if (sheet) candidates.push(sheet);
        });

        if (!candidates.length) candidates = spreadsheet.getSheets();

        candidates.forEach(function (sheet) {
          if (!sheet || !isTransactionSheetCandidate_(sheet)) return;
          var key = config.spreadsheetId + ':' + String(sheet.getSheetId());
          if (seen[key]) return;
          seen[key] = true;
          sources.push({
            spreadsheetId: config.spreadsheetId,
            spreadsheetName: spreadsheet.getName(),
            sheet: sheet,
            label: config.label || spreadsheet.getName()
          });
        });
      } catch (error) {
        Logger.log('No fue posible abrir fuente transaccional configurada ' + String(config.spreadsheetId) + ': ' + error.message);
      }
    });

    return sources;
  }

  function findLatestTransactionDate_(transactionSources) {
    var latest = null;

    (transactionSources || []).forEach(function (source) {
      var values = source && source.values ? source.values : [];
      if (!values || values.length < 2) return;

      var headers = buildHeaders_(values[0], values[0].length);
      var dateIndex = resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, TRANSACTION_DATE_COLUMN_INDEX);

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var txDate = parseDateValue_(row[dateIndex]);
        if (!txDate) continue;
        if (!latest || txDate.getTime() > latest.getTime()) {
          latest = txDate;
        }
      }
    });

    return latest;
  }

  function isTransactionSheetCandidate_(sheet) {
    if (!sheet || sheet.getLastRow() < 2) return false;
    var headers = buildHeaders_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0], sheet.getLastColumn());
    if (resolveHeaderIndex_(headers, TRANSACTION_ID_HEADERS, -1) > -1
      && resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, -1) > -1
      && (
        resolveHeaderIndex_(headers, TRANSACTION_ABONO_HEADERS, -1) > -1
        || resolveHeaderIndex_(headers, TRANSACTION_CARGO_HEADERS, -1) > -1
      )) {
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
      var rewardsId = stringifyCell_(row[TRANSACTION_ID_COLUMN_INDEX]);
      var txDate = parseDateValue_(row[TRANSACTION_DATE_COLUMN_INDEX]);
      var abono = stringifyCell_(row[TRANSACTION_ABONO_COLUMN_INDEX]);
      var cargo = stringifyCell_(row[TRANSACTION_CARGO_COLUMN_INDEX]);

      if (!rewardsId) continue;
      if (!txDate) continue;
      if (abono || cargo) return true;
    }

    return false;
  }

  function resolveHeaderIndex_(headers, candidates, fallbackIndex) {
    var normalizedCandidates = candidates.map(function (item) { return normalizeHeader_(item); });
    for (var index = 0; index < headers.length; index += 1) {
      if (normalizedCandidates.indexOf(normalizeHeader_(headers[index])) > -1) return index;
    }
    return fallbackIndex;
  }

  function filterRowsByDateRange_(rows, startDate, endDate) {
    var startTime = Utils.startOfDay(startDate).getTime();
    var endTime = Utils.startOfDay(endDate).getTime();
    return rows.filter(function (item) {
      if (!item.openingDate) return false;
      var time = Utils.startOfDay(item.openingDate).getTime();
      return time >= startTime && time <= endTime;
    });
  }

  function filterRowsByYearMonth_(rows, year, month) {
    return rows.filter(function (item) {
      return item.openingDate
        && item.openingDate.getFullYear() === Number(year)
        && (item.openingDate.getMonth() + 1) === Number(month);
    });
  }

  function buildTrendSeries_(rows, startDate, endDate) {
    var grouped = Utils.groupBy(rows, function (item) {
      return formatDateOnly_(item.openingDate);
    });
    var series = [];
    var current = Utils.startOfDay(startDate);
    var last = Utils.startOfDay(endDate);

    while (current.getTime() <= last.getTime()) {
      var dateKey = formatDateOnly_(current);
      var dayRows = grouped[dateKey] || [];
      series.push({
        date: dateKey,
        accounts: dayRows.length
      });
      current = shiftDays_(current, 1);
    }

    return series;
  }

  function findTrendPeak_(series) {
    var peak = null;
    (series || []).forEach(function (item) {
      if (!peak || Number(item.accounts || 0) > Number(peak.accounts || 0)) {
        peak = item;
      }
    });
    return peak || { date: '', accounts: 0 };
  }

  function buildHeaders_(headerRow, length) {
    return Array.from({ length: length || 0 }, function (_, index) {
      var value = stringifyCell_(headerRow[index]);
      return value || ('COLUMN_' + (index + 1));
    });
  }

  function buildRowObject_(headers, rowValues) {
    return headers.reduce(function (acc, header, index) {
      acc[header] = rowValues[index];
      return acc;
    }, {});
  }

  function buildCsvFromObjects_(rows) {
    if (!rows || !rows.length) return '';

    var headers = Object.keys(rows[0]);
    var csvRows = [headers];
    rows.forEach(function (row) {
      csvRows.push(headers.map(function (header) {
        return row[header];
      }));
    });

    return csvRows.map(function (row) {
      return row.map(function (value) {
        return '"' + String(value === null || value === undefined ? '' : value).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\n');
  }

  function findProductAccounts_(productSummary, code) {
    var match = (productSummary || []).filter(function (item) { return item.productCode === code; })[0];
    return match ? match.accounts : 0;
  }

  function isAllowedProductStatus_(row) {
    return PRODUCT_ALLOWED_STATUSES.indexOf(normalizeStatus_(row.accountStatus)) > -1;
  }

  function sumBalance_(rows) {
    return (rows || []).reduce(function (acc, item) {
      return acc + Number(item.balance || 0);
    }, 0);
  }

  function calculateModeAgeFromRows_(rows) {
    var frequency = {};
    var maxCount = 0;
    var modeAge = null;

    (rows || []).forEach(function (item) {
      var ageValue = Number(item && item.age);
      if (!isFinite(ageValue)) return;
      if (ageValue < 0 || ageValue > 120) return;
      var normalizedAge = Math.round(ageValue);
      if (normalizedAge < 0 || normalizedAge > 120) return;

      var key = String(normalizedAge);
      frequency[key] = Number(frequency[key] || 0) + 1;

      if (frequency[key] > maxCount) {
        maxCount = frequency[key];
        modeAge = normalizedAge;
      } else if (frequency[key] === maxCount && modeAge !== null && normalizedAge < modeAge) {
        modeAge = normalizedAge;
      }
    });

    return modeAge;
  }

  function normalizeCode_(value) {
    var normalized = String(value || '').trim().toUpperCase()
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
    return normalized;
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
    return String(value || '').trim().toUpperCase();
  }

  function normalizeGender_(value) {
    var normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'M' || normalized === 'F') return normalized;
    return '';
  }

  function parseAgeValue_(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      return value >= 0 && value <= 120 ? round2_(value) : null;
    }

    var cleaned = String(value).trim();
    if (!cleaned) return null;
    if (/^\d{1,3}$/.test(cleaned)) {
      var numericAge = Number(cleaned);
      return numericAge >= 0 && numericAge <= 120 ? numericAge : null;
    }

    return calculateAge_(value);
  }

  function resolveProductLabel_(code) {
    var normalizedCode = normalizeCode_(code);
    var definition = PRODUCT_DEFINITIONS.filter(function (item) {
      return item.code === normalizedCode;
    })[0];
    return definition ? definition.label : (normalizedCode || 'Sin producto');
  }

  function stringifyCell_(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return Utils.formatDate(value, APP_CONSTANTS.DATE_FORMAT);
    return String(value).trim();
  }

  function hasPopulatedPlastic_(value) {
    return String(value === null || value === undefined ? '' : value).trim() !== '';
  }

  function hasRecentCardFlag_(value) {
    return String(value === null || value === undefined ? '' : value).trim().toUpperCase() === 'X';
  }

  function normalizeExportValue_(header, value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return formatDateOnly_(value);

    var normalizedHeader = String(header || '').trim().toUpperCase();
    if (normalizedHeader.indexOf('SALDO') > -1) {
      var parsed = parseNumericValue_(value);
      return parsed.valid ? formatCurrency_(parsed.value) : String(value);
    }
    return String(value).trim();
  }

  function isEmptyRow_(rowValues) {
    return !rowValues.some(function (cell) {
      return String(cell === null || cell === undefined ? '' : cell).trim() !== '';
    });
  }

  function parseNumericValue_(value) {
    if (value === null || value === undefined || value === '') {
      return { valid: true, value: 0 };
    }
    if (typeof value === 'number') {
      return { valid: !isNaN(value), value: Number(value || 0) };
    }

    var normalized = String(value)
      .trim()
      .replace(/\s+/g, '')
      .replace(/\$/g, '')
      .replace(/[^0-9,\.\-]/g, '');

    if (!normalized) return { valid: false, value: 0 };

    var hasComma = normalized.indexOf(',') > -1;
    var hasDot = normalized.indexOf('.') > -1;

    if (hasComma && hasDot) {
      if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
        normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
      } else {
        normalized = normalized.replace(/,/g, '');
      }
    } else if (hasComma) {
      normalized = normalized.replace(/,/g, '.');
    }

    var parsed = Number(normalized);
    return { valid: !isNaN(parsed), value: isNaN(parsed) ? 0 : parsed };
  }

  function sanitizeBalance_(value) {
    var parsed = parseNumericValue_(value);
    return parsed.valid ? round2_(parsed.value) : 0;
  }

  function calculateAge_(value) {
    var birthDate = parseBirthDate_(value);
    if (!birthDate) return null;

    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var monthDiff = today.getMonth() - birthDate.getMonth();
    var dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    if (age < 0 || age > 120) return null;
    return age;
  }

  function parseOpeningDate_(value) {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : Utils.startOfDay(value);

    var raw = String(value || '').trim();
    if (!raw) return null;
    var digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return null;

    var year = Number(digits.slice(0, 4));
    var month = Number(digits.slice(4, 6));
    var day = Number(digits.slice(6, 8));
    if (!year || !month || !day) return null;

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

  function parseBirthDate_(value) {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : stripTime_(value);
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'number' && !isNaN(value)) {
      var numericBirth = Math.round(Number(value));

      // YYYYMMDD numérico (ej. 19980704) en columna de nacimiento.
      if (numericBirth >= 19000101 && numericBirth <= 21001231) {
        return parseBirthDate_(String(numericBirth));
      }

      // Serie de fecha de Sheets/Excel (ej. 45232).
      if (numericBirth > 20000 && numericBirth < 90000) {
        return stripTime_(new Date(Math.round((numericBirth - 25569) * 86400 * 1000)));
      }
    }

    var raw = String(value || '').trim();
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
    } else {
      return parseDateValue_(raw);
    }

    if (!year || !month || !day) return null;

    var date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return stripTime_(date);
  }

  function formatCurrency_(value) {
    return '$' + round2_(value).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function round2_(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function parseDateValue_(value) {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return stripTime_(value);

    var text = String(value).trim();
    if (!text) return null;
    if (/^\d{8}$/.test(text)) {
      return safeDate_(Number(text.slice(0, 4)), Number(text.slice(4, 6)) - 1, Number(text.slice(6, 8)));
    }

    var normalized = text.replace(/\./g, '/').replace(/-/g, '/');
    var parts = normalized.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return safeDate_(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
      var day = Number(parts[0]);
      var month = Number(parts[1]) - 1;
      var year = Number(parts[2]);
      if (year < 100) year += 2000;
      return safeDate_(year, month, day);
    }

    var parsed = new Date(text);
    if (isNaN(parsed.getTime())) return null;
    return stripTime_(parsed);
  }

  function safeDate_(year, month, day) {
    var date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return stripTime_(date);
  }

  function stripTime_(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatDateOnly_(date) {
    return Utils.formatDate(date, APP_CONSTANTS.DATE_FORMAT);
  }

  function shiftDays_(date, delta) {
    var shifted = new Date(date);
    shifted.setDate(shifted.getDate() + Number(delta || 0));
    return Utils.startOfDay(shifted);
  }

  function buildMonthLabel_(year, month) {
    var safeMonth = Number(month || 1);
    var labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return (labels[safeMonth - 1] || 'Mes') + ' ' + String(year || '');
  }

  function buildMonthName_(month) {
    var safeMonth = Number(month || 1);
    var labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return labels[safeMonth - 1] || 'Mes';
  }

  function buildHistoricalMonthFileName_(year, month) {
    var safeYear = Number(year || 0);
    var safeMonth = Number(month || 0);
    var monthToken = safeMonth < 10 ? '0' + safeMonth : String(safeMonth);
    return 'historico_cuentas_' + safeYear + '_' + monthToken + '.csv';
  }

  function buildFirst30MonthFileName_(year, month) {
    var safeYear = Number(year || 0);
    var safeMonth = Number(month || 0);
    var monthToken = safeMonth < 10 ? '0' + safeMonth : String(safeMonth);
    return 'apertura_uso_first30_' + safeYear + '_' + monthToken + '.csv';
  }

  return {
    getDashboard: getDashboard,
    getHistorical: getHistorical,
    exportHistoricalMonth: exportHistoricalMonth,
    getFirst30Summary: getFirst30Summary,
    exportFirst30Month: exportFirst30Month,
    exportCardCoverage: exportCardCoverage
  };
})();
