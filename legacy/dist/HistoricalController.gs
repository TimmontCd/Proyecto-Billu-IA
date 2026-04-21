function importHistoricalController(payload) {
  try {
    return ApiResponse.success(HistoricalService.importRecords(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getHistoricalSummaryController(filters) {
  try {
    return ApiResponse.success(HistoricalService.getSummary(filters || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
