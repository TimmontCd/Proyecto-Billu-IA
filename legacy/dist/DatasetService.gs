var DatasetService = (function () {
  function saveDataset(payload, userContext) {
    Utils.requireFields(payload, ['nombre', 'rows']);
    validateDatasetHeaders_(payload.rows);
    var datasetRepo = new BaseRepository(APP_CONSTANTS.SHEETS.DATASETS);
    var rowRepo = new BaseRepository(APP_CONSTANTS.SHEETS.DATASET_ROWS);

    var headers = Object.keys(payload.rows[0] || {});
    var dataset = datasetRepo.insert({
      nombre: payload.nombre,
      tipo: payload.tipo || 'CSV',
      estructuraJson: Utils.stringifyJson(headers),
      origen: payload.origen || 'MANUAL',
      fechaCarga: Utils.formatDate(new Date()),
      hojaOrigen: payload.hojaOrigen || '',
      ownerEmail: userContext.email
    });

    rowRepo.bulkInsert(payload.rows.map(function (row) {
      return {
        datasetId: dataset.id,
        technicalId: row.technicalId || row.id || Utils.generateId('ROW'),
        payloadJson: Utils.stringifyJson(row),
        periodo: row.periodo || row.fecha || '',
        canal: row.canal || '',
        categoria: row.categoria || '',
        estado: row.estado || '',
        municipio: row.municipio || '',
        montoAgregado: Number(row.montoAgregado || row.monto || 0)
      };
    }));

    AuditLogger.log('Dataset', dataset.id, 'CREATE', dataset, userContext.email);
    return dataset;
  }

  function queryDataset(payload) {
    Utils.requireFields(payload, ['datasetId', 'groupBy']);
    var rows = new BaseRepository(APP_CONSTANTS.SHEETS.DATASET_ROWS).query({ datasetId: payload.datasetId }).map(function (row) {
      return Utils.parseJson(row.payloadJson, {});
    });

    rows = rows.filter(function (row) {
      return Object.keys(payload.filters || {}).every(function (key) {
        return !payload.filters[key] || String(row[key]) === String(payload.filters[key]);
      });
    });

    var grouped = Utils.groupBy(rows, payload.groupBy);
    return Object.keys(grouped).map(function (key) {
      return {
        key: key,
        totalRegistros: grouped[key].length,
        montoAgregado: Utils.sum(grouped[key], payload.metric || 'montoAgregado')
      };
    }).sort(function (a, b) { return b.totalRegistros - a.totalRegistros; });
  }

  function validateDatasetHeaders_(rows) {
    if (!rows || !rows.length) throw new Error('No hay registros para cargar.');
    Object.keys(rows[0]).forEach(function (field) {
      if (APP_CONSTANTS.BLOCKED_ANALYTICS_FIELDS.indexOf(String(field).toLowerCase()) > -1) {
        throw new Error('Campo no permitido para analitica no sensible: ' + field);
      }
    });
  }

  return {
    saveDataset: saveDataset,
    queryDataset: queryDataset
  };
})();
