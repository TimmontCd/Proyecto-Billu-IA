var DepositChargeCorrelationService = (function () {
  var SOURCE_CLIENTS_SHEET = 'Clientes';
  var SOURCE_TRANSACTIONS_LABEL = 'Transacciones 2026 (ene-mar)';
  var BALANCE_ID_HEADERS = ['ID CLIENTE', 'CLIENTE'];
  var BALANCE_AVERAGE_HEADERS = ['SALDO PROMEDIO', 'SALDO_PROMEDIO', 'PROMEDIO', 'AVG BALANCE'];
  var BALANCE_POINT_HEADERS = ['SALDO PUNTUAL', 'SALDO_PUNTUAL', 'SALDO FINAL', 'BALANCE'];
  var CACHE_KPI_SHEET = 'CorrelacionesKpiEjecutivo';
  var CACHE_OPENING_SHEET = 'CorrelacionesAperturaFirst30';
  var CACHE_STATE_SHEET = 'CorrelacionesPortafolioEstado';
  var CACHE_PRODUCT_SHEET = 'CorrelacionesPortafolioProducto';
  var CACHE_SIGNATURE_PROPERTY = 'DEPOSIT_CHARGE_V5_SIGNATURE';
  var CLIENT_ID_HEADERS = ['ID CLIENTE', 'CLIENTE'];
  var TRANSACTION_ID_HEADERS = ['ID CLIENTE', 'CLIENTE', 'ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA'];
  var OPEN_DATE_HEADERS = ['FECHA DE APERTURA', 'FECHA DE APERTURA CUENTA', 'FECHA_APERTURA_CUENTA'];
  var FIRST30_MIN_CARGOS = 3;
  var FIRST30_MIN_ABONOS = 1;
  var balanceSheetSnapshotCache_ = null;

  var KPI_HEADERS = ['metric', 'value', 'label'];
  var OPENING_HEADERS = [
    'idCliente',
    'fechaApertura',
    'estatusCuenta',
    'productoCuenta',
    'estado',
    'genero',
    'edad',
    'usedFirst30d',
    'first30TxCount',
    'first30AbonoCount',
    'first30CargoCount',
    'first30AbonoAmount',
    'first30CargoAmount',
    'first30NetAmount'
  ];
  var SEGMENT_HEADERS = ['segmento', 'clientes', 'clientesConUso', 'montoAbonos', 'montoCargos', 'saldoPromedio', 'saldoPuntual', 'tipo'];

  var QUERY_PRESETS = [
    {
      id: 'apertura_y_uso_first_30_dias',
      label: 'Apertura y uso First 30 dias',
      description: 'Clientes abiertos en los ultimos 30 dias y su uso transaccional dentro de sus primeros 30 dias.'
    }
  ];

  function getModuleDashboard() {
    var cache = getDashboardCache_();
    if (!cache) return rebuildFromSources_();
    return buildDashboardFromCache_(cache);
  }

  function rebuildSummaryFromRaw() {
    return rebuildFromSources_();
  }

  function rebuildSummaryFromManual() {
    return rebuildFromSources_();
  }

  function rebuildSummaryFromSheet() {
    return rebuildFromSources_();
  }

  function replaceDatasetFromSheet() {
    return rebuildFromSources_();
  }

  function ingestMonthlySheet() {
    return rebuildFromSources_();
  }

  function getQueryPresetCatalog() {
    return QUERY_PRESETS.map(function (item) {
      return {
        id: item.id,
        label: item.label,
        description: item.description
      };
    });
  }

  function runPresetQuery(payload) {
    var resolved = resolveOpeningPresetCache_(payload);
    var cache = resolved.cache;
    var preset = resolved.preset;
    if (!cache) {
      throw new Error('No fue posible preparar la base ejecutiva.');
    }

    var rows = cache.openingRows.slice();
    var matched = rows.filter(function (item) { return item.usedFirst30d; }).length;
    var abonoTotal = sumMetric_(rows, 'first30AbonoAmount');
    var cargoTotal = sumMetric_(rows, 'first30CargoAmount');
    var uniqueClients = rows.length;

    return {
      presetId: preset.id,
      presetLabel: preset.label,
      presetDescription: preset.description,
      executiveSummary: rows.length
        ? 'Se identificaron ' + rows.length + ' clientes abiertos en los ultimos 30 dias. '
          + matched + ' cumplieron la regla de activacion en sus primeros 30 dias.'
        : 'No hay clientes abiertos en los ultimos 30 dias dentro de las hojas fuente.',
      note: rows.length
        ? 'La columna usedFirst30d marca si el cliente logro al menos ' + FIRST30_MIN_CARGOS + ' cargos y ' + FIRST30_MIN_ABONOS + ' abono dentro de sus primeros 30 dias.'
        : 'Verifica que la hoja Clientes tenga fecha de apertura poblada y que las hojas transaccionales de enero, febrero y marzo de 2026 contengan movimientos del mismo ID CLIENTE.',
      totalMatches: rows.length,
      uniqueClients: uniqueClients,
      abonoTotal: round2_(abonoTotal),
      cargoTotal: round2_(cargoTotal),
      netTotal: round2_(abonoTotal - cargoTotal),
      referenceDate: cache.referenceDate
    };
  }

  function exportPresetClientNumbers(payload) {
    var resolved = resolveOpeningPresetCache_(payload);
    var cache = resolved.cache;
    var preset = resolved.preset;
    var filter = String((payload && payload.filter) || 'all').toLowerCase();
    if (!cache) {
      throw new Error('No fue posible preparar la exportacion de la cohorte.');
    }

    var rows = (cache.openingRows || []).filter(function (item) {
      if (filter === 'qualified') return item.usedFirst30d;
      if (filter === 'unqualified') return !item.usedFirst30d;
      return true;
    });

    var suffix = 'clientes';
    if (filter === 'qualified') suffix = 'cumplen_regla';
    if (filter === 'unqualified') suffix = 'no_cumplen_regla';

    return {
      presetId: preset.id,
      presetLabel: preset.label,
      fileName: preset.id + '_' + suffix + '.csv',
      clientNumbers: rows.map(function (item) {
        return cleanId_(item.idCliente);
      }).filter(String)
    };
  }

  function getClientView(payload) {
    payload = payload || {};
    var idCliente = cleanId_(payload.clientNumber || payload.idCliente);
    if (!idCliente) throw new Error('Captura un ID CLIENTE.');

    var profile = readClientProfileFromSources_(idCliente);
    if (!profile) throw new Error('No se encontro informacion para ese ID CLIENTE.');

    return {
      clientNumber: idCliente,
      profile: {
        idCliente: profile.idCliente,
        estatusCuenta: profile.estatusCuenta,
        fechaApertura: profile.fechaApertura,
        cuenta: profile.cuenta,
        productoCuenta: profile.productoCuenta,
        estado: profile.estado,
        genero: profile.genero,
        edad: profile.edad,
        depositAmountTotal: round2_(profile.abonoAmount),
        chargeAmountTotal: round2_(profile.cargoAmount),
        netTotal: round2_(profile.netAmount),
        depositCountTotal: profile.abonoCount,
        chargeCountTotal: profile.cargoCount,
        monthsActive: profile.txCount > 0 ? 1 : 0,
        avgBalance: round2_(profile.avgBalance),
        pointBalance: round2_(profile.pointBalance),
        behaviorClass: classifyClientBehavior_(profile),
        openedLast30d: profile.openedLast30d,
        usedFirst30d: profile.usedFirst30d,
        first30NetAmount: round2_(profile.first30NetAmount)
      },
      executiveSummary: buildClientExecutiveSummary_(profile, profile.txCount),
      monthlySeries: [
        {
          periodo: SOURCE_TRANSACTIONS_LABEL,
          numeroMovimientos: profile.txCount,
          numeroAbonos: profile.abonoCount,
          numeroCargos: profile.cargoCount,
          montoAbonos: round2_(profile.abonoAmount),
          montoCargos: round2_(profile.cargoAmount),
          neto: round2_(profile.netAmount)
        }
      ],
      downloadClientNumbers: [idCliente]
    };
  }

  function rebuildFromSources_() {
    var artifacts = buildExecutiveArtifactsFromSources_();
    if (!artifacts.ready) return artifacts;
    writeExecutiveCache_(artifacts.cache);
    return buildDashboardFromCache_(artifacts.cache);
  }

  function buildExecutiveArtifactsFromSources_() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var clientsSheet = spreadsheet.getSheetByName(SOURCE_CLIENTS_SHEET);
    var transactionSources = getTransactionSources_();
    var balanceMap = readBalanceSheetAsMap_();

    if (!clientsSheet || clientsSheet.getLastRow() < 2) {
      return buildMissingSourceResponse_('No se encontro la hoja fuente "Clientes" o esta vacia.');
    }
    if (!transactionSources.length) {
      return buildMissingSourceResponse_('No se encontro ninguna hoja valida de transacciones en las fuentes configuradas.');
    }

    var clientMap = readClientsAsMap_(clientsSheet);
    var clientAliasMap = buildClientAliasMap_(clientMap);
    var summaryMap = {};

    Object.keys(clientMap).forEach(function (idCliente) {
      summaryMap[idCliente] = buildEmptyClientSummary_(clientMap[idCliente], getBalanceSnapshotFromMap_(balanceMap, idCliente));
    });

    var referenceDate = null;

    transactionSources.forEach(function (transactionSource) {
      scanSheet_(transactionSource.sheet, function (row, indexMap) {
        var rawClientId = cleanId_(getValue_(row, indexMap, TRANSACTION_ID_HEADERS));
        if (!rawClientId) return;
        var idCliente = resolveClientIdForJoin_(rawClientId, clientMap, clientAliasMap);

        if (!summaryMap[idCliente]) {
          summaryMap[idCliente] = buildEmptyClientSummary_({
            idCliente: idCliente,
            estatusCuenta: 'SIN_CLIENTE',
            fechaApertura: '',
            cuenta: '',
            productoCuenta: '',
            estado: '',
            genero: '',
            edad: ''
          }, getBalanceSnapshotFromMap_(balanceMap, idCliente));
        }

        var item = summaryMap[idCliente];
        var fecha = parseDateValue_(getValue_(row, indexMap, ['FECHA PROCESO']));
        var abono = toNumber_(getValue_(row, indexMap, ['ABONO']));
        var cargo = toNumber_(getValue_(row, indexMap, ['CARGO']));

        if (fecha && (!referenceDate || fecha.getTime() > referenceDate.getTime())) {
          referenceDate = fecha;
        }

        item.txCount += 1;
        item.netAmount += abono - cargo;

        if (abono > 0) {
          item.abonoCount += 1;
          item.abonoAmount += abono;
        }
        if (cargo > 0) {
          item.cargoCount += 1;
          item.cargoAmount += cargo;
        }

        if (fecha) {
          if (!item._firstTxDate || fecha.getTime() < item._firstTxDate.getTime()) item._firstTxDate = fecha;
          if (!item._lastTxDate || fecha.getTime() > item._lastTxDate.getTime()) item._lastTxDate = fecha;
        }

        if (fecha && item._fechaAperturaDate) {
          var diff = diffDaysBetweenDates_(item._fechaAperturaDate, fecha);
          if (diff >= 0 && diff <= 29) {
            item.first30TxCount += 1;
            item.first30NetAmount += abono - cargo;
            if (abono > 0) {
              item.first30AbonoCount += 1;
              item.first30AbonoAmount += abono;
            }
            if (cargo > 0) {
              item.first30CargoCount += 1;
              item.first30CargoAmount += cargo;
            }
          }
        }
      });
    });

    if (!referenceDate) {
      referenceDate = new Date();
    }

    var clientRows = Object.keys(summaryMap).map(function (idCliente) {
      return finalizeClientSummary_(summaryMap[idCliente], referenceDate);
    }).sort(function (a, b) {
      return String(a.idCliente).localeCompare(String(b.idCliente));
    });

    var openingRows = clientRows.filter(function (item) {
      return item.openedLast30d;
    }).map(function (item) {
      return {
        idCliente: item.idCliente,
        fechaApertura: item.fechaApertura,
        estatusCuenta: item.estatusCuenta,
        productoCuenta: item.productoCuenta,
        estado: item.estado,
        genero: item.genero,
        edad: item.edad,
        usedFirst30d: item.usedFirst30d,
        first30TxCount: item.first30TxCount,
        first30AbonoCount: item.first30AbonoCount,
        first30CargoCount: item.first30CargoCount,
        first30AbonoAmount: item.first30AbonoAmount,
        first30CargoAmount: item.first30CargoAmount,
        first30NetAmount: item.first30NetAmount
      };
    }).sort(function (a, b) {
      return String(b.fechaApertura).localeCompare(String(a.fechaApertura));
    });

    var kpis = buildExecutiveKpis_(clientRows, openingRows, referenceDate);
    var activeClients = clientRows.filter(function (item) {
      return isActiveStatus_(item.estatusCuenta);
    });
    var portfolioByState = buildPortfolioByField_(activeClients, 'estado', 'Estado');
    var portfolioByProduct = buildPortfolioByField_(activeClients, 'productoCuenta', 'Producto');
    var cache = {
      signature: buildSourceSignature_(clientsSheet, transactionSources),
      referenceDate: formatDate_(referenceDate),
      kpis: kpis,
      openingRows: openingRows,
      portfolioByState: portfolioByState,
      portfolioByProduct: portfolioByProduct,
      sourceSheets: transactionSources.map(function (item) { return item.displayLabel; })
    };

    return {
      ready: true,
      cache: cache
    };
  }

  function buildExecutiveKpis_(clientRows, openingRows, referenceDate) {
    var activeClients = clientRows.filter(function (item) {
      return isActiveStatus_(item.estatusCuenta);
    });
    var activeClientsWithUsage = activeClients.filter(function (item) {
      return item.txCount > 0;
    });
    var openingUsed = openingRows.filter(function (item) {
      return item.usedFirst30d;
    });
    var activationRate = openingRows.length ? round2_((openingUsed.length / openingRows.length) * 100) : 0;

    return [
      { metric: 'reference_date', value: formatDate_(referenceDate), label: 'Fecha de corte' },
      { metric: 'active_clients', value: activeClients.length, label: 'Clientes activos' },
      { metric: 'active_clients_with_usage', value: activeClientsWithUsage.length, label: 'Clientes activos con movimientos' },
      { metric: 'active_average_balance', value: round2_(sumMetric_(activeClients, 'avgBalance')), label: 'Saldo promedio agregado' },
      { metric: 'active_point_balance', value: round2_(sumMetric_(activeClients, 'pointBalance')), label: 'Saldo puntual agregado' },
      { metric: 'active_abono_volume', value: sumMetric_(activeClients, 'abonoCount'), label: 'Volumen de abonos' },
      { metric: 'active_cargo_volume', value: sumMetric_(activeClients, 'cargoCount'), label: 'Volumen de cargos' },
      { metric: 'active_abono_amount', value: round2_(sumMetric_(activeClients, 'abonoAmount')), label: 'Monto total de abonos' },
      { metric: 'active_cargo_amount', value: round2_(sumMetric_(activeClients, 'cargoAmount')), label: 'Monto total de cargos' },
      { metric: 'active_net_amount', value: round2_(sumMetric_(activeClients, 'netAmount')), label: 'Flujo neto portafolio activo' },
      { metric: 'opening_last30_clients', value: openingRows.length, label: 'Clientes abiertos ultimos 30 dias' },
      { metric: 'opening_last30_used_clients', value: openingUsed.length, label: 'Clientes que cumplen regla First 30' },
      { metric: 'opening_last30_activation_rate', value: activationRate, label: 'Activacion First 30 dias (%)' }
    ];
  }

  function buildDashboardFromCache_(cache) {
    var kpis = mapKpis_(cache.kpis);
    kpis.reference_date = formatDate_(kpis.reference_date);

    return {
      ready: true,
      kpis: kpis,
      executiveSummary: buildExecutiveSummary_(kpis),
      portfolioByState: cache.portfolioByState || [],
      portfolioByProduct: cache.portfolioByProduct || [],
      openingPreview: cache.openingRows.slice(0, 20),
      queryPresets: getQueryPresetCatalog(),
      queryPresetNote: 'La funcionalidad disponible hoy se enfoca en activacion temprana: Apertura y uso First 30 dias.',
      referenceDate: cache.referenceDate,
      availableMonths: cache.sourceSheets || [SOURCE_TRANSACTIONS_LABEL]
    };
  }

  function getDashboardCache_() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var clientsSheet = spreadsheet.getSheetByName(SOURCE_CLIENTS_SHEET);
    var transactionSources = getTransactionSources_();
    if (!clientsSheet || !transactionSources.length || clientsSheet.getLastRow() < 2) return null;

    var signature = buildSourceSignature_(clientsSheet, transactionSources);
    if (PropertiesService.getScriptProperties().getProperty(CACHE_SIGNATURE_PROPERTY) !== signature) return null;

    var kpis = readSheetObjects_(CACHE_KPI_SHEET, KPI_HEADERS);
    var openingRows = readSheetObjects_(CACHE_OPENING_SHEET, OPENING_HEADERS);
    var portfolioByState = readSheetObjects_(CACHE_STATE_SHEET, SEGMENT_HEADERS);
    var portfolioByProduct = readSheetObjects_(CACHE_PRODUCT_SHEET, SEGMENT_HEADERS);
    if (!kpis.length) return null;

    openingRows = openingRows.map(normalizeOpeningCacheRow_);
    portfolioByState = portfolioByState.map(normalizeSegmentRow_);
    portfolioByProduct = portfolioByProduct.map(normalizeSegmentRow_);

    return {
      signature: signature,
      referenceDate: formatDate_(mapKpis_(kpis).reference_date || ''),
      kpis: kpis,
      openingRows: openingRows,
      portfolioByState: portfolioByState,
      portfolioByProduct: portfolioByProduct,
      sourceSheets: transactionSources.map(function (item) { return item.displayLabel; })
    };
  }

  function writeExecutiveCache_(cache) {
    writeSheetObjects_(CACHE_KPI_SHEET, KPI_HEADERS, cache.kpis);
    writeSheetObjects_(CACHE_OPENING_SHEET, OPENING_HEADERS, cache.openingRows);
    writeSheetObjects_(CACHE_STATE_SHEET, SEGMENT_HEADERS, cache.portfolioByState || []);
    writeSheetObjects_(CACHE_PRODUCT_SHEET, SEGMENT_HEADERS, cache.portfolioByProduct || []);
    PropertiesService.getScriptProperties().setProperty(CACHE_SIGNATURE_PROPERTY, cache.signature);
  }

  function getOpeningQueryCache_() {
    var dashboardCache = getDashboardCache_();
    if (!dashboardCache) return null;
    return {
      referenceDate: dashboardCache.referenceDate,
      openingRows: dashboardCache.openingRows || []
    };
  }

  function resolveOpeningPresetCache_(payload) {
    payload = payload || {};
    var presetId = String(payload.presetId || QUERY_PRESETS[0].id);
    if (presetId !== QUERY_PRESETS[0].id) {
      throw new Error('La correlacion solicitada no existe en esta version.');
    }

    var cache = getOpeningQueryCache_();
    if (!cache) {
      rebuildFromSources_();
      cache = getOpeningQueryCache_();
    }

    return {
      preset: QUERY_PRESETS[0],
      cache: cache
    };
  }

  function getClientProfileCacheById_(idCliente) {
    return null;
  }

  function readClientProfileFromSources_(idCliente) {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var clientsSheet = spreadsheet.getSheetByName(SOURCE_CLIENTS_SHEET);
    var transactionSources = getTransactionSources_();
    if (!clientsSheet || !transactionSources.length || clientsSheet.getLastRow() < 2) return null;

    var clientRow = findRowById_(clientsSheet, idCliente, ['ID CLIENTE']);
    if (!clientRow) return null;

    var clientProfile = buildEmptyClientSummary_({
      idCliente: idCliente,
      estatusCuenta: cleanText_(getValue_(clientRow.row, clientRow.indexMap, ['ESTATUS DE LA CUENTA'])),
      fechaApertura: formatDate_(parseDateValue_(getValue_(clientRow.row, clientRow.indexMap, OPEN_DATE_HEADERS))),
      cuenta: cleanText_(getValue_(clientRow.row, clientRow.indexMap, ['CUENTA'])),
      productoCuenta: cleanText_(getValue_(clientRow.row, clientRow.indexMap, ['PRODUCTO DE LA CUENTA'])),
      estado: cleanText_(getValue_(clientRow.row, clientRow.indexMap, ['ESTADO'])),
      genero: cleanText_(getValue_(clientRow.row, clientRow.indexMap, ['GENERO'])),
      edad: getValue_(clientRow.row, clientRow.indexMap, ['EDAD'])
    });
    var balances = readBalanceSnapshotById_(idCliente);
    clientProfile.avgBalance = round2_(balances.avgBalance);
    clientProfile.pointBalance = round2_(balances.pointBalance);

    var latestDate = getLatestTransactionDate_(transactionSources);
    var transactionRows = [];
    transactionSources.forEach(function (source) {
      var exactMatches = findRowsById_(source.sheet, idCliente, TRANSACTION_ID_HEADERS);
      if (exactMatches.length) {
        transactionRows = transactionRows.concat(exactMatches);
        return;
      }
      transactionRows = transactionRows.concat(findRowsByJoinKey_(source.sheet, idCliente, TRANSACTION_ID_HEADERS));
    });
    if (!transactionRows.length) {
      return finalizeClientSummary_(clientProfile, latestDate || new Date());
    }

    transactionRows.forEach(function (item) {
      var row = item.row;
      var indexMap = item.indexMap;
      var fecha = parseDateValue_(getValue_(row, indexMap, ['FECHA PROCESO']));
      var abono = toNumber_(getValue_(row, indexMap, ['ABONO']));
      var cargo = toNumber_(getValue_(row, indexMap, ['CARGO']));

      clientProfile.txCount += 1;
      clientProfile.netAmount += abono - cargo;
      if (abono > 0) {
        clientProfile.abonoCount += 1;
        clientProfile.abonoAmount += abono;
      }
      if (cargo > 0) {
        clientProfile.cargoCount += 1;
        clientProfile.cargoAmount += cargo;
      }

      if (fecha) {
        if (!clientProfile._firstTxDate || fecha.getTime() < clientProfile._firstTxDate.getTime()) clientProfile._firstTxDate = fecha;
        if (!clientProfile._lastTxDate || fecha.getTime() > clientProfile._lastTxDate.getTime()) clientProfile._lastTxDate = fecha;
      }

      if (fecha && clientProfile._fechaAperturaDate) {
        var diff = diffDaysBetweenDates_(clientProfile._fechaAperturaDate, fecha);
        if (diff >= 0 && diff <= 29) {
          clientProfile.first30TxCount += 1;
          clientProfile.first30NetAmount += abono - cargo;
          if (abono > 0) {
            clientProfile.first30AbonoCount += 1;
            clientProfile.first30AbonoAmount += abono;
          }
          if (cargo > 0) {
            clientProfile.first30CargoCount += 1;
            clientProfile.first30CargoAmount += cargo;
          }
        }
      }
    });

    return finalizeClientSummary_(clientProfile, latestDate || new Date());
  }

  function readClientsAsMap_(sheet) {
    var map = {};
    scanSheet_(sheet, function (row, indexMap) {
      var idCliente = cleanId_(getValue_(row, indexMap, ['ID CLIENTE']));
      if (!idCliente) return;
      map[idCliente] = {
        idCliente: idCliente,
        estatusCuenta: cleanText_(getValue_(row, indexMap, ['ESTATUS DE LA CUENTA'])),
        fechaApertura: formatDate_(parseDateValue_(getValue_(row, indexMap, OPEN_DATE_HEADERS))),
        cuenta: cleanText_(getValue_(row, indexMap, ['CUENTA'])),
        productoCuenta: cleanText_(getValue_(row, indexMap, ['PRODUCTO DE LA CUENTA'])),
        estado: cleanText_(getValue_(row, indexMap, ['ESTADO'])),
        genero: cleanText_(getValue_(row, indexMap, ['GENERO'])),
        edad: getValue_(row, indexMap, ['EDAD'])
      };
    });
    return map;
  }

  function buildClientAliasMap_(clientMap) {
    var aliasGroups = {};
    Object.keys(clientMap || {}).forEach(function (idCliente) {
      var keys = buildClientJoinKeys_(idCliente);
      keys.forEach(function (key) {
        if (!aliasGroups[key]) aliasGroups[key] = [];
        aliasGroups[key].push(idCliente);
      });
    });

    return Object.keys(aliasGroups).reduce(function (acc, key) {
      if (aliasGroups[key].length === 1) {
        acc[key] = aliasGroups[key][0];
      }
      return acc;
    }, {});
  }

  function resolveClientIdForJoin_(rawClientId, clientMap, clientAliasMap) {
    var exact = cleanId_(rawClientId);
    if (clientMap && clientMap[exact]) return exact;

    var keys = buildClientJoinKeys_(rawClientId);
    for (var index = 0; index < keys.length; index += 1) {
      var key = keys[index];
      if (clientAliasMap && clientAliasMap[key]) return clientAliasMap[key];
    }
    return exact;
  }

  function buildPortfolioByField_(rows, field, label) {
    var grouped = {};
    rows.forEach(function (item) {
      var key = cleanText_(item[field]) || 'SIN_DATO';
      if (!grouped[key]) {
        grouped[key] = {
          segmento: key,
          clientes: 0,
          clientesConUso: 0,
          montoAbonos: 0,
          montoCargos: 0,
          saldoPromedio: 0,
          saldoPuntual: 0
        };
      }
      grouped[key].clientes += 1;
      if (item.txCount > 0) grouped[key].clientesConUso += 1;
      grouped[key].montoAbonos += Number(item.abonoAmount || 0);
      grouped[key].montoCargos += Number(item.cargoAmount || 0);
      grouped[key].saldoPromedio += Number(item.avgBalance || 0);
      grouped[key].saldoPuntual += Number(item.pointBalance || 0);
    });
    return Object.keys(grouped).map(function (key) {
      var item = grouped[key];
      item.montoAbonos = round2_(item.montoAbonos);
      item.montoCargos = round2_(item.montoCargos);
      item.saldoPromedio = round2_(item.saldoPromedio);
      item.saldoPuntual = round2_(item.saldoPuntual);
      item.tipo = label;
      return item;
    }).sort(function (a, b) {
      return b.clientes - a.clientes;
    }).slice(0, 8);
  }

  function buildExecutiveSummary_(kpis) {
    return 'Hoy el portafolio activo suma ' + Number(kpis.active_clients || 0).toLocaleString('es-MX')
      + ' clientes. De ellos, ' + Number(kpis.active_clients_with_usage || 0).toLocaleString('es-MX')
      + ' tuvieron movimiento en la hoja de transacciones. El monto agregado de abonos es '
      + formatMoney_(kpis.active_abono_amount || 0) + ' y el de cargos es '
      + formatMoney_(kpis.active_cargo_amount || 0) + '. El saldo promedio agregado es '
      + formatMoney_(kpis.active_average_balance || 0) + ' y el saldo puntual agregado es '
      + formatMoney_(kpis.active_point_balance || 0) + '. La cohorte de apertura reciente incluye '
      + Number(kpis.opening_last30_clients || 0).toLocaleString('es-MX') + ' clientes, con una activacion First 30 dias de '
      + Number(kpis.opening_last30_activation_rate || 0).toLocaleString('es-MX') + '%.';
  }

  function buildClientExecutiveSummary_(profile, transactionCount) {
    return 'El cliente ' + profile.idCliente + ' presenta ' + transactionCount + ' movimientos en '
      + SOURCE_TRANSACTIONS_LABEL + '. Acumula ' + formatMoney_(profile.abonoAmount) + ' en abonos y '
      + formatMoney_(profile.cargoAmount) + ' en cargos. Su estatus de cuenta es '
      + (profile.estatusCuenta || 'N/D')
      + buildBalanceSummarySegment_(profile)
      + ' y su comportamiento actual se clasifica como '
      + classifyClientBehavior_(profile) + '.';
  }

  function buildBalanceSummarySegment_(profile) {
    var average = Number(profile.avgBalance || 0);
    var point = Number(profile.pointBalance || 0);
    if (!average && !point) return '';
    return '. Reporta saldo promedio de ' + formatMoney_(average)
      + ' y saldo puntual de ' + formatMoney_(point);
  }

  function classifyClientBehavior_(profile) {
    if (profile.txCount === 0) return 'SIN_USO';
    if (profile.abonoAmount > 0 && profile.cargoAmount === 0) return 'SOLO_FONDEO';
    if (profile.cargoAmount > profile.abonoAmount) return 'USO_INTENSO';
    if (profile.usedFirst30d) return 'ACTIVADO_FIRST_30';
    return 'USO_MIXTO';
  }

  function buildMissingSourceResponse_(message) {
    return {
      ready: false,
      message: message,
      queryPresets: getQueryPresetCatalog(),
      queryPresetNote: 'El modulo ahora depende de la hoja Clientes y de las hojas transaccionales consolidadas de enero, febrero y marzo de 2026.'
    };
  }

  function buildEmptyClientSummary_(client, balanceSnapshot) {
    var fechaAperturaDate = parseDateValue_(client.fechaApertura);
    balanceSnapshot = balanceSnapshot || {};
    return {
      idCliente: cleanId_(client.idCliente),
      estatusCuenta: cleanText_(client.estatusCuenta),
      fechaApertura: client.fechaApertura || '',
      cuenta: cleanText_(client.cuenta),
      productoCuenta: cleanText_(client.productoCuenta),
      estado: cleanText_(client.estado),
      genero: cleanText_(client.genero),
      edad: client.edad === undefined || client.edad === null ? '' : client.edad,
      txCount: 0,
      abonoCount: 0,
      cargoCount: 0,
      abonoAmount: 0,
      cargoAmount: 0,
      netAmount: 0,
      avgBalance: round2_(balanceSnapshot.avgBalance),
      pointBalance: round2_(balanceSnapshot.pointBalance),
      first30TxCount: 0,
      first30AbonoCount: 0,
      first30CargoCount: 0,
      first30AbonoAmount: 0,
      first30CargoAmount: 0,
      first30NetAmount: 0,
      _fechaAperturaDate: fechaAperturaDate,
      _firstTxDate: null,
      _lastTxDate: null
    };
  }

  function finalizeClientSummary_(item, referenceDate) {
    return {
      idCliente: item.idCliente,
      estatusCuenta: item.estatusCuenta,
      fechaApertura: item.fechaApertura,
      cuenta: item.cuenta,
      productoCuenta: item.productoCuenta,
      estado: item.estado,
      genero: item.genero,
      edad: item.edad,
      txCount: item.txCount,
      abonoCount: item.abonoCount,
      cargoCount: item.cargoCount,
      abonoAmount: round2_(item.abonoAmount),
      cargoAmount: round2_(item.cargoAmount),
      netAmount: round2_(item.netAmount),
      firstTxDate: formatDate_(item._firstTxDate),
      lastTxDate: formatDate_(item._lastTxDate),
      openedLast30d: isOpenedLast30Days_(item._fechaAperturaDate, referenceDate),
      usedFirst30d: qualifiesFirst30Usage_(item),
      first30TxCount: item.first30TxCount,
      first30AbonoCount: item.first30AbonoCount,
      first30CargoCount: item.first30CargoCount,
      first30AbonoAmount: round2_(item.first30AbonoAmount),
      first30CargoAmount: round2_(item.first30CargoAmount),
      first30NetAmount: round2_(item.first30NetAmount),
      avgBalance: round2_(item.avgBalance),
      pointBalance: round2_(item.pointBalance)
    };
  }

  function readBalanceSnapshotById_(idCliente) {
    return getBalanceSnapshotFromMap_(readBalanceSheetAsMap_(), idCliente);
  }

  function readBalanceSheetAsMap_() {
    return getBalanceSheetSnapshot_().map;
  }

  function getBalanceSnapshotFromMap_(balanceMap, idCliente) {
    var exactId = cleanId_(idCliente);
    if (!balanceMap) return { avgBalance: 0, pointBalance: 0 };
    if (balanceMap[exactId]) return balanceMap[exactId];

    var joinKeys = buildClientJoinKeys_(idCliente);
    for (var index = 0; index < joinKeys.length; index += 1) {
      if (balanceMap[joinKeys[index]]) return balanceMap[joinKeys[index]];
    }
    return { avgBalance: 0, pointBalance: 0 };
  }

  function getBalanceSheetSnapshot_() {
    if (balanceSheetSnapshotCache_) return balanceSheetSnapshotCache_;

    var emptySnapshot = {
      map: {},
      signature: 'NO_BALANCE_SOURCE'
    };

    try {
      var spreadsheetId = AppConfig.getClientBalanceSpreadsheetId();
      if (!spreadsheetId) {
        balanceSheetSnapshotCache_ = emptySnapshot;
        return balanceSheetSnapshotCache_;
      }

      var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      var configuredName = cleanText_(AppConfig.getClientBalanceSheetName());
      var sheet = configuredName
        ? spreadsheet.getSheetByName(configuredName)
        : spreadsheet.getSheets()[0];
      if (!sheet || sheet.getLastRow() < 2) {
        balanceSheetSnapshotCache_ = {
          map: {},
          signature: configuredName ? ('NO_BALANCE_SHEET:' + configuredName) : 'NO_BALANCE_SHEET'
        };
        return balanceSheetSnapshotCache_;
      }

      var map = {};
      var signatureRows = [];
      scanSheet_(sheet, function (row, indexMap) {
        var rawId = getValue_(row, indexMap, BALANCE_ID_HEADERS);
        var idCliente = cleanId_(rawId);
        if (!idCliente) return;

        var snapshot = {
          avgBalance: round2_(toNumber_(getValue_(row, indexMap, BALANCE_AVERAGE_HEADERS))),
          pointBalance: round2_(toNumber_(getValue_(row, indexMap, BALANCE_POINT_HEADERS)))
        };

        map[idCliente] = snapshot;
        buildClientJoinKeys_(rawId).forEach(function (key) {
          map[key] = snapshot;
        });

        signatureRows.push([
          idCliente,
          snapshot.avgBalance,
          snapshot.pointBalance
        ].join('|'));
      });

      balanceSheetSnapshotCache_ = {
        map: map,
        signature: [
          spreadsheetId,
          normalizeText_(sheet.getName()),
          sheet.getLastRow(),
          sheet.getLastColumn(),
          digestText_(signatureRows.sort().join('\n'))
        ].join(':')
      };
      return balanceSheetSnapshotCache_;
    } catch (error) {
      balanceSheetSnapshotCache_ = {
        map: {},
        signature: 'BALANCE_SOURCE_ERROR'
      };
      return balanceSheetSnapshotCache_;
    }
  }

  function normalizeOpeningCacheRow_(row) {
    row.usedFirst30d = toBoolean_(row.usedFirst30d);
    row.first30TxCount = toNumber_(row.first30TxCount);
    row.first30AbonoCount = toNumber_(row.first30AbonoCount);
    row.first30CargoCount = toNumber_(row.first30CargoCount);
    row.first30AbonoAmount = round2_(toNumber_(row.first30AbonoAmount));
    row.first30CargoAmount = round2_(toNumber_(row.first30CargoAmount));
    row.first30NetAmount = round2_(toNumber_(row.first30NetAmount));
    return row;
  }

  function qualifiesFirst30Usage_(item) {
    return Number(item.first30CargoCount || 0) >= FIRST30_MIN_CARGOS
      && Number(item.first30AbonoCount || 0) >= FIRST30_MIN_ABONOS;
  }

  function normalizeSegmentRow_(row) {
    row.clientes = toNumber_(row.clientes);
    row.clientesConUso = toNumber_(row.clientesConUso);
    row.montoAbonos = round2_(toNumber_(row.montoAbonos));
    row.montoCargos = round2_(toNumber_(row.montoCargos));
    row.saldoPromedio = round2_(toNumber_(row.saldoPromedio));
    row.saldoPuntual = round2_(toNumber_(row.saldoPuntual));
    return row;
  }

  function findRowById_(sheet, idCliente, headerName) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var indexMap = buildIndexMap_(headers);
    var columnIndex = findColumnIndex_(indexMap, headerName);
    if (columnIndex === undefined || sheet.getLastRow() < 2) return null;
    var range = sheet.getRange(2, columnIndex + 1, sheet.getLastRow() - 1, 1);
    var found = range.createTextFinder(String(idCliente)).matchEntireCell(true).findNext();
    if (!found) return null;
    var row = sheet.getRange(found.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
    return { row: row, indexMap: indexMap };
  }

  function findRowsById_(sheet, idCliente, headerName) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var indexMap = buildIndexMap_(headers);
    var columnIndex = findColumnIndex_(indexMap, headerName);
    if (columnIndex === undefined || sheet.getLastRow() < 2) return [];
    var range = sheet.getRange(2, columnIndex + 1, sheet.getLastRow() - 1, 1);
    var matches = range.createTextFinder(String(idCliente)).matchEntireCell(true).findAll();
    return matches.map(function (match) {
      return {
        row: sheet.getRange(match.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0],
        indexMap: indexMap
      };
    });
  }

  function findRowsByJoinKey_(sheet, idCliente, headerCandidates) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var indexMap = buildIndexMap_(headers);
    var columnIndex = findColumnIndex_(indexMap, headerCandidates);
    if (columnIndex === undefined || sheet.getLastRow() < 2) return [];

    var wantedKeys = buildClientJoinKeys_(idCliente);
    if (!wantedKeys.length) return [];

    var matches = [];
    scanSheet_(sheet, function (row, rowIndexMap) {
      var rawValue = row[columnIndex];
      var rowKeys = buildClientJoinKeys_(rawValue);
      for (var index = 0; index < rowKeys.length; index += 1) {
        if (wantedKeys.indexOf(rowKeys[index]) !== -1) {
          matches.push({
            row: row,
            indexMap: rowIndexMap
          });
          break;
        }
      }
    });
    return matches;
  }

  function getLatestTransactionDate_(transactionSources) {
    var sources = Array.isArray(transactionSources) ? transactionSources : [{ sheet: transactionSources }];
    var latest = null;

    sources.forEach(function (source) {
      var sheet = source && source.sheet ? source.sheet : source;
      if (!sheet || sheet.getLastRow() < 2) return;
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var indexMap = buildIndexMap_(headers);
      var fechaIndex = indexMap[normalizeHeaderKey_('FECHA PROCESO')];
      if (fechaIndex === undefined) return;
      var values = sheet.getRange(2, fechaIndex + 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < values.length; i += 1) {
        var parsed = parseDateValue_(values[i][0]);
        if (parsed && (!latest || parsed.getTime() > latest.getTime())) latest = parsed;
      }
    });

    return latest;
  }

  function buildSourceSignature_(clientsSheet, transactionSources) {
    var transactionSignature = (transactionSources || []).map(function (item) {
      var sheet = item.sheet;
      return [
        item.spreadsheetId || '',
        normalizeText_(sheet.getName()),
        sheet.getLastRow(),
        sheet.getLastColumn()
      ].join('|');
    }).join(':');

    return [
      normalizeText_(clientsSheet.getName()),
      clientsSheet.getLastRow(),
      clientsSheet.getLastColumn(),
      transactionSignature,
      getBalanceSourceSignature_()
    ].join(':');
  }

  function getTransactionSources_() {
    return CustomerTransactionSourceService.getSourceSheets().filter(function (source) {
      return source && source.sheet && isTransactionSheetCandidate_(source.sheet);
    }).map(function (source) {
      return {
        spreadsheetId: source.spreadsheetId,
        spreadsheetName: source.spreadsheetName,
        sheet: source.sheet,
        displayLabel: source.displayLabel || ((source.label || source.spreadsheetName) + ' / ' + source.sheet.getName())
      };
    });
  }

  function isTransactionSheetCandidate_(sheet) {
    if (!sheet || sheet.getLastRow() < 2) return false;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var indexMap = buildIndexMap_(headers);
    if (findColumnIndex_(indexMap, TRANSACTION_ID_HEADERS) !== undefined
      && findColumnIndex_(indexMap, ['FECHA PROCESO', 'FECHA']) !== undefined
      && (
        findColumnIndex_(indexMap, ['ABONO']) !== undefined
        || findColumnIndex_(indexMap, ['CARGO']) !== undefined
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

  function getBalanceSourceSignature_() {
    return getBalanceSheetSnapshot_().signature;
  }

  function scanSheet_(sheet, callback) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var indexMap = buildIndexMap_(headers);
    var totalRows = sheet.getLastRow() - 1;
    var chunkSize = 4000;
    for (var start = 0; start < totalRows; start += chunkSize) {
      var size = Math.min(chunkSize, totalRows - start);
      var values = sheet.getRange(start + 2, 1, size, headers.length).getValues();
      for (var rowIndex = 0; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row.some(function (cell) { return cell !== ''; })) continue;
        callback(row, indexMap);
      }
    }
  }

  function buildIndexMap_(headers) {
    return headers.reduce(function (acc, header, index) {
      acc[normalizeHeaderKey_(header)] = index;
      return acc;
    }, {});
  }

  function findColumnIndex_(indexMap, headerCandidates) {
    var candidates = Array.isArray(headerCandidates) ? headerCandidates : [headerCandidates];
    for (var index = 0; index < candidates.length; index += 1) {
      var key = normalizeHeaderKey_(candidates[index]);
      if (indexMap[key] !== undefined) return indexMap[key];
    }
    return undefined;
  }

  function getValue_(row, indexMap, candidates) {
    for (var index = 0; index < candidates.length; index += 1) {
      var key = normalizeHeaderKey_(candidates[index]);
      if (indexMap[key] !== undefined) return row[indexMap[key]];
    }
    return '';
  }

  function readSheetObjects_(sheetName, headers) {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return [];
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    return values.map(function (row) {
      return Utils.toObject(headers, row);
    }).filter(function (item) {
      return Object.keys(item).some(function (key) { return item[key] !== ''; });
    });
  }

  function writeSheetObjects_(sheetName, headers, rows) {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var sheet = ensureSheet_(spreadsheet, sheetName);
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length) {
      for (var start = 0; start < rows.length; start += 2000) {
        var chunk = rows.slice(start, start + 2000).map(function (row) {
          return headers.map(function (header) { return row[header]; });
        });
        sheet.getRange(start + 2, 1, chunk.length, headers.length).setValues(chunk);
      }
    }
    sheet.setFrozenRows(1);
    trimSheetToData_(sheet, rows.length + 1, headers.length);
  }

  function ensureSheet_(spreadsheet, sheetName) {
    return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  }

  function trimSheetToData_(sheet, rowCount, columnCount) {
    var targetRows = Math.max(2, Number(rowCount || 0) + 20);
    var targetColumns = Math.max(3, Number(columnCount || 0) + 2);

    if (sheet.getMaxRows() > targetRows) {
      sheet.deleteRows(targetRows + 1, sheet.getMaxRows() - targetRows);
    }
    if (sheet.getMaxColumns() > targetColumns) {
      sheet.deleteColumns(targetColumns + 1, sheet.getMaxColumns() - targetColumns);
    }
  }

  function normalizeHeaderKey_(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase();
  }

  function buildClientJoinKeys_(value) {
    var raw = cleanId_(value);
    if (!raw) return [];
    var normalized = normalizeHeaderKey_(raw);
    var digitsOnly = raw.replace(/\D/g, '');
    var keys = [];
    if (normalized) keys.push(normalized);
    if (digitsOnly && digitsOnly !== normalized) keys.push(digitsOnly);
    return keys;
  }

  function normalizeText_(value) {
    return cleanText_(value).toUpperCase();
  }

  function isActiveStatus_(value) {
    var normalized = normalizeText_(value);
    return normalized === 'ACTIVO'
      || normalized === 'ACTIVE'
      || normalized.indexOf('ACTIVA') !== -1
      || normalized.indexOf('ACTIVO') !== -1
      || normalized.indexOf('ACTIVE') !== -1;
  }

  function cleanText_(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function cleanId_(value) {
    return String(value === undefined || value === null ? '' : value).trim();
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
        var yyyy = Number(parts[0]);
        var mm = Number(parts[1]) - 1;
        var dd = Number(parts[2]);
        return safeDate_(yyyy, mm, dd);
      }
      var day = Number(parts[0]);
      var month = Number(parts[1]) - 1;
      var year = Number(parts[2]);
      if (year < 100) year += 2000;
      return safeDate_(year, month, day);
    }
    var date = new Date(text);
    if (isNaN(date.getTime())) return null;
    return stripTime_(date);
  }

  function safeDate_(year, month, day) {
    var date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return stripTime_(date);
  }

  function stripTime_(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays_(date, days) {
    var copy = new Date(date.getTime());
    copy.setDate(copy.getDate() + Number(days || 0));
    return stripTime_(copy);
  }

  function diffDaysBetweenDates_(startDate, endDate) {
    return Math.floor((stripTime_(endDate).getTime() - stripTime_(startDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  function isOpenedLast30Days_(openDate, referenceDate) {
    if (!openDate || !referenceDate) return false;
    var diff = diffDaysBetweenDates_(openDate, referenceDate);
    return diff >= 0 && diff <= 29;
  }

  function toNumber_(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    var text = String(value).trim();
    if (!text) return 0;
    if (text.indexOf(',') !== -1 && text.indexOf('.') !== -1) {
      if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
        text = text.replace(/\./g, '').replace(',', '.');
      } else {
        text = text.replace(/,/g, '');
      }
    } else if (text.indexOf(',') !== -1) {
      text = text.replace(',', '.');
    }
    var parsed = Number(text.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  function toBoolean_(value) {
    if (value === true || value === false) return value;
    var normalized = normalizeText_(value);
    return ['TRUE', 'VERDADERO', 'SI', 'YES', '1'].indexOf(normalized) !== -1;
  }

  function sumMetric_(rows, field) {
    return rows.reduce(function (acc, item) {
      return acc + Number(item[field] || 0);
    }, 0);
  }

  function mapKpis_(rows) {
    return rows.reduce(function (acc, item) {
      acc[item.metric] = item.value;
      return acc;
    }, {});
  }

  function formatDate_(date) {
    if (!date) return '';
    var safeDate = date instanceof Date ? date : parseDateValue_(date);
    if (!safeDate || isNaN(safeDate.getTime())) return '';
    return Utilities.formatDate(safeDate, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM-dd');
  }

  function formatMoney_(value) {
    return Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function round2_(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function digestText_(value) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(value || ''), Utilities.Charset.UTF_8);
    return bytes.map(function (byte) {
      var normalized = byte < 0 ? byte + 256 : byte;
      return ('0' + normalized.toString(16)).slice(-2);
    }).join('');
  }

  return {
    getModuleDashboard: getModuleDashboard,
    getQueryPresetCatalog: getQueryPresetCatalog,
    getClientView: getClientView,
    runPresetQuery: runPresetQuery,
    exportPresetClientNumbers: exportPresetClientNumbers,
    replaceDatasetFromSheet: replaceDatasetFromSheet,
    ingestMonthlySheet: ingestMonthlySheet,
    rebuildSummaryFromRaw: rebuildSummaryFromRaw,
    rebuildSummaryFromManual: rebuildSummaryFromManual,
    rebuildSummaryFromSheet: rebuildSummaryFromSheet
  };
})();
