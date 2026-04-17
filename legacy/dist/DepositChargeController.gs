function getDepositChargeDashboardController() {
  try {
    var result = DepositChargeCorrelationService.getModuleDashboard();
    return ApiResponse.success(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function rebuildDepositChargeDashboardController() {
  try {
    var result = DepositChargeCorrelationService.rebuildSummaryFromRaw();
    return ApiResponse.success(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function runDepositChargePresetController(payload) {
  try {
    var result = DepositChargeCorrelationService.runPresetQuery(payload || {});
    return ApiResponse.success(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getDepositChargeClientViewController(payload) {
  try {
    var result = DepositChargeCorrelationService.getClientView(payload || {});
    return ApiResponse.success(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function exportDepositChargePresetController(payload) {
  try {
    var result = DepositChargeCorrelationService.exportPresetClientNumbers(payload || {});
    return ApiResponse.success(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function inspectDepositChargeSheetsController() {
  try {
    AuthService.requireAdmin();
    var result = DepositChargeDebugService.inspectSheets();
    return ApiResponse.success(JSON.parse(JSON.stringify(result)));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
