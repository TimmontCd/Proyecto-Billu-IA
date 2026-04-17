function saveFunnelEventController(payload) {
  try {
    return ApiResponse.success(FunnelService.saveEvent(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getFunnelSummaryController(filters) {
  try {
    return ApiResponse.success(FunnelService.getSummary(filters || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getGa4SnapshotController() {
  try {
    AuthService.requireAdmin();
    return ApiResponse.success(AnalyticsService.getExecutiveSnapshot());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
