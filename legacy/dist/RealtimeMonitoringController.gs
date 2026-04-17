function getRealtimeMonitoringDashboardController() {
  try {
    AuthService.getUserContext();
    return ApiResponse.success(RealtimeMonitoringService.getDashboard());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
