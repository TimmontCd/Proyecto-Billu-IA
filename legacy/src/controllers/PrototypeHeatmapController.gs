function getPrototypeHeatmapDashboardController(payload) {
  try {
    AuthService.getUserContext();
    return ApiResponse.success(PrototypeHeatmapService.getDashboard(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function savePrototypeHeatmapEventController(payload) {
  try {
    return ApiResponse.success(
      PrototypeHeatmapService.saveEvent(payload || {}, AuthService.getUserContext())
    );
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function resetPrototypeHeatmapPilotController() {
  try {
    AuthService.requireAdmin();
    return ApiResponse.success(PrototypeHeatmapService.resetPilotData());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
