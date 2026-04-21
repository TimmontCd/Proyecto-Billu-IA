var CustomerCategorizationService = (function () {
  var LEVELS = [
    {
      id: 'Exploradores',
      label: 'Exploradores',
      rule: 'saldo promedio 3 meses < 500, o hasta 2 transacciones, o antiguedad menor a 90 dias',
      cardName: 'Tarjeta Billu Inicio',
      cardBenefits: 'Linea inicial y requisitos ligeros para incentivar el primer uso recurrente.'
    },
    {
      id: 'Constructores',
      label: 'Constructores',
      rule: 'saldo promedio 3 meses entre 500 y 5000, con 3 a 9 transacciones y relacion activa estable',
      cardName: 'Tarjeta Billu Crece',
      cardBenefits: 'Linea media, recompensas por uso y aceleradores por dispersion y ahorro.'
    },
    {
      id: 'Aliados_Premium',
      label: 'Aliados Premium',
      rule: 'saldo promedio 3 meses > 5000, o saldo >= 2000 con 10+ transacciones y antiguedad >= 180 dias',
      cardName: 'Tarjeta Billu Aliados Premium',
      cardBenefits: 'Linea alta, recompensas superiores y tasas preferenciales para clientes fidelizados.'
    }
  ];
  var ACTIVE_STATUS = 'A-ACTIVA';
  var TRANSACTION_ID_HEADERS = ['ID RECOMPENSAS', 'ID_RECOMPENSAS', 'ID RECOMPENSA', 'CLIENTE', 'ID CLIENTE'];
  var TRANSACTION_DATE_HEADERS = ['FECHA PROCESO', 'FECHA', 'FECHA TRANSACCION', 'FECHA TRANSACCIÓN'];
  var TRANSACTION_ABONO_HEADERS = ['ABONO'];
  var TRANSACTION_CARGO_HEADERS = ['CARGO'];

  function getDashboard() {
    var source = readSource_();
    var rows = source.rows;
    var segmentSummary = buildLevelSummary_(rows);
    var totalClients = rows.length;
    var totalBalance = Utils.sum(rows, 'balanceAverage3m');
    var averageBalance = totalClients ? totalBalance / totalClients : 0;
    var averageAbonos = totalClients ? Utils.sum(rows, 'abonosCantidad30d') / totalClients : 0;
    var averageCargos = totalClients ? Utils.sum(rows, 'cargosCantidad30d') / totalClients : 0;
    var explorersClients = countRowsByLevel_(rows, 'Exploradores');
    var constructorsClients = countRowsByLevel_(rows, 'Constructores');
    var premiumClients = countRowsByLevel_(rows, 'Aliados_Premium');
    var creditCardOpportunityClients = rows.filter(function (item) { return !item.productFlags.TARJETA_CREDITO; }).length;
    var portfolioCompleteClients = rows.filter(function (item) { return !item.productsMissing.length; }).length;
    var topSegment = segmentSummary.slice().sort(function (a, b) { return b.clients - a.clients; })[0] || null;

    return {
      ready: true,
      source: source.meta,
      kpis: {
        total_clients: totalClients,
        total_balance: round2_(totalBalance),
        average_balance: round2_(averageBalance),
        average_abonos: round2_(averageAbonos),
        average_cargos: round2_(averageCargos),
        explorers_clients: explorersClients,
        constructors_clients: constructorsClients,
        premium_allies_clients: premiumClients,
        credit_card_opportunity_clients: creditCardOpportunityClients,
        portfolio_complete_clients: portfolioCompleteClients
      },
      executiveSummary: buildExecutiveSummary_(source.meta, totalClients, topSegment, explorersClients, constructorsClients, premiumClients, creditCardOpportunityClients, portfolioCompleteClients),
      segmentSummary: segmentSummary
    };
  }

  function exportSegment(payload) {
    payload = payload || {};
    Utils.requireFields(payload, ['segmentId']);

    var segmentId = String(payload.segmentId || '');
    var source = readSource_();
    var rows = source.rows.filter(function (item) { return item.segmentId === segmentId; });
    var level = findLevelById_(segmentId);

    if (!level) {
      throw new Error('Nivel no soportado: ' + segmentId);
    }
    if (!rows.length) {
      throw new Error('No se encontraron registros para el nivel ' + level.label + '.');
    }

    return {
      segmentId: level.id,
      segmentLabel: level.label,
      rowCount: rows.length,
      fileName: buildSegmentFileName_(level.id),
      csvContent: buildCsvFromObjects_(rows.map(function (item) {
        return item.exportRow;
      }))
    };
  }

  function exportCrossSellSegment(payload) {
    payload = payload || {};
    Utils.requireFields(payload, ['segmentId']);

    var segmentId = String(payload.segmentId || '');
    var source = readSource_();
    var rows = source.rows.filter(function (item) { return item.segmentId === segmentId; });
    var level = findLevelById_(segmentId);

    if (!level) {
      throw new Error('Nivel no soportado: ' + segmentId);
    }
    if (!rows.length) {
      throw new Error('No se encontraron registros para el nivel ' + level.label + '.');
    }

    return {
      segmentId: level.id,
      segmentLabel: level.label,
      rowCount: rows.length,
      fileName: buildCrossSellFileName_(level.id),
      csvContent: buildCsvFromObjects_(rows.map(function (item) {
        return {
          ID_RECOMPENSAS: item.rewardsId,
          NIVEL_CLIENTE_ID: item.segmentId,
          NIVEL_CLIENTE: item.segmentLabel,
          ESTATUS_DE_LA_CUENTA: item.exportRow.ESTATUS_DE_LA_CUENTA,
          ESTADO: item.exportRow.ESTADO,
          GENERO: item.exportRow.GENERO,
          SALDO_PROMEDIO_HOY: item.exportRow.SALDO_PROMEDIO_HOY,
          SALDO_PROMEDIO_3_MESES: item.exportRow.SALDO_PROMEDIO_3_MESES,
          TRANSACCIONES_TOTALES: item.totalTransactions,
          PERFIL_TRANSACCIONAL: item.transactionProfile,
          CANTIDAD_PRODUCTOS_ACTIVOS: item.productLabels.length,
          PRODUCTOS_ACTIVOS: item.productLabels.join(', '),
          CANTIDAD_PRODUCTOS_FALTANTES: item.productsMissingLabels.length,
          PRODUCTOS_FALTANTES: item.productsMissingLabels.join(', '),
          TIENE_CUENTA_N2: item.productFlags.CUENTA_N2 ? 'SI' : 'NO',
          TIENE_CUENTA_N4: item.productFlags.CUENTA_N4 ? 'SI' : 'NO',
          TIENE_AHORRO_PROGRAMADO: item.productFlags.AHORRO_PROGRAMADO ? 'SI' : 'NO',
          TIENE_INVERSION_DIARIA: item.productFlags.INVERSION_DIARIA ? 'SI' : 'NO',
          TIENE_TARJETA_CREDITO: item.productFlags.TARJETA_CREDITO ? 'SI' : 'NO',
          CAMPANA_SUGERIDA: item.campaign
        };
      }))
    };
  }

  function findByRewardsId(payload) {
    payload = payload || {};
    var rewardsId = normalizeLookupValue_(payload.rewardsId || payload.idRecompensas);
    if (!rewardsId) throw new Error('Captura un ID RECOMPENSAS.');

    var source = readSource_();
    var matches = source.rows.filter(function (item) {
      return normalizeLookupValue_(item.rewardsId) === rewardsId;
    });

    if (!matches.length) {
      throw new Error('No se encontro informacion para el ID RECOMPENSAS capturado.');
    }

    return {
      rewardsId: rewardsId,
      totalMatches: matches.length,
      fileName: 'id_recompensas_' + rewardsId + '.csv',
      executiveSummary: matches.length === 1
        ? 'Se encontro 1 registro para el ID RECOMPENSAS consultado.'
        : 'Se encontraron ' + matches.length + ' registros para el ID RECOMPENSAS consultado.',
      rows: matches.map(function (item) {
        return {
          idRecompensas: item.rewardsId,
          nivelClienteId: item.segmentId,
          nivelCliente: item.segmentLabel,
          reglaNivel: item.segmentRule,
          tarjetaSugerida: item.recommendedCard,
          saldoPromedioHoy: round2_(item.currentBalance),
          saldoPromedio3Meses: round2_(item.balanceAverage3m),
          transaccionesTotales: item.totalTransactions,
          perfilTransaccional: item.transactionProfile,
          antiguedadDias: item.tenureDays,
          productosActivos: item.productLabels.join(', '),
          productosFaltantes: item.productsMissingLabels.join(', '),
          campanaSugerida: item.campaign,
          detalle: item.exportRow
        };
      })
    };
  }

  function formatSourceCurrencyColumns() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getMonthlyBalanceSpreadsheetId());
    var sheet = spreadsheet.getSheetByName(AppConfig.getMonthlyBalanceSheetName());
    if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 2) {
      return {
        spreadsheetId: spreadsheet.getId(),
        spreadsheetName: spreadsheet.getName(),
        sheetName: sheet ? sheet.getName() : AppConfig.getMonthlyBalanceSheetName(),
        formattedRows: 0,
        updatedCells: 0,
        numberFormat: '[$$-es-MX]#,##0.00'
      };
    }

    var snapshot = MonthlyBalanceSyncService.getMonthlyBalanceSnapshot();
    var columns = (snapshot.monthColumns || []).slice();
    if (snapshot.threeMonthAverageIndex > -1) {
      columns.push({ index: snapshot.threeMonthAverageIndex, header: 'SALDO PROMEDIO 3 MESES' });
    }
    if (!columns.length) {
      return {
        spreadsheetId: spreadsheet.getId(),
        spreadsheetName: spreadsheet.getName(),
        sheetName: sheet.getName(),
        formattedRows: sheet.getLastRow() - 1,
        updatedCells: 0,
        numberFormat: '[$$-es-MX]#,##0.00'
      };
    }

    columns.forEach(function (column) {
      sheet.getRange(2, column.index + 1, sheet.getLastRow() - 1, 1).setNumberFormat('[$$-es-MX]#,##0.00');
    });

    return {
      spreadsheetId: spreadsheet.getId(),
      spreadsheetName: spreadsheet.getName(),
      sheetName: sheet.getName(),
      formattedRows: sheet.getLastRow() - 1,
      updatedCells: (sheet.getLastRow() - 1) * columns.length,
      numberFormat: '[$$-es-MX]#,##0.00'
    };
  }

  function readSource_() {
    var portfolio = MonthlyBalanceSyncService.getActivePortfolioSnapshot();
    var monthly = MonthlyBalanceSyncService.getMonthlyBalanceSnapshot();
    var transactionMap = readTransactionsByRewardsId_();
    var lastThreeColumns = (monthly.monthColumns || []).slice(-3);

    var rows = portfolio.activeClients.map(function (client) {
      var monthlyRow = monthly.rowsById[normalizeLookupValue_(client.rewardsId)] || [];
      var monthValues = lastThreeColumns.map(function (column) {
        return {
          header: column.header,
          value: sanitizeBalance_(monthlyRow[column.index]),
          hasValue: monthlyRow[column.index] !== '' && monthlyRow[column.index] !== null && monthlyRow[column.index] !== undefined
        };
      }).filter(function (item) {
        return item.hasValue;
      });

      var precomputedAverage = monthly.threeMonthAverageIndex > -1 ? sanitizeBalance_(monthlyRow[monthly.threeMonthAverageIndex]) : 0;
      var balanceAverage3m = monthValues.length
        ? monthValues.reduce(function (acc, item) { return acc + item.value; }, 0) / monthValues.length
        : (precomputedAverage > 0 ? precomputedAverage : Number(client.currentBalance || 0));
      var txSummary = transactionMap[normalizeLookupValue_(client.rewardsId)] || buildEmptyTransactionSummary_();
      var tenureDays = client.openingDate ? diffDaysBetweenDates_(client.openingDate, new Date()) : 0;
      var level = resolveLevel_(balanceAverage3m, txSummary.totalTransactions, tenureDays);
      var productsMissingLabels = client.productsMissing.map(function (code) {
        return MonthlyBalanceSyncService.getProductLabel(code);
      });
      var campaign = buildCampaign_(level, client.productFlags, productsMissingLabels);

      var exportRow = {
        ID_RECOMPENSAS: client.rewardsId,
        ESTATUS_DE_LA_CUENTA: client.accountStatus,
        FECHA_APERTURA_CUENTA: client.openingDate ? Utils.formatDate(client.openingDate, APP_CONSTANTS.DATE_FORMAT) : '',
        ANTIGUEDAD_DIAS: tenureDays,
        ESTADO: client.stateName || '',
        GENERO: client.gender || '',
        SALDO_PROMEDIO_HOY: formatCurrency_(client.currentBalance || 0),
        SALDO_PROMEDIO_3_MESES: formatCurrency_(balanceAverage3m || 0),
        MESES_CONSIDERADOS_SALDO: monthValues.length,
        COLUMNAS_SALDO_CONSIDERADAS: lastThreeColumns.map(function (column) { return column.header; }).join(', '),
        NIVEL_CLIENTE_ID: level.id,
        NIVEL_CLIENTE: level.label,
        NIVEL_CLIENTE_REGLA: level.rule,
        TARJETA_RECOMENDADA: level.cardName,
        TARJETA_BENEFICIOS: level.cardBenefits,
        TRANSACCIONES_TOTALES: txSummary.totalTransactions,
        PERFIL_TRANSACCIONAL: txSummary.profile,
        ABONOS_CANTIDAD: txSummary.abonosCantidad,
        ABONOS_MONTO: formatCurrency_(txSummary.abonosMonto),
        CARGOS_CANTIDAD: txSummary.cargosCantidad,
        CARGOS_MONTO: formatCurrency_(txSummary.cargosMonto),
        SALDO_CUENTA_N2: formatCurrency_(client.productBalances.CUENTA_N2 || 0),
        SALDO_CUENTA_N4: formatCurrency_(client.productBalances.CUENTA_N4 || 0),
        SALDO_AHORRO_PROGRAMADO: formatCurrency_(client.productBalances.AHORRO_PROGRAMADO || 0),
        SALDO_INVERSION_DIARIA: formatCurrency_(client.productBalances.INVERSION_DIARIA || 0),
        SALDO_TARJETA_CREDITO: formatCurrency_(client.productBalances.TARJETA_CREDITO || 0),
        PRODUCTOS_ACTIVOS: client.productLabels.join(', '),
        PRODUCTOS_FALTANTES: productsMissingLabels.join(', '),
        TIENE_CUENTA_N2: client.productFlags.CUENTA_N2 ? 'SI' : 'NO',
        TIENE_CUENTA_N4: client.productFlags.CUENTA_N4 ? 'SI' : 'NO',
        TIENE_AHORRO_PROGRAMADO: client.productFlags.AHORRO_PROGRAMADO ? 'SI' : 'NO',
        TIENE_INVERSION_DIARIA: client.productFlags.INVERSION_DIARIA ? 'SI' : 'NO',
        TIENE_TARJETA_CREDITO: client.productFlags.TARJETA_CREDITO ? 'SI' : 'NO',
        CAMPANA_SUGERIDA: campaign
      };

      return {
        rewardsId: client.rewardsId,
        stateName: client.stateName || '',
        currentBalance: round2_(client.currentBalance || 0),
        balanceAverage3m: round2_(balanceAverage3m || 0),
        monthsConsidered: monthValues.map(function (item) { return item.header; }),
        gender: client.gender || '',
        age: client.age !== null && client.age !== undefined ? sanitizeAgeValue_(client.age) : calculateAge_(client.birthDate),
        tenureDays: tenureDays,
        segmentId: level.id,
        segmentLabel: level.label,
        segmentRule: level.rule,
        recommendedCard: level.cardName,
        recommendedCardBenefits: level.cardBenefits,
        transactionProfile: txSummary.profile,
        totalTransactions: txSummary.totalTransactions,
        abonosCantidad30d: txSummary.abonosCantidad30d,
        cargosCantidad30d: txSummary.cargosCantidad30d,
        abonosCantidad: txSummary.abonosCantidad,
        cargosCantidad: txSummary.cargosCantidad,
        productFlags: client.productFlags,
        productBalances: client.productBalances,
        productLabels: client.productLabels.slice(),
        productsMissing: client.productsMissing.slice(),
        productsMissingLabels: productsMissingLabels,
        campaign: campaign,
        exportRow: exportRow
      };
    });

    return {
      meta: buildSourceMeta_(portfolio, monthly, lastThreeColumns),
      rows: rows
    };
  }

  function buildLevelSummary_(rows) {
    var totalClients = rows.length || 1;
    return LEVELS.map(function (level) {
      var levelRows = rows.filter(function (item) { return item.segmentId === level.id; });
      var totalBalance = Utils.sum(levelRows, 'balanceAverage3m');
      var averageBalance = levelRows.length ? totalBalance / levelRows.length : 0;
      var maleClients = levelRows.filter(function (item) { return item.gender === 'M'; }).length;
      var femaleClients = levelRows.filter(function (item) { return item.gender === 'F'; }).length;
      var validAgeRows = levelRows.filter(function (item) { return item.age !== null; });
      var ageSum = validAgeRows.reduce(function (acc, item) { return acc + Number(item.age || 0); }, 0);
      var avgTransactions = levelRows.length ? Utils.sum(levelRows, 'totalTransactions') / levelRows.length : 0;
      var avgTenureDays = levelRows.length ? Utils.sum(levelRows, 'tenureDays') / levelRows.length : 0;
      var missingCreditCardClients = levelRows.filter(function (item) { return !item.productFlags.TARJETA_CREDITO; }).length;
      var portfolioCompleteClients = levelRows.filter(function (item) { return !(item.productsMissing || []).length; }).length;
      var topStates = summarizeSegmentStates_(levelRows);
      var productAdoption = summarizeSegmentProducts_(levelRows);
      var missingProducts = summarizeSegmentMissingProducts_(levelRows);
      return {
        segmentId: level.id,
        segmentLabel: level.label,
        rule: level.rule,
        recommendedCard: level.cardName,
        recommendedCardBenefits: level.cardBenefits,
        clients: levelRows.length,
        sharePct: round2_((levelRows.length / totalClients) * 100),
        totalBalance: round2_(totalBalance),
        averageBalance: round2_(averageBalance),
        averageTransactions: round2_(avgTransactions),
        averageTenureDays: round2_(avgTenureDays),
        missingCreditCardClients: missingCreditCardClients,
        maleClients: maleClients,
        femaleClients: femaleClients,
        malePct: round2_(levelRows.length ? (maleClients / levelRows.length) * 100 : 0),
        femalePct: round2_(levelRows.length ? (femaleClients / levelRows.length) * 100 : 0),
        validAgeClients: validAgeRows.length,
        ageSum: round2_(ageSum),
        averageAge: round2_(validAgeRows.length ? ageSum / validAgeRows.length : 0),
        portfolioCompleteClients: portfolioCompleteClients,
        topStates: topStates,
        productAdoption: productAdoption,
        missingProducts: missingProducts,
        fileName: buildSegmentFileName_(level.id)
      };
    }).filter(function (item) {
      return item.clients > 0;
    });
  }

  function buildExecutiveSummary_(meta, totalClients, topSegment, explorersClients, constructorsClients, premiumClients, creditCardOpportunityClients, portfolioCompleteClients) {
    var summary = 'Se analizaron ' + totalClients + ' clientes activos a partir de la hoja ' + meta.masterSheetName + ' y del historico de ' + meta.monthlySheetName + '. ';
    summary += 'La categorizacion ahora combina saldo promedio de 3 meses, transacciones y antiguedad. ';
    summary += explorersClients + ' clientes quedaron como Exploradores, ' + constructorsClients + ' como Constructores y ' + premiumClients + ' como Aliados Premium. ';
    summary += creditCardOpportunityClients + ' clientes siguen siendo oportunidad para tarjeta de credito y ' + portfolioCompleteClients + ' ya tienen portafolio completo.';
    if (topSegment) {
      summary += ' El nivel con mayor volumen es ' + topSegment.segmentLabel + ' con ' + topSegment.clients + ' clientes.';
    }
    return summary;
  }

  function buildSourceMeta_(portfolio, monthly, lastThreeColumns) {
    var masterSource = portfolio.source || {};
    var monthlySource = monthly.source || {};
    return {
      spreadsheetId: masterSource.spreadsheetId || '',
      spreadsheetName: [masterSource.spreadsheetName, monthlySource.spreadsheetName].filter(Boolean).join(' + '),
      sheetName: [masterSource.sheetName, monthlySource.sheetName].filter(Boolean).join(' + '),
      masterSheetName: masterSource.sheetName || 'Clientes',
      monthlySheetName: monthlySource.sheetName || 'Cuentas',
      totalRows: portfolio.activeClients.length,
      sourceRows: portfolio.sourceRows || 0,
      monthColumnsConsidered: lastThreeColumns.length ? lastThreeColumns.map(function (column) { return column.header; }) : ['SALDO PROMEDIO HOY'],
      activeStatus: ACTIVE_STATUS,
      lastUpdatedAt: masterSource.lastUpdatedAt || ''
    };
  }

  function resolveLevel_(balanceAverage3m, totalTransactions, tenureDays) {
    if (balanceAverage3m > 5000 || (balanceAverage3m >= 2000 && totalTransactions >= 10 && tenureDays >= 180)) {
      return LEVELS[2];
    }
    if (balanceAverage3m < 500 || totalTransactions <= 2 || tenureDays < 90) {
      return LEVELS[0];
    }
    return LEVELS[1];
  }

  function buildCampaign_(level, productFlags, productsMissingLabels) {
    if (!productFlags.TARJETA_CREDITO) {
      return 'Oferta ' + level.cardName;
    }
    if (productsMissingLabels.length) {
      return 'Cross-sell ' + productsMissingLabels.join(' + ');
    }
    return 'Fidelizacion ' + level.label;
  }

  function countRowsByLevel_(rows, levelId) {
    return rows.filter(function (item) { return item.segmentId === levelId; }).length;
  }

  function summarizeSegmentStates_(rows) {
    var counts = {};
    rows.forEach(function (item) {
      var stateName = String(item.stateName || '').trim();
      if (!stateName) return;
      counts[stateName] = (counts[stateName] || 0) + 1;
    });

    return Object.keys(counts).map(function (stateName) {
      return {
        stateName: stateName,
        clients: counts[stateName],
        sharePct: round2_(rows.length ? (counts[stateName] / rows.length) * 100 : 0)
      };
    }).sort(function (a, b) {
      return b.clients - a.clients;
    }).slice(0, 4);
  }

  function summarizeSegmentProducts_(rows) {
    var productCodes = ['CUENTA_N2', 'CUENTA_N4', 'AHORRO_PROGRAMADO', 'INVERSION_DIARIA', 'TARJETA_CREDITO'];
    return productCodes.map(function (code) {
      var clients = rows.filter(function (item) {
        return item.productFlags && item.productFlags[code];
      }).length;
      return {
        code: code,
        label: MonthlyBalanceSyncService.getProductLabel(code),
        clients: clients,
        sharePct: round2_(rows.length ? (clients / rows.length) * 100 : 0)
      };
    });
  }

  function summarizeSegmentMissingProducts_(rows) {
    var counts = {};
    rows.forEach(function (item) {
      (item.productsMissing || []).forEach(function (code) {
        counts[code] = (counts[code] || 0) + 1;
      });
    });

    return Object.keys(counts).map(function (code) {
      return {
        code: code,
        label: MonthlyBalanceSyncService.getProductLabel(code),
        clients: counts[code],
        sharePct: round2_(rows.length ? (counts[code] / rows.length) * 100 : 0)
      };
    }).sort(function (a, b) {
      return b.clients - a.clients;
    }).slice(0, 4);
  }

  function findLevelById_(levelId) {
    return LEVELS.filter(function (item) { return item.id === levelId; })[0] || null;
  }

  function buildSegmentFileName_(segmentId) {
    return 'categorizacion_cliente_' + String(segmentId || 'nivel').toLowerCase() + '.csv';
  }

  function buildCrossSellFileName_(segmentId) {
    return 'venta_cruzada_' + String(segmentId || 'nivel').toLowerCase() + '.csv';
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

  function readTransactionsByRewardsId_() {
    var map = {};
    var reportDate = null;
    var transactionSources = loadTransactionSources_();

    transactionSources.forEach(function (source) {
      var values = source && source.values;
      if (!values || values.length < 2) return;

      var headers = buildHeaders_(values[0], values[0].length);
      var idIndex = resolveHeaderIndex_(headers, TRANSACTION_ID_HEADERS, 1);
      var dateIndex = resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, 0);
      var abonoIndex = resolveHeaderIndex_(headers, TRANSACTION_ABONO_HEADERS, 4);
      var cargoIndex = resolveHeaderIndex_(headers, TRANSACTION_CARGO_HEADERS, 5);

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var rewardsId = normalizeLookupValue_(row[idIndex]);
        if (!rewardsId) continue;

        var txDate = parseDateValue_(row[dateIndex]);
        if (txDate && (!reportDate || txDate.getTime() > reportDate.getTime())) {
          reportDate = txDate;
        }
        var abono = sanitizeBalance_(row[abonoIndex]);
        var cargo = sanitizeBalance_(row[cargoIndex]);

        if (!map[rewardsId]) {
          map[rewardsId] = buildEmptyTransactionSummary_();
        }

        if (abono > 0) {
          map[rewardsId].abonosCantidad += 1;
          map[rewardsId].abonosMonto += abono;
          if (txDate && (!map[rewardsId].lastAbonoDate || txDate.getTime() > map[rewardsId].lastAbonoDate.getTime())) {
            map[rewardsId].lastAbonoDate = txDate;
          }
        }
        if (cargo > 0) {
          map[rewardsId].cargosCantidad += 1;
          map[rewardsId].cargosMonto += cargo;
          if (txDate && (!map[rewardsId].lastCargoDate || txDate.getTime() > map[rewardsId].lastCargoDate.getTime())) {
            map[rewardsId].lastCargoDate = txDate;
          }
        }
      }
    });

    reportDate = reportDate || stripTime_(new Date());
    var thresholdDate = shiftDays_(reportDate, -29);

    transactionSources.forEach(function (source) {
      var values = source && source.values;
      if (!values || values.length < 2) return;

      var headers = buildHeaders_(values[0], values[0].length);
      var idIndex = resolveHeaderIndex_(headers, TRANSACTION_ID_HEADERS, 1);
      var dateIndex = resolveHeaderIndex_(headers, TRANSACTION_DATE_HEADERS, 0);
      var abonoIndex = resolveHeaderIndex_(headers, TRANSACTION_ABONO_HEADERS, 4);
      var cargoIndex = resolveHeaderIndex_(headers, TRANSACTION_CARGO_HEADERS, 5);

      for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        var row = values[rowIndex];
        if (!row || !row.length) continue;

        var rewardsId = normalizeLookupValue_(row[idIndex]);
        if (!rewardsId || !map[rewardsId]) continue;

        var txDate = parseDateValue_(row[dateIndex]);
        if (!txDate || txDate.getTime() < thresholdDate.getTime() || txDate.getTime() > reportDate.getTime()) continue;

        var abono = sanitizeBalance_(row[abonoIndex]);
        var cargo = sanitizeBalance_(row[cargoIndex]);

        if (abono > 0) {
          map[rewardsId].abonosCantidad30d += 1;
        }
        if (cargo > 0) {
          map[rewardsId].cargosCantidad30d += 1;
        }
      }
    });

    Object.keys(map).forEach(function (rewardsId) {
      var item = map[rewardsId];
      item.totalTransactions = item.abonosCantidad + item.cargosCantidad;
      item.profile = resolveTransactionProfile_(item.totalTransactions);
      item.diasDesdeUltimoCargo = item.lastCargoDate ? diffDaysBetweenDates_(item.lastCargoDate, reportDate) : '';
      item.diasDesdeUltimoAbono = item.lastAbonoDate ? diffDaysBetweenDates_(item.lastAbonoDate, reportDate) : '';
      delete item.lastCargoDate;
      delete item.lastAbonoDate;
    });

    return map;
  }

  function loadTransactionSources_() {
    var configured = loadConfiguredTransactionCsvSources_();
    if (configured.length) return configured;

    return CustomerTransactionSourceService.getSourceSheets().filter(function (source) {
      return source && source.sheet && source.sheet.getLastRow() >= 2;
    }).map(function (source) {
      return {
        label: source.displayLabel || source.label || '',
        values: source.sheet.getDataRange().getValues()
      };
    });
  }

  function loadConfiguredTransactionCsvSources_() {
    var configs = AppConfig.getCustomerTransactionSourceConfigs() || [];
    var sources = [];

    configs.forEach(function (config) {
      if (!config || !config.spreadsheetId) return;
      var preferredSheetIds = Array.isArray(config.sheetIds) ? config.sheetIds : [];
      if (!preferredSheetIds.length) return;

      preferredSheetIds.forEach(function (sheetId) {
        var values = fetchTransactionCsvValues_(config.spreadsheetId, sheetId);
        if (!values || values.length < 2) return;
        sources.push({
          label: (config.label || config.spreadsheetId) + ' / ' + String(sheetId),
          values: values
        });
      });
    });

    return sources;
  }

  function fetchTransactionCsvValues_(spreadsheetId, sheetId) {
    try {
      var url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(spreadsheetId)
        + '/export?format=csv&gid=' + encodeURIComponent(sheetId);
      var response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: {
          Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
        },
        muteHttpExceptions: true
      });
      if (response.getResponseCode() >= 300) {
        Logger.log('No fue posible descargar CSV transaccional ' + spreadsheetId + ' / ' + sheetId + ': HTTP ' + response.getResponseCode());
        return [];
      }
      return Utilities.parseCsv(response.getContentText() || '');
    } catch (error) {
      Logger.log('No fue posible descargar CSV transaccional ' + spreadsheetId + ' / ' + sheetId + ': ' + error.message);
      return [];
    }
  }

  function buildEmptyTransactionSummary_() {
    return {
      abonosCantidad: 0,
      abonosMonto: 0,
      cargosCantidad: 0,
      cargosMonto: 0,
      abonosCantidad30d: 0,
      cargosCantidad30d: 0,
      totalTransactions: 0,
      profile: 'Sin uso',
      lastAbonoDate: null,
      lastCargoDate: null,
      diasDesdeUltimoCargo: '',
      diasDesdeUltimoAbono: ''
    };
  }

  function resolveTransactionProfile_(totalTransactions) {
    if (totalTransactions <= 0) return 'Sin uso';
    if (totalTransactions <= 2) return 'Uso bajo';
    if (totalTransactions <= 9) return 'Uso medio';
    return 'Uso alto';
  }

  function buildHeaders_(headerRow, columnCount) {
    var used = {};
    var headers = [];
    for (var index = 0; index < columnCount; index += 1) {
      var candidate = stringifyCell_(headerRow[index]) || ('COLUMNA_' + (index + 1));
      var baseName = candidate;
      var counter = 2;
      while (used[candidate]) {
        candidate = baseName + '_' + counter;
        counter += 1;
      }
      used[candidate] = true;
      headers.push(candidate);
    }
    return headers;
  }

  function resolveHeaderIndex_(headers, candidates, fallbackIndex) {
    var normalizedCandidates = candidates.map(function (item) { return normalizeHeader_(item); });
    for (var index = 0; index < headers.length; index += 1) {
      if (normalizedCandidates.indexOf(normalizeHeader_(headers[index])) > -1) return index;
    }
    return fallbackIndex;
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

  function stringifyCell_(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return Utils.formatDate(value, APP_CONSTANTS.DATE_FORMAT);
    return String(value).trim();
  }

  function calculateAge_(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      return value > 0 && value <= 120 ? Math.round(value) : null;
    }
    if (typeof value === 'string') {
      var numeric = Number(String(value).trim().replace(/[^\d\.]/g, ''));
      if (!isNaN(numeric) && numeric > 0 && numeric <= 120) return Math.round(numeric);
    }
    if (!(value instanceof Date) || isNaN(value.getTime())) return null;
    var today = new Date();
    var age = today.getFullYear() - value.getFullYear();
    var monthDiff = today.getMonth() - value.getMonth();
    var dayDiff = today.getDate() - value.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    if (age < 0 || age > 120) return null;
    return age;
  }

  function sanitizeAgeValue_(value) {
    var parsed = Number(value);
    if (isNaN(parsed)) return null;
    if (parsed <= 0 || parsed > 120) return null;
    return Math.round(parsed);
  }

  function parseNumericValue_(value) {
    if (value === null || value === undefined || value === '') {
      return { valid: false, value: 0 };
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
    var parts = text.split(/[\/\-]/);
    if (parts.length === 3) {
      var first = Number(parts[0]);
      var second = Number(parts[1]);
      var third = Number(parts[2]);
      if (!isNaN(first) && !isNaN(second) && !isNaN(third)) {
        var year = third < 100 ? 2000 + third : third;
        var candidate = new Date(year, second - 1, first);
        if (!isNaN(candidate.getTime())) return stripTime_(candidate);
      }
    }
    return null;
  }

  function stripTime_(date) {
    var result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function shiftDays_(date, offset) {
    var result = stripTime_(date);
    result.setDate(result.getDate() + Number(offset || 0));
    return result;
  }

  function diffDaysBetweenDates_(fromDate, toDate) {
    return Math.round((stripTime_(toDate).getTime() - stripTime_(fromDate).getTime()) / 86400000);
  }

  return {
    getDashboard: getDashboard,
    exportSegment: exportSegment,
    exportCrossSellSegment: exportCrossSellSegment,
    findByRewardsId: findByRewardsId,
    formatSourceCurrencyColumns: formatSourceCurrencyColumns
  };
})();
