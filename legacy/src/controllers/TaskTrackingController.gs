function getTaskTrackingDashboardController(filters) {
  try {
    return ApiResponse.success(TaskTrackingService.getDashboard(filters || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveTeamTaskController(payload) {
  try {
    return ApiResponse.success(TaskTrackingService.saveTask(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function updateTeamTaskStatusController(payload) {
  try {
    return ApiResponse.success(TaskTrackingService.updateTaskStatus(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function runTaskReminderChecksController() {
  try {
    AuthService.requireAdmin();
    return ApiResponse.success(TaskTrackingService.sendDueSoonReminders());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
