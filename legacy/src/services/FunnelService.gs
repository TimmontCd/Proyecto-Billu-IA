var FunnelService = (function () {
  function saveEvent(payload, userContext) {
    Utils.requireFields(payload, ['fecha', 'paso', 'total']);
    var repo = new BaseRepository(APP_CONSTANTS.SHEETS.FUNNEL_EVENTS);
    var saved = repo.insert({
      fecha: payload.fecha,
      hora: payload.hora || '',
      paso: payload.paso,
      causaId: payload.causaId || '',
      canal: payload.canal || '',
      origen: payload.origen || '',
      total: Number(payload.total || 0),
      descripcionEvento: payload.descripcionEvento || '',
      metadataJson: Utils.stringifyJson(payload.metadata || {})
    });
    AuditLogger.log('EmbudoEvento', saved.id, 'CREATE', saved, userContext.email);
    return saved;
  }

  function getSummary(filters) {
    var events = filterEvents_(filters);
    var grouped = Utils.groupBy(events, 'paso');
    var steps = new BaseRepository(APP_CONSTANTS.SHEETS.FUNNEL_STEPS).getAll().sort(function (a, b) {
      return Number(a.orden || 0) - Number(b.orden || 0);
    });

    var byStep = steps.map(function (step, index) {
      var total = Utils.sum(grouped[step.nombre] || [], 'total');
      var prevStep = index === 0 ? null : steps[index - 1];
      var prevTotal = prevStep ? Utils.sum(grouped[prevStep.nombre] || [], 'total') : total;
      var conversion = prevTotal ? total / prevTotal : 1;
      return {
        step: step.nombre,
        total: total,
        conversion: Math.round(conversion * 10000) / 100
      };
    });

    var topCauses = Object.keys(Utils.groupBy(events.filter(function (item) { return item.causaId; }), 'causaId')).map(function (causeId) {
      var list = events.filter(function (item) { return item.causaId === causeId; });
      return { causeId: causeId, total: Utils.sum(list, 'total') };
    }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5);

    return {
      byStep: byStep,
      topCauses: topCauses,
      executiveSummary: buildExecutiveSummary_(byStep, topCauses)
    };
  }

  function detectAnomaliesAndAlert() {
    var summary = getTodayVsAverage_();
    if (!summary.step) return summary;
    if (summary.dropPct >= 15) {
      var alertRepo = new BaseRepository(APP_CONSTANTS.SHEETS.ALERTS);
      var record = alertRepo.insert({
        tipo: 'CAIDA_CONVERSION_FUNNEL',
        modulo: 'Embudo',
        severidad: APP_CONSTANTS.ALERT_SEVERITY.CRITICAL,
        mensaje: 'Hoy la mayor caida esta en ' + summary.step + '. La conversion cayo ' + summary.dropPct + '% contra el promedio de los ultimos 7 dias.',
        destinatarios: AppConfig.get('ALERT_EMAILS', ''),
        fechaEnvio: Utils.formatDate(new Date()),
        entidadId: summary.step,
        metadataJson: Utils.stringifyJson(summary)
      });
      MailService.sendAlert(record);
      return record;
    }
    return summary;
  }

  function filterEvents_(filters) {
    filters = filters || {};
    return new BaseRepository(APP_CONSTANTS.SHEETS.FUNNEL_EVENTS).getAll().filter(function (item) {
      if (filters.startDate && new Date(item.fecha) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(item.fecha) > new Date(filters.endDate)) return false;
      if (filters.canal && item.canal !== filters.canal) return false;
      return true;
    });
  }

  function buildExecutiveSummary_(byStep, topCauses) {
    if (!byStep.length) return 'Sin eventos suficientes para elaborar resumen.';
    var weakest = byStep.slice(1).sort(function (a, b) { return a.conversion - b.conversion; })[0] || byStep[0];
    var topCause = topCauses[0];
    return 'Hoy la mayor caida esta en ' + weakest.step + '. La conversion estimada del paso es ' + weakest.conversion + '%.'
      + (topCause ? ' La principal causa observada es ' + topCause.causeId + '.' : '');
  }

  function getTodayVsAverage_() {
    var events = new BaseRepository(APP_CONSTANTS.SHEETS.FUNNEL_EVENTS).getAll();
    var today = Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT);
    var sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    var todayEvents = events.filter(function (event) { return event.fecha === today; });
    var historical = events.filter(function (event) {
      var eventDate = new Date(event.fecha);
      return eventDate >= sevenDaysAgo && event.fecha !== today;
    });

    var byStepToday = Utils.groupBy(todayEvents, 'paso');
    var byStepHistorical = Utils.groupBy(historical, 'paso');
    var candidate = { step: '', dropPct: 0 };
    Object.keys(byStepToday).forEach(function (step) {
      var todayTotal = Utils.sum(byStepToday[step], 'total');
      var historicalGroup = byStepHistorical[step] || [];
      var dates = Utils.groupBy(historicalGroup, 'fecha');
      var dailyTotals = Object.keys(dates).map(function (date) { return Utils.sum(dates[date], 'total'); });
      var average = dailyTotals.length ? Utils.average(dailyTotals, function (value) { return value; }) : 0;
      var dropPct = average ? Math.round(((average - todayTotal) / average) * 100) : 0;
      if (dropPct > candidate.dropPct) candidate = { step: step, dropPct: dropPct, todayTotal: todayTotal, average: average };
    });
    return candidate;
  }

  return {
    saveEvent: saveEvent,
    getSummary: getSummary,
    detectAnomaliesAndAlert: detectAnomaliesAndAlert
  };
})();
