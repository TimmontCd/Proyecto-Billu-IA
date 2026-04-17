var AlertService = (function () {
  function runOperationalChecks() {
    var results = {
      funnel: runCheckSafely_(function () { return FunnelService.detectAnomaliesAndAlert(); }, 'funnel'),
      historical: runCheckSafely_(function () { return HistoricalService.detectHistoricalAnomaliesAndAlert(); }, 'historical'),
      projects: runCheckSafely_(detectDelayedProjects_, 'projects'),
      taskTracking: runCheckSafely_(function () { return TaskTrackingService.sendDueSoonReminders(); }, 'taskTracking'),
      realtimeMonitoring: runCheckSafely_(function () { return RealtimeMonitoringService.detectConfirmationOutageAndAlert(); }, 'realtimeMonitoring')
    };
    return results;
  }

  function detectDelayedProjects_() {
    var projects = new BaseRepository(APP_CONSTANTS.SHEETS.PROJECTS).getAll();
    var delayed = projects.filter(function (project) {
      return project.fechaCompromiso && new Date(project.fechaCompromiso) < new Date() && Number(project.avancePct || 0) < 100;
    });
    delayed.forEach(function (project) {
      MailService.sendProjectDelayAlert(project);
    });
    return delayed;
  }

  function runCheckSafely_(handler, moduleName) {
    try {
      return handler();
    } catch (error) {
      return {
        ok: false,
        module: moduleName,
        error: error.message
      };
    }
  }

  return {
    runOperationalChecks: runOperationalChecks
  };
})();
