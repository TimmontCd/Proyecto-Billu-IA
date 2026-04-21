function getWhatsAppAgentDashboardController() {
  try {
    return ApiResponse.success(WhatsAppAgentService.getDashboard());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function previewWhatsAppAgentMessageController(payload) {
  try {
    return ApiResponse.success(WhatsAppAgentService.previewMessage(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function markWhatsAppAgentNeedsHumanController(payload) {
  try {
    return ApiResponse.success(WhatsAppAgentService.markNeedsHuman(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getWhatsAppOutboundCampaignSummaryController() {
  try {
    return ApiResponse.success(WhatsAppAgentService.getOutboundCampaignSummary());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function runWhatsAppOutboundCampaignController(payload) {
  try {
    return ApiResponse.success(WhatsAppAgentService.sendOutboundCampaign(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
