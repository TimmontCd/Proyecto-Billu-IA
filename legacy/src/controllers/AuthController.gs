function authLoginController(payload) {
  try {
    var safePayload = payload || {};
    var result = AuthService.authenticate(safePayload.email, safePayload.password);
    return ApiResponse.success(result, 'Sesión iniciada.');
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function authGetSessionController(payload) {
  try {
    var safePayload = payload || {};
    var context = AuthService.getSessionContext(safePayload.sessionToken, true);
    return ApiResponse.success({
      user: {
        email: context.email,
        name: context.name,
        role: context.role,
        roles: context.roles,
        area: context.area,
        scope: context.scope
      },
      session: context.session
    });
  } catch (error) {
    return ApiResponse.error('AUTH_REQUIRED', { code: 'AUTH_REQUIRED' });
  }
}

function authLogoutController(payload) {
  try {
    var safePayload = payload || {};
    AuthService.invalidateSession(safePayload.sessionToken);
    return ApiResponse.success({ loggedOut: true }, 'Sesión cerrada.');
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function authChangePasswordController(payload) {
  try {
    var safePayload = payload || {};
    var result = AuthService.changePassword(safePayload.sessionToken, safePayload.currentPassword, safePayload.newPassword);
    return ApiResponse.success(result, 'Contraseña actualizada.');
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function authRequestPasswordResetController(payload) {
  try {
    var safePayload = payload || {};
    var result = AuthService.requestPasswordReset(safePayload.email);
    return ApiResponse.success(result, 'Si el usuario existe, enviamos un código de recuperación.');
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function authResetPasswordController(payload) {
  try {
    var safePayload = payload || {};
    var result = AuthService.resetPasswordWithToken(safePayload.email, safePayload.resetToken, safePayload.newPassword);
    return ApiResponse.success(result, 'Contraseña restablecida.');
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
