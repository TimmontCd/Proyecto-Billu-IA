function getCampaignProgrammingDashboardController() {
  try {
    return ApiResponse.success(CampaignProgrammingService.getDashboard());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function previewCampaignProgrammingEmailController(payload) {
  try {
    return ApiResponse.success(CampaignProgrammingService.previewEmail(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveCampaignProgrammingController(payload) {
  try {
    return ApiResponse.success(CampaignProgrammingService.saveCampaign(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function deleteCampaignProgrammingController(payload) {
  try {
    return ApiResponse.success(CampaignProgrammingService.deleteCampaign(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function sendCampaignProgrammingController(payload) {
  try {
    return ApiResponse.success(CampaignProgrammingService.sendBirthdayCampaign(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
