function saveDatasetController(payload) {
  try {
    return ApiResponse.success(DatasetService.saveDataset(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function queryDatasetController(payload) {
  try {
    return ApiResponse.success(DatasetService.queryDataset(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
