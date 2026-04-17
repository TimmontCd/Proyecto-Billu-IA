var AnalyticsService = (function () {
  function getExecutiveSnapshot() {
    if (!AppConfig.getAppInfo().enableGa4) {
      return {
        enabled: false,
        message: 'La integracion GA4 esta deshabilitada en Script Properties.'
      };
    }

    var propertyId = AppConfig.getGa4PropertyId();
    var snapshot = {
      enabled: true,
      propertyId: propertyId,
      kpis: [],
      topEvents: []
    };

    snapshot.kpis = [
      runReport({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'eventCount' }]
      })
    ];

    snapshot.topEvents = runReport({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      limit: 10
    });

    return snapshot;
  }

  function runReport(payload) {
    return requestDataApi_('runReport', payload);
  }

  function runRealtimeReport(payload) {
    return requestDataApi_('runRealtimeReport', payload);
  }

  function requestDataApi_(methodName, payload) {
    var propertyId = AppConfig.getGa4PropertyId();
    if (!propertyId) {
      throw new Error('No se encontro configurado el GA4 property ID.');
    }
    var url = 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':' + methodName;
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code >= 300) {
      throw new Error('GA4 API error (' + propertyId + '): ' + body);
    }
    return Utils.parseJson(body, {});
  }

  return {
    getExecutiveSnapshot: getExecutiveSnapshot,
    runReport: runReport,
    runRealtimeReport: runRealtimeReport
  };
})();
