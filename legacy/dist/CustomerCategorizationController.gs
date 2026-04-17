function getCustomerCategorizationDashboardController() {
  try {
    return ApiResponse.success(CustomerCategorizationService.getDashboard());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function exportCustomerCategorizationSegmentController(payload) {
  try {
    return ApiResponse.success(CustomerCategorizationService.exportSegment(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function exportCustomerCategorizationCrossSellSegmentController(payload) {
  try {
    return ApiResponse.success(CustomerCategorizationService.exportCrossSellSegment(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function findCustomerCategorizationByRewardsIdController(payload) {
  try {
    return ApiResponse.success(CustomerCategorizationService.findByRewardsId(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
