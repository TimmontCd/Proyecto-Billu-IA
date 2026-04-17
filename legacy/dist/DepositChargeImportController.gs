function importDepositChargeBundleController() {
  try {
    AuthService.requireAdmin();
    return ApiResponse.success(DepositChargeImportService.importBundleFromDrive());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function importDepositChargeManualSheetController() {
  try {
    AuthService.requireAdmin();
    return ApiResponse.success(DepositChargeImportService.importFromManualSheet());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function uploadDepositChargeWorkbookController(payload) {
  try {
    return ApiResponse.success(DepositChargeImportService.uploadWorkbookAndSummarize(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
