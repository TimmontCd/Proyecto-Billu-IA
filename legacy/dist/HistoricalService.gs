var HistoricalService = (function () {
  function importRecords(payload, userContext) {
    Utils.requireFields(payload, ['rows', 'sourceName']);
    var repo = new BaseRepository(APP_CONSTANTS.SHEETS.HISTORICAL);
    var loadRepo = new BaseRepository(APP_CONSTANTS.SHEETS.HISTORICAL_LOADS);
    var existingHashes = repo.getAll().reduce(function (acc, item) {
      acc[item.hashRegistro] = true;
      return acc;
    }, {});

    var valid = [];
    var duplicated = 0;
    var errors = 0;

    payload.rows.forEach(function (row) {
      try {
        Utils.requireFields(row, ['fecha', 'saldo', 'venta']);
        var normalized = normalizeHistoricalRow_(row, payload.sourceName);
        if (existingHashes[normalized.hashRegistro]) {
          duplicated += 1;
          return;
        }
        existingHashes[normalized.hashRegistro] = true;
        valid.push(normalized);
      } catch (error) {
        errors += 1;
      }
    });

    if (valid.length) repo.bulkInsert(valid);

    var load = loadRepo.insert({
      fechaCarga: Utils.formatDate(new Date()),
      archivoOrigen: payload.sourceName,
      tipoCarga: payload.type || 'MANUAL',
      registrosLeidos: payload.rows.length,
      registrosValidos: valid.length,
      registrosDuplicados: duplicated,
      registrosError: errors,
      usuarioCarga: userContext.email,
      observaciones: payload.notes || ''
    });
    AuditLogger.log('CargaHistorica', load.id, 'CREATE', load, userContext.email);
    return { load: load, inserted: valid.length, duplicated: duplicated, errors: errors };
  }

  function getSummary(filters) {
    filters = filters || {};
    var rows = new BaseRepository(APP_CONSTANTS.SHEETS.HISTORICAL).getAll().filter(function (row) {
      if (filters.startDate && new Date(row.fecha) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(row.fecha) > new Date(filters.endDate)) return false;
      return ['canal', 'producto', 'region', 'estado', 'municipio', 'segmento'].every(function (field) {
        return !filters[field] || row[field] === filters[field];
      });
    });

    var byDateGroups = Utils.groupBy(rows, 'fecha');
    var byHourGroups = Utils.groupBy(rows.filter(function (row) { return row.hora; }), 'hora');
    var byDate = Object.keys(byDateGroups).sort().map(function (date) {
      var list = byDateGroups[date];
      return {
        fecha: date,
        saldo: Utils.sum(list, 'saldo'),
        venta: Utils.sum(list, 'venta')
      };
    });
    var byHour = Object.keys(byHourGroups).sort().map(function (hour) {
      var list = byHourGroups[hour];
      return {
        hora: hour,
        saldo: Utils.sum(list, 'saldo'),
        venta: Utils.sum(list, 'venta')
      };
    });

    var last = byDate[byDate.length - 1] || { saldo: 0, venta: 0 };
    var previous = byDate[byDate.length - 2] || { saldo: 0, venta: 0 };
    var avg7 = movingAverage_(byDate, 7);
    var avg30 = movingAverage_(byDate, 30);

    return {
      totalRows: rows.length,
      kpis: {
        saldoHoy: last.saldo || 0,
        ventaHoy: last.venta || 0,
        variacionDiariaSaldo: calculateVariation_(last.saldo, previous.saldo),
        variacionDiariaVenta: calculateVariation_(last.venta, previous.venta),
        promedio7dSaldo: avg7.saldo,
        promedio7dVenta: avg7.venta,
        promedio30dSaldo: avg30.saldo,
        promedio30dVenta: avg30.venta
      },
      byDate: byDate,
      byHour: byHour,
      executiveSummary: buildHistoricalExecutiveSummary_(last, previous, avg7)
    };
  }

  function detectHistoricalAnomaliesAndAlert() {
    var summary = getSummary({});
    var drop = Math.abs(Number(summary.kpis.variacionDiariaVenta || 0));
    if (drop >= 15) {
      var alertRepo = new BaseRepository(APP_CONSTANTS.SHEETS.ALERTS);
      var alert = alertRepo.insert({
        tipo: 'DESVIO_HISTORICO_VENTAS',
        modulo: 'Historico',
        severidad: APP_CONSTANTS.ALERT_SEVERITY.WARNING,
        mensaje: summary.executiveSummary,
        destinatarios: AppConfig.get('ALERT_EMAILS', ''),
        fechaEnvio: Utils.formatDate(new Date()),
        entidadId: '',
        metadataJson: Utils.stringifyJson(summary.kpis)
      });
      MailService.sendAlert(alert);
      return alert;
    }
    return summary;
  }

  function normalizeHistoricalRow_(row, sourceName) {
    var normalized = {
      fecha: row.fecha,
      hora: row.hora || '',
      franjaHoraria: row.franjaHoraria || deriveTimeRange_(row.hora || ''),
      saldo: Number(row.saldo || 0),
      venta: Number(row.venta || 0),
      canal: row.canal || '',
      producto: row.producto || '',
      region: row.region || '',
      estado: row.estado || '',
      municipio: row.municipio || '',
      segmento: row.segmento || '',
      responsable: row.responsable || '',
      identificadorTecnico: row.identificadorTecnico || '',
      origenCarga: sourceName,
      timestampCarga: Utils.formatDate(new Date()),
      hashRegistro: ''
    };
    normalized.hashRegistro = Utils.hash([
      normalized.fecha, normalized.hora, normalized.saldo, normalized.venta, normalized.canal,
      normalized.producto, normalized.region, normalized.estado, normalized.municipio,
      normalized.segmento, normalized.identificadorTecnico
    ].join('|'));
    return normalized;
  }

  function deriveTimeRange_(hour) {
    if (!hour) return '';
    var parsed = Number(String(hour).split(':')[0]);
    if (isNaN(parsed)) return '';
    if (parsed < 6) return '00-05';
    if (parsed < 12) return '06-11';
    if (parsed < 18) return '12-17';
    return '18-23';
  }

  function calculateVariation_(current, previous) {
    current = Number(current || 0);
    previous = Number(previous || 0);
    if (!previous) return 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  function movingAverage_(list, window) {
    var chunk = list.slice(Math.max(0, list.length - window));
    return {
      saldo: Math.round(Utils.average(chunk, 'saldo') * 100) / 100,
      venta: Math.round(Utils.average(chunk, 'venta') * 100) / 100
    };
  }

  function buildHistoricalExecutiveSummary_(last, previous, avg7) {
    return 'Venta del ultimo dia: ' + Number(last.venta || 0).toFixed(2)
      + '. Variacion contra el dia previo: ' + calculateVariation_(last.venta, previous.venta) + '%.'
      + ' Promedio movil 7 dias: ' + Number(avg7.venta || 0).toFixed(2) + '.';
  }

  return {
    importRecords: importRecords,
    getSummary: getSummary,
    detectHistoricalAnomaliesAndAlert: detectHistoricalAnomaliesAndAlert
  };
})();
