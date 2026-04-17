function getTinchoDashboardController() {
  try {
    return ApiResponse.success(TinchoService.getDashboard(AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function askTinchoController(payload) {
  try {
    return ApiResponse.success(TinchoService.ask(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveTinchoFeedbackController(payload) {
  try {
    return ApiResponse.success(TinchoService.saveFeedback(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveTinchoManualController(payload) {
  try {
    return ApiResponse.success(TinchoService.saveManual(payload || {}, requireTinchoManager_()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveTinchoManualChunkController(payload) {
  try {
    return ApiResponse.success(TinchoService.saveManualChunk(payload || {}, requireTinchoManager_()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function finalizeTinchoManualUploadController(payload) {
  try {
    return ApiResponse.success(TinchoService.finalizeManualUpload(payload || {}, requireTinchoManager_()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveTinchoConfigController(payload) {
  try {
    return ApiResponse.success(TinchoService.saveConfig(payload || {}, requireTinchoManager_()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function syncTinchoManualsController(payload) {
  try {
    return ApiResponse.success(TinchoService.syncManuals(payload || {}, requireTinchoManager_()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function synthesizeTinchoAnswerController(payload) {
  try {
    AuthService.getUserContext();
    return ApiResponse.success(TinchoService.synthesizeAnswer(payload || {}));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function requireTinchoManager_() {
  var context = AuthService.getUserContext();
  if (!AuthService.hasRole(context, APP_CONSTANTS.ROLES.ADMIN) &&
    !AuthService.hasRole(context, APP_CONSTANTS.ROLES.OPERATOR)) {
    throw new Error('Operacion permitida solo para perfiles internos autorizados.');
  }
  return context;
}
