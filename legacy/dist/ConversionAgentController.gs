function getConversionAgentDashboardController() {
  try {
    return ApiResponse.success(ConversionAgentService.getDashboard());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function previewConversionAgentEmailController(payload) {
  try {
    return ApiResponse.success(ConversionAgentService.previewEmail(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function sendConversionAgentEmailController(payload) {
  try {
    return ApiResponse.success(ConversionAgentService.sendEmailToRecipient(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function sendConversionAgentBatchController(payload) {
  try {
    return ApiResponse.success(ConversionAgentService.sendBatch(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
