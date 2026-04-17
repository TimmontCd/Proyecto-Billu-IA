function getBootstrapData() {
  try {
    var userContext = AuthService.getUserContext();
    return ApiResponse.success({
      user: userContext,
      dashboard: DashboardService.getDashboard(userContext),
      catalogs: new BaseRepository(APP_CONSTANTS.SHEETS.CATALOGS).getAll()
    });
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function runBootstrapController() {
  try {
    AuthService.requireAdmin();
    return bootstrapControlTower();
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function runOperationalChecksController() {
  try {
    AuthService.requireAdmin();
    return ApiResponse.success(AlertService.runOperationalChecks());
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function invokeController(functionName, payload, sessionToken) {
  var safeName = String(functionName || '').trim();
  if (!safeName) {
    return ApiResponse.error('Controller name is required.');
  }

  var isAllowed = safeName === 'getBootstrapData' || /Controller$/.test(safeName);
  if (!isAllowed) {
    return ApiResponse.error('Controller not allowed: ' + safeName);
  }

  var targetFn = this[safeName];
  if (typeof targetFn !== 'function') {
    return ApiResponse.error('Controller not found: ' + safeName);
  }

  var isPublicAuthController = [
    'authLoginController',
    'authGetSessionController',
    'authRequestPasswordResetController',
    'authResetPasswordController'
  ].indexOf(safeName) > -1;

  if (!isPublicAuthController) {
    try {
      AuthService.getSessionContext(sessionToken, true);
    } catch (error) {
      return ApiResponse.error('AUTH_REQUIRED', { code: 'AUTH_REQUIRED' });
    }
  }

  AuthService.setRequestContext(sessionToken, !isPublicAuthController);
  try {
    return targetFn(payload);
  } catch (error) {
    return ApiResponse.error(error.message || 'Unexpected invoke error.');
  } finally {
    AuthService.clearRequestContext();
  }
}
