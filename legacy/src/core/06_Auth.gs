var AuthService = (function () {
  var REQUEST_CONTEXT = {
    sessionToken: '',
    enforceSession: false
  };

  function getCurrentEmail() {
    var email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    return Utils.normalizeEmail(email);
  }

  function getUserRepository_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.USERS);
  }

  function getSessionCache_() {
    return CacheService.getScriptCache();
  }

  function getSessionCacheKey_(token) {
    return 'AUTH_SESSION_' + Utils.hash(String(token || ''));
  }

  function getResetTokenHash_(email, rawToken) {
    return Utils.hash([Utils.normalizeEmail(email), String(rawToken || '')].join('::'));
  }

  function asBool_(value, fallback) {
    if (value === true || value === false) return value;
    var text = String(value || '').trim().toLowerCase();
    if (!text) return fallback;
    if (['true', '1', 'si', 'sí', 'yes', 'y'].indexOf(text) > -1) return true;
    if (['false', '0', 'no', 'n'].indexOf(text) > -1) return false;
    return fallback;
  }

  function parseRoles_(user) {
    if (!user) return [];
    var fromJson = Utils.parseJson(user.rolesJson, []);
    var roles = Array.isArray(fromJson) ? fromJson.slice() : [];
    if (user.rolId) roles.push(String(user.rolId).trim().toUpperCase());
    if (!roles.length) roles.push(APP_CONSTANTS.ROLES.OPERATOR);
    var unique = {};
    return roles
      .map(function (item) { return String(item || '').trim().toUpperCase(); })
      .filter(function (item) { return !!item; })
      .filter(function (item) {
        if (unique[item]) return false;
        unique[item] = true;
        return true;
      });
  }

  function hasRole_(context, roleId) {
    if (!context || !roleId) return false;
    var safeRole = String(roleId || '').trim().toUpperCase();
    if (String(context.role || '').trim().toUpperCase() === safeRole) return true;
    var roles = context.roles || [];
    return roles.indexOf(safeRole) > -1;
  }

  function isUserEnabled_(user) {
    if (!user) return false;
    if (String(user.status || '').trim().toUpperCase() !== APP_CONSTANTS.STATUS.ACTIVE) return false;
    return asBool_(user.activo, true);
  }

  function normalizeUserRecord_(user) {
    if (!user) return null;
    var roles = parseRoles_(user);
    var primaryRole = roles.indexOf(APP_CONSTANTS.ROLES.ADMIN) > -1
      ? APP_CONSTANTS.ROLES.ADMIN
      : (roles[0] || APP_CONSTANTS.ROLES.OPERATOR);
    return {
      id: user.id,
      email: Utils.normalizeEmail(user.email),
      name: user.nombre || user.email || '',
      role: primaryRole,
      roles: roles,
      area: user.area || '',
      scope: Utils.parseJson(user.alcanceJson, {}),
      mustChangePassword: asBool_(user.mustChangePassword, false),
      passwordUpdatedAt: user.passwordUpdatedAt || '',
      failedLoginAttempts: Number(user.failedLoginAttempts || 0),
      lockedUntil: user.lockedUntil || '',
      raw: user
    };
  }

  function validateDomain_(email) {
    var allowedDomains = AppConfig.getAllowedDomains();
    if (!allowedDomains.length) return true;
    var domain = String(email || '').split('@')[1] || '';
    return allowedDomains.indexOf(domain.toLowerCase()) > -1;
  }

  function isApprovedExternalEmail_(email) {
    return AppConfig.getAllowedExternalEmails().indexOf(Utils.normalizeEmail(email)) !== -1;
  }

  function getUserByEmail_(email) {
    var safeEmail = Utils.normalizeEmail(email);
    if (!safeEmail) return null;
    var user = getUserRepository_().query({ email: safeEmail })[0];
    if (!user) return null;
    return normalizeUserRecord_(user);
  }

  function createPasswordSalt_() {
    return Utilities.getUuid().replace(/-/g, '');
  }

  function hashPassword_(password, salt) {
    return Utils.hash([String(salt || ''), String(password || '')].join('::'));
  }

  function isPasswordConfigured_(user) {
    return !!(user && user.raw && user.raw.passwordHash && user.raw.passwordSalt);
  }

  function isPasswordExpired_(user) {
    if (!user || !user.passwordUpdatedAt) return true;
    var maxDays = Number(AppConfig.getAuthPasswordMaxAgeDays() || APP_CONSTANTS.AUTH.PASSWORD_MAX_AGE_DAYS);
    if (!maxDays || maxDays < 1) return false;
    var updatedAt = new Date(user.passwordUpdatedAt);
    if (!(updatedAt instanceof Date) || isNaN(updatedAt.getTime())) return true;
    var ageMs = new Date().getTime() - updatedAt.getTime();
    return ageMs > (maxDays * 24 * 60 * 60 * 1000);
  }

  function validatePasswordPolicy(password) {
    var value = String(password || '');
    var minLength = Number(AppConfig.getAuthPasswordMinLength() || APP_CONSTANTS.AUTH.PASSWORD_MIN_LENGTH);
    if (value.length < minLength) {
      throw new Error('La contraseña debe tener al menos ' + minLength + ' caracteres.');
    }
    if (!/[A-Z]/.test(value)) throw new Error('La contraseña debe incluir al menos una mayúscula.');
    if (!/[0-9]/.test(value)) throw new Error('La contraseña debe incluir al menos un número.');
    if (!/[^A-Za-z0-9]/.test(value)) throw new Error('La contraseña debe incluir al menos un símbolo.');
  }

  function lockIsActive_(user) {
    if (!user || !user.lockedUntil) return false;
    var lockDate = new Date(user.lockedUntil);
    if (!(lockDate instanceof Date) || isNaN(lockDate.getTime())) return false;
    return lockDate.getTime() > new Date().getTime();
  }

  function createSession_(user) {
    var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    var now = new Date();
    var ttlMinutes = Number(AppConfig.getAuthSessionTtlMinutes() || APP_CONSTANTS.AUTH.SESSION_TTL_MINUTES);
    var idleMinutes = Number(AppConfig.getAuthIdleTtlMinutes() || APP_CONSTANTS.AUTH.IDLE_TTL_MINUTES);
    var absoluteExpiresAt = now.getTime() + (ttlMinutes * 60 * 1000);
    var idleExpiresAt = Math.min(absoluteExpiresAt, now.getTime() + (idleMinutes * 60 * 1000));
    var payload = {
      tokenVersion: 1,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles || [user.role],
      area: user.area || '',
      scope: user.scope || {},
      issuedAt: now.toISOString(),
      absoluteExpiresAt: new Date(absoluteExpiresAt).toISOString(),
      idleExpiresAt: new Date(idleExpiresAt).toISOString()
    };
    var ttlSeconds = Math.max(60, Math.floor((absoluteExpiresAt - now.getTime()) / 1000));
    getSessionCache_().put(getSessionCacheKey_(token), JSON.stringify(payload), ttlSeconds);
    return {
      sessionToken: token,
      session: payload
    };
  }

  function getSessionContext(sessionToken, touchSession) {
    var token = String(sessionToken || '').trim();
    if (!token) throw new Error('AUTH_REQUIRED');
    var cacheValue = getSessionCache_().get(getSessionCacheKey_(token));
    if (!cacheValue) throw new Error('AUTH_REQUIRED');
    var session = Utils.parseJson(cacheValue, null);
    if (!session) throw new Error('AUTH_REQUIRED');

    var now = new Date();
    var absoluteExpiresAt = new Date(session.absoluteExpiresAt || 0);
    var idleExpiresAt = new Date(session.idleExpiresAt || 0);
    if (isNaN(absoluteExpiresAt.getTime()) || absoluteExpiresAt.getTime() <= now.getTime()) {
      getSessionCache_().remove(getSessionCacheKey_(token));
      throw new Error('AUTH_EXPIRED');
    }
    if (isNaN(idleExpiresAt.getTime()) || idleExpiresAt.getTime() <= now.getTime()) {
      getSessionCache_().remove(getSessionCacheKey_(token));
      throw new Error('AUTH_EXPIRED');
    }

    if (touchSession !== false) {
      var idleMinutes = Number(AppConfig.getAuthIdleTtlMinutes() || APP_CONSTANTS.AUTH.IDLE_TTL_MINUTES);
      var absoluteTs = absoluteExpiresAt.getTime();
      var nextIdleTs = Math.min(absoluteTs, now.getTime() + (idleMinutes * 60 * 1000));
      session.idleExpiresAt = new Date(nextIdleTs).toISOString();
      var ttlSeconds = Math.max(60, Math.floor((absoluteTs - now.getTime()) / 1000));
      getSessionCache_().put(getSessionCacheKey_(token), JSON.stringify(session), ttlSeconds);
    }

    return {
      email: Utils.normalizeEmail(session.email),
      name: session.name || session.email || '',
      role: String(session.role || APP_CONSTANTS.ROLES.OPERATOR).toUpperCase(),
      roles: Array.isArray(session.roles) ? session.roles : [String(session.role || APP_CONSTANTS.ROLES.OPERATOR).toUpperCase()],
      area: session.area || '',
      scope: session.scope || {},
      session: session
    };
  }

  function invalidateSession(sessionToken) {
    var token = String(sessionToken || '').trim();
    if (!token) return;
    getSessionCache_().remove(getSessionCacheKey_(token));
  }

  function updateLoginFailure_(user, lockAfterFailure) {
    if (!user || !user.raw) return;
    var attempts = Number(user.failedLoginAttempts || 0) + 1;
    var patch = {
      failedLoginAttempts: attempts
    };
    var maxAttempts = Number(AppConfig.getAuthLockMaxAttempts() || APP_CONSTANTS.AUTH.LOCK_MAX_ATTEMPTS);
    if (lockAfterFailure && maxAttempts > 0 && attempts >= maxAttempts) {
      var lockMinutes = Number(AppConfig.getAuthLockMinutes() || APP_CONSTANTS.AUTH.LOCK_MINUTES);
      var lockUntil = new Date(new Date().getTime() + (lockMinutes * 60 * 1000));
      patch.lockedUntil = lockUntil.toISOString();
    }
    getUserRepository_().update(user.id, patch);
  }

  function clearLoginFailure_(user) {
    if (!user || !user.raw) return;
    getUserRepository_().update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: ''
    });
  }

  function setUserPassword(email, newPassword, mustChangePassword) {
    var user = getUserByEmail_(email);
    if (!user || !isUserEnabled_(user.raw)) throw new Error('Usuario no encontrado o inactivo.');
    validatePasswordPolicy(newPassword);
    var salt = createPasswordSalt_();
    var passwordHash = hashPassword_(newPassword, salt);
    var nowIso = new Date().toISOString();
    getUserRepository_().update(user.id, {
      passwordSalt: salt,
      passwordHash: passwordHash,
      passwordUpdatedAt: nowIso,
      mustChangePassword: mustChangePassword ? 'true' : 'false',
      failedLoginAttempts: 0,
      lockedUntil: '',
      passwordResetTokenHash: '',
      passwordResetRequestedAt: ''
    });
    return true;
  }

  function authenticate(email, password) {
    var safeEmail = Utils.normalizeEmail(email);
    var plainPassword = String(password || '');
    if (!safeEmail || !plainPassword) throw new Error('Captura correo y contraseña.');

    var user = getUserByEmail_(safeEmail);
    if (!user || !isUserEnabled_(user.raw)) {
      throw new Error('Credenciales inválidas.');
    }

    if (lockIsActive_(user)) {
      throw new Error('Tu usuario está bloqueado temporalmente. Intenta más tarde.');
    }

    if (!isPasswordConfigured_(user)) {
      throw new Error('Tu usuario no tiene contraseña configurada. Solicita recuperación.');
    }

    var expectedHash = String(user.raw.passwordHash || '');
    var computedHash = hashPassword_(plainPassword, String(user.raw.passwordSalt || ''));
    if (expectedHash !== computedHash) {
      updateLoginFailure_(user, true);
      throw new Error('Credenciales inválidas.');
    }

    clearLoginFailure_(user);
    var sessionResult = createSession_(user);
    var nowIso = new Date().toISOString();
    getUserRepository_().update(user.id, {
      lastLoginAt: nowIso
    });
    return {
      sessionToken: sessionResult.sessionToken,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        roles: user.roles,
        area: user.area,
        scope: user.scope
      },
      mustChangePassword: asBool_(user.raw.mustChangePassword, false) || isPasswordExpired_(user)
    };
  }

  function getLegacyUserContext_() {
    var email = getCurrentEmail();
    if (!email) throw new Error('No fue posible resolver el correo del usuario activo.');

    var userRepo = getUserRepository_();
    var userRecord = userRepo.query({ email: email, status: APP_CONSTANTS.STATUS.ACTIVE })[0];

    if (!userRecord) {
      var canUseExternalAllowlist = isApprovedExternalEmail_(email);
      if (!validateDomain_(email) && !canUseExternalAllowlist) {
        throw new Error('El correo no pertenece a un dominio autorizado ni esta registrado en la plataforma.');
      }
      var fallbackAdmin = Utils.normalizeEmail(AppConfig.get('DEFAULT_ADMIN_EMAIL', ''));
      var canAutoRegisterAsAdmin = !userRepo.getAll().length || (fallbackAdmin && fallbackAdmin === email);
      if (canAutoRegisterAsAdmin) {
        userRecord = userRepo.insert({
          id: Utils.generateId('USR'),
          email: email,
          nombre: email,
          rolId: APP_CONSTANTS.ROLES.ADMIN,
          rolesJson: Utils.stringifyJson([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPERATOR]),
          area: 'Direccion',
          activo: true,
          alcanceJson: Utils.stringifyJson({ all: true }),
          createdAt: Utils.formatDate(new Date()),
          updatedAt: Utils.formatDate(new Date()),
          createdBy: email,
          status: APP_CONSTANTS.STATUS.ACTIVE
        });
      } else if (canUseExternalAllowlist) {
        userRecord = userRepo.insert({
          id: Utils.generateId('USR'),
          email: email,
          nombre: email,
          rolId: APP_CONSTANTS.ROLES.OPERATOR,
          rolesJson: Utils.stringifyJson([APP_CONSTANTS.ROLES.OPERATOR]),
          area: 'Operacion',
          activo: true,
          alcanceJson: Utils.stringifyJson({ all: true }),
          createdAt: Utils.formatDate(new Date()),
          updatedAt: Utils.formatDate(new Date()),
          createdBy: fallbackAdmin || email,
          status: APP_CONSTANTS.STATUS.ACTIVE
        });
      } else {
        throw new Error('Usuario no registrado en la plataforma.');
      }
    }

    var user = normalizeUserRecord_(userRecord);
    return {
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.roles,
      area: user.area,
      scope: user.scope
    };
  }

  function getUserContext() {
    var authEnabled = AppConfig.getAuthLoginEnabled();
    var isInvokeFlow = !!(REQUEST_CONTEXT && REQUEST_CONTEXT.enforceSession);
    if (authEnabled && isInvokeFlow) {
      return getSessionContext(REQUEST_CONTEXT.sessionToken || '', true);
    }
    return getLegacyUserContext_();
  }

  function requireAdmin() {
    var context = getUserContext();
    if (!hasRole_(context, APP_CONSTANTS.ROLES.ADMIN)) {
      throw new Error('Operacion permitida solo para administradores.');
    }
    return context;
  }

  function changePassword(sessionToken, currentPassword, nextPassword) {
    var context = getSessionContext(sessionToken, true);
    var user = getUserByEmail_(context.email);
    if (!user || !isUserEnabled_(user.raw)) throw new Error('Usuario no disponible.');
    if (!isPasswordConfigured_(user)) throw new Error('Tu usuario no tiene contraseña configurada.');
    var currentHash = hashPassword_(String(currentPassword || ''), String(user.raw.passwordSalt || ''));
    if (currentHash !== String(user.raw.passwordHash || '')) {
      throw new Error('La contraseña actual no es correcta.');
    }
    setUserPassword(context.email, nextPassword, false);
    return {
      email: context.email,
      passwordChanged: true
    };
  }

  function requestPasswordReset(email) {
    var safeEmail = Utils.normalizeEmail(email);
    if (!safeEmail) {
      return { requested: true };
    }

    var user = getUserByEmail_(safeEmail);
    if (!user || !isUserEnabled_(user.raw)) {
      return { requested: true };
    }

    var rawToken = Utilities.getUuid().replace(/-/g, '').slice(0, 24);
    var tokenHash = getResetTokenHash_(safeEmail, rawToken);
    var nowIso = new Date().toISOString();
    getUserRepository_().update(user.id, {
      passwordResetTokenHash: tokenHash,
      passwordResetRequestedAt: nowIso
    });

    var subject = 'Recuperación de contraseña - IA Billú';
    var body = [
      'Hola ' + (user.name || safeEmail) + ',',
      '',
      'Recibimos una solicitud para restablecer tu contraseña.',
      'Código temporal: ' + rawToken,
      '',
      'Este código vence en ' + Number(AppConfig.getAuthResetTokenTtlMinutes() || APP_CONSTANTS.AUTH.RESET_TOKEN_TTL_MINUTES) + ' minutos.',
      'Si no solicitaste este cambio, ignora este correo.'
    ].join('\n');
    try {
      MailService.sendEmail(safeEmail, subject, body);
    } catch (error) {}

    return { requested: true };
  }

  function resetPasswordWithToken(email, resetToken, newPassword) {
    var safeEmail = Utils.normalizeEmail(email);
    var safeToken = String(resetToken || '').trim();
    if (!safeEmail || !safeToken) throw new Error('Debes capturar correo y código.');

    var user = getUserByEmail_(safeEmail);
    if (!user || !isUserEnabled_(user.raw)) throw new Error('Código inválido o vencido.');
    if (!user.raw.passwordResetTokenHash || !user.raw.passwordResetRequestedAt) {
      throw new Error('Código inválido o vencido.');
    }

    var issuedAt = new Date(user.raw.passwordResetRequestedAt);
    if (!(issuedAt instanceof Date) || isNaN(issuedAt.getTime())) {
      throw new Error('Código inválido o vencido.');
    }
    var ttlMinutes = Number(AppConfig.getAuthResetTokenTtlMinutes() || APP_CONSTANTS.AUTH.RESET_TOKEN_TTL_MINUTES);
    var expiresAt = issuedAt.getTime() + (ttlMinutes * 60 * 1000);
    if (expiresAt < new Date().getTime()) {
      throw new Error('Código inválido o vencido.');
    }

    var expectedHash = String(user.raw.passwordResetTokenHash || '');
    var computedHash = getResetTokenHash_(safeEmail, safeToken);
    if (expectedHash !== computedHash) throw new Error('Código inválido o vencido.');

    setUserPassword(safeEmail, newPassword, false);
    return { changed: true };
  }

  function setRequestContext(sessionToken, enforceSession) {
    REQUEST_CONTEXT = {
      sessionToken: String(sessionToken || '').trim(),
      enforceSession: !!enforceSession
    };
  }

  function clearRequestContext() {
    REQUEST_CONTEXT = {
      sessionToken: '',
      enforceSession: false
    };
  }

  return {
    getCurrentEmail: getCurrentEmail,
    getUserContext: getUserContext,
    requireAdmin: requireAdmin,
    hasRole: hasRole_,
    setRequestContext: setRequestContext,
    clearRequestContext: clearRequestContext,
    authenticate: authenticate,
    getSessionContext: getSessionContext,
    invalidateSession: invalidateSession,
    changePassword: changePassword,
    requestPasswordReset: requestPasswordReset,
    resetPasswordWithToken: resetPasswordWithToken,
    setUserPassword: setUserPassword,
    validatePasswordPolicy: validatePasswordPolicy
  };
})();
