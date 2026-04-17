function getAccountsDashboardController() {
  try {
    return ApiResponse.success(AccountsService.getDashboard());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getAccountsHistoricalController(payload) {
  try {
    return ApiResponse.success(AccountsService.getHistorical(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function exportAccountsHistoricalMonthController(payload) {
  try {
    return ApiResponse.success(AccountsService.exportHistoricalMonth(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getAccountsFirst30Controller() {
  try {
    return ApiResponse.success(AccountsService.getFirst30Summary());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function exportAccountsFirst30MonthController(payload) {
  try {
    return ApiResponse.success(AccountsService.exportFirst30Month(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function exportAccountsCardCoverageController(payload) {
  try {
    return ApiResponse.success(AccountsService.exportCardCoverage(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
