var DashboardService = (function () {
  function getDashboard(userContext) {
    var projectSummary = ProjectService.getPortfolioSummary(userContext);
    var alertRepo = new BaseRepository(APP_CONSTANTS.SHEETS.ALERTS);
    var alerts = alertRepo.getAll().slice(-10).reverse();
    var analyses = new BaseRepository(APP_CONSTANTS.SHEETS.FUNCTIONAL_ANALYSES).getAll().slice(-5).reverse();
    var minutes = new BaseRepository(APP_CONSTANTS.SHEETS.MINUTES).getAll().slice(-5).reverse();
    var funnelSummary = FunnelService.getSummary({});
    var historicalSummary = HistoricalService.getSummary({});

    return {
      user: userContext,
      projectSummary: projectSummary,
      alerts: alerts,
      analyses: analyses,
      minutes: minutes,
      funnelSummary: funnelSummary,
      historicalSummary: historicalSummary,
      appInfo: AppConfig.getAppInfo()
    };
  }

  return {
    getDashboard: getDashboard
  };
})();
