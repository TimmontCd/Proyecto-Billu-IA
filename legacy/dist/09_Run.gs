function runBootstrap() {
  return bootstrapControlTower();
}

function runSmokeTest() {
  return {
    ok: true,
    appName: APP_CONSTANTS.APP_NAME,
    version: APP_CONSTANTS.VERSION,
    timestamp: new Date().toISOString()
  };
}

function runImportDepositsChargesBundle() {
  return importDepositChargeBundleController();
}

function runImportDepositsChargesManualSheet() {
  return importDepositChargeManualSheetController();
}

function runInspectDepositChargeSheets() {
  var result = DepositChargeDebugService.inspectSheets();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runRealtimeMonitoringAlertCheck() {
  var result = RealtimeMonitoringService.detectConfirmationOutageAndAlert();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runRealtimeMonitoringCacheSync() {
  var result = RealtimeMonitoringService.syncCache();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runRealtimeMonitoringLiveSync() {
  var result = RealtimeMonitoringService.syncLiveBuffer();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runInspectRealtimeDuplicateBuckets() {
  var result = RealtimeMonitoringService.inspectDuplicateBuckets();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runRepairRealtimeSheets() {
  var result = RealtimeMonitoringService.repairRealtimeSheets();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runRealtimeMonitoringRebuildTodayFromAudit() {
  var result = RealtimeMonitoringService.rebuildTodayCacheFromAudit();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runResetRealtimeAnalyticsBaseline() {
  var result = RealtimeMonitoringService.resetAnalyticsBaseline();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runDisableRealtimeAnalytics() {
  var result = {
    realtime: RealtimeMonitoringService.disableAnalyticsRealtime(),
    triggers: deleteRealtimeMonitoringTriggers_()
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runDailyMonitoringCleanup() {
  var result = {
    realtime: RealtimeMonitoringService.cleanupCacheForNewDay(),
    outlook: OutlookRealOpeningsService.cleanupSheet()
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runEnsureOutlookRealOpeningsSheet() {
  var result = OutlookRealOpeningsService.ensureSheet();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runReconnectOutlookToRealtimeSpreadsheet() {
  AppConfig.set('OUTLOOK_REAL_SPREADSHEET_ID', AppConfig.getRealtimeCacheSpreadsheetId());
  AppConfig.set('OUTLOOK_REAL_SHEET_NAME', AppConfig.getOutlookRealSheetName());
  var result = OutlookRealOpeningsService.ensureSheet();
  Logger.log(JSON.stringify(result, null, 2));
  return {
    ok: true,
    spreadsheetId: AppConfig.getRealtimeCacheSpreadsheetId(),
    sheetName: AppConfig.getOutlookRealSheetName(),
    ensure: result
  };
}

function runInspectProjectsSourceSpreadsheet() {
  var spreadsheet = SpreadsheetApp.openById(AppConfig.getProjectsSourceSpreadsheetId());
  var sheets = spreadsheet.getSheets().map(function (sheet) {
    var lastColumn = sheet.getLastColumn();
    var headers = lastColumn
      ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) { return String(value || '').trim(); })
      : [];
    return {
      sheetName: sheet.getName(),
      rows: sheet.getLastRow(),
      columns: sheet.getLastColumn(),
      headers: headers
    };
  });
  var projects = ProjectService.listProjects({}, { email: '', role: APP_CONSTANTS.ROLES.ADMIN });
  var result = {
    ok: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetName: spreadsheet.getName(),
    sheets: sheets,
    mappedProjects: projects.length,
    sampleProjects: projects.slice(0, 5).map(function (item) {
      return {
        id: item.id,
        folio: item.folio,
        nombre: item.nombre,
        estatus: item.estatus,
        prioridad: item.prioridad,
        semaforo: item.semaforo,
        incidentCriticalCount: item.incidentCriticalCount,
        pipelineDone: item.pipelineDone,
        pipelineBacklog: item.pipelineBacklog
      };
    })
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runGetOutlookWebhookConfig() {
  var result = OutlookRealOpeningsService.getWebhookConfig();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runRotateOutlookWebhookToken() {
  var result = OutlookRealOpeningsService.rotateToken();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runUpsertOperatorUsers(emailsCsv) {
  var context = AuthService.requireAdmin();
  var repository = new BaseRepository(APP_CONSTANTS.SHEETS.USERS);
  var emails = String(emailsCsv || '')
    .split(',')
    .map(function (item) { return Utils.normalizeEmail(item); })
    .filter(Boolean);

  var results = emails.map(function (email) {
    var existing = repository.query({ email: email })[0];
    if (existing) {
      return repository.update(existing.id, {
        email: email,
        nombre: existing.nombre || email,
        rolId: APP_CONSTANTS.ROLES.OPERATOR,
        area: existing.area || 'Operacion',
        activo: true,
        alcanceJson: existing.alcanceJson || Utils.stringifyJson({ all: true }),
        status: APP_CONSTANTS.STATUS.ACTIVE
      });
    }
    return repository.insert({
      id: Utils.generateId('USR'),
      email: email,
      nombre: email,
      rolId: APP_CONSTANTS.ROLES.OPERATOR,
      area: 'Operacion',
      activo: true,
      alcanceJson: Utils.stringifyJson({ all: true }),
      createdBy: context.email,
      status: APP_CONSTANTS.STATUS.ACTIVE
    });
  });

  Logger.log(JSON.stringify(results, null, 2));
  return {
    ok: true,
    total: results.length,
    users: results.map(function (item) {
      return {
        email: item.email,
        rolId: item.rolId,
        status: item.status
      };
    })
  };
}

function runUpsertNamedOperatorUsers(usersJson) {
  var context = AuthService.requireAdmin();
  var repository = new BaseRepository(APP_CONSTANTS.SHEETS.USERS);
  var users = Utils.parseJson(usersJson, []);

  if (!users || !users.length) {
    throw new Error('No se recibieron usuarios para registrar.');
  }

  var results = users
    .map(function (item) {
      return {
        email: Utils.normalizeEmail(item && item.email),
        nombre: String((item && item.nombre) || '').trim(),
        area: String((item && item.area) || 'Operacion').trim() || 'Operacion',
        rolId: String((item && item.rolId) || APP_CONSTANTS.ROLES.OPERATOR).trim() || APP_CONSTANTS.ROLES.OPERATOR
      };
    })
    .filter(function (item) {
      return item.email;
    })
    .map(function (item) {
      var existing = repository.query({ email: item.email })[0];
      if (existing) {
        return repository.update(existing.id, {
          email: item.email,
          nombre: item.nombre || existing.nombre || item.email,
          rolId: item.rolId || existing.rolId || APP_CONSTANTS.ROLES.OPERATOR,
          area: item.area || existing.area || 'Operacion',
          activo: true,
          alcanceJson: existing.alcanceJson || Utils.stringifyJson({ all: true }),
          status: APP_CONSTANTS.STATUS.ACTIVE
        });
      }

      return repository.insert({
        id: Utils.generateId('USR'),
        email: item.email,
        nombre: item.nombre || item.email,
        rolId: item.rolId || APP_CONSTANTS.ROLES.OPERATOR,
        area: item.area || 'Operacion',
        activo: true,
        alcanceJson: Utils.stringifyJson({ all: true }),
        createdBy: context.email,
        status: APP_CONSTANTS.STATUS.ACTIVE
      });
    });

  Logger.log(JSON.stringify(results, null, 2));
  return {
    ok: true,
    total: results.length,
    users: results.map(function (item) {
      return {
        email: item.email,
        nombre: item.nombre,
        rolId: item.rolId,
        area: item.area,
        status: item.status
      };
    })
  };
}

function runAddRequestedOperatorsMarch20() {
  return runUpsertOperatorUsers('juan.lara.casti@gmail.com,jadv0885@gmail.com');
}

function resolveLocalLoginSetupInvoker_(allowBootstrapBypass) {
  try {
    return AuthService.requireAdmin();
  } catch (error) {
    var currentEmail = Utils.normalizeEmail(AuthService.getCurrentEmail() || '');
    var bootstrapAdmins = [
      'martin.mercado@afirme.com',
      'david.arce@afirme.com',
      'valeria.trejo@afirme.com',
      'andrea.murillo@afirme.com',
      'edith.reyes@afirme.com',
      'juan.lara.castillo@afirme.com',
      'jose.villalobos@afirme.com',
      'miguel.munoz@afirme.com',
      'jose.sobrevia@afirme.com',
      'jorge.castillo@afirme.com',
      'martinmercado89@gmail.com',
      'billuredes@gmail.com'
    ].map(function (email) { return Utils.normalizeEmail(email); });

    if (bootstrapAdmins.indexOf(currentEmail) > -1) {
      return {
        email: currentEmail,
        role: APP_CONSTANTS.ROLES.ADMIN,
        roles: [APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPERATOR],
        area: 'Operacion',
        scope: { all: true }
      };
    }
    if (allowBootstrapBypass === true) {
      return {
        email: currentEmail || Utils.normalizeEmail(AppConfig.get('AUTH_BREAK_GLASS_EMAIL', '')) || 'bootstrap@local',
        role: APP_CONSTANTS.ROLES.ADMIN,
        roles: [APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPERATOR],
        area: 'Operacion',
        scope: { all: true }
      };
    }
    throw new Error('Operacion permitida solo para administradores. Correo detectado: ' + (currentEmail || '(sin correo en Session)'));
  }
}

function runSetupLocalLoginModule(tempPassword, forcedContext) {
  var context = forcedContext || resolveLocalLoginSetupInvoker_(false);
  var repository = new BaseRepository(APP_CONSTANTS.SHEETS.USERS);
  var safePassword = String(tempPassword || '').trim() || 'Billu#Temporal2026';
  var users = [
    'martin.mercado@afirme.com',
    'david.arce@afirme.com',
    'valeria.trejo@afirme.com',
    'andrea.murillo@afirme.com',
    'edith.reyes@afirme.com',
    'juan.lara.castillo@afirme.com',
    'jose.villalobos@afirme.com',
    'miguel.munoz@afirme.com',
    'jose.sobrevia@afirme.com',
    'jorge.castillo@afirme.com'
  ]
    .map(function (email) { return Utils.normalizeEmail(email); })
    .filter(Boolean);

  AppConfig.setAll({
    AUTH_LOGIN_ENABLED: 'true',
    AUTH_SESSION_TTL_MINUTES: '180',
    AUTH_IDLE_TTL_MINUTES: '30',
    AUTH_PASSWORD_MAX_AGE_DAYS: '90',
    AUTH_PASSWORD_MIN_LENGTH: '10',
    AUTH_RESET_TOKEN_TTL_MINUTES: '15',
    AUTH_LOCK_MAX_ATTEMPTS: '5',
    AUTH_LOCK_MINUTES: '15',
    AUTH_BREAK_GLASS_EMAIL: 'martin.mercado@afirme.com'
  });

  var updatedUsers = users.map(function (email) {
    var existing = repository.query({ email: email })[0];
    var nombre = existing && existing.nombre
      ? existing.nombre
      : email.split('@')[0].split('.').map(function (part) {
        return part ? (part.charAt(0).toUpperCase() + part.slice(1)) : '';
      }).join(' ');
    var payload = {
      email: email,
      nombre: nombre || email,
      rolId: APP_CONSTANTS.ROLES.ADMIN,
      rolesJson: Utils.stringifyJson([APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPERATOR]),
      area: (existing && existing.area) || 'Operacion',
      activo: true,
      alcanceJson: (existing && existing.alcanceJson) || Utils.stringifyJson({ all: true }),
      status: APP_CONSTANTS.STATUS.ACTIVE
    };

    var userRecord = existing
      ? repository.update(existing.id, payload)
      : repository.insert(Object.assign({}, payload, {
        id: Utils.generateId('USR'),
        createdBy: context.email
      }));

    AuthService.setUserPassword(email, safePassword, true);
    return {
      id: userRecord.id,
      email: userRecord.email,
      nombre: userRecord.nombre,
      rolId: userRecord.rolId
    };
  });

  return {
    ok: true,
    configured: {
      authLoginEnabled: true,
      sessionHours: Number(AppConfig.getAuthSessionTtlMinutes()) / 60,
      idleMinutes: Number(AppConfig.getAuthIdleTtlMinutes()),
      passwordMaxAgeDays: Number(AppConfig.getAuthPasswordMaxAgeDays())
    },
    users: updatedUsers
  };
}

function runSetupLocalLoginModuleDefault() {
  var defaultPassword = AppConfig.get('AUTH_BOOTSTRAP_TEMP_PASSWORD', 'Billu#GoLive2026');
  var fallbackEmail = Utils.normalizeEmail(AuthService.getCurrentEmail() || '')
    || Utils.normalizeEmail(AppConfig.get('AUTH_BREAK_GLASS_EMAIL', ''))
    || 'martin.mercado@afirme.com';
  var context = {
    email: fallbackEmail,
    role: APP_CONSTANTS.ROLES.ADMIN,
    roles: [APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPERATOR],
    area: 'Operacion',
    scope: { all: true }
  };
  return runSetupLocalLoginModule(defaultPassword, context);
}

function runSetupLocalLoginModuleEmergency() {
  var defaultPassword = AppConfig.get('AUTH_BOOTSTRAP_TEMP_PASSWORD', 'Billu#GoLive2026');
  var email = Utils.normalizeEmail(AuthService.getCurrentEmail() || '')
    || Utils.normalizeEmail(AppConfig.get('AUTH_BREAK_GLASS_EMAIL', ''))
    || 'martin.mercado@afirme.com';
  var forcedContext = {
    email: email,
    role: APP_CONSTANTS.ROLES.ADMIN,
    roles: [APP_CONSTANTS.ROLES.ADMIN, APP_CONSTANTS.ROLES.OPERATOR],
    area: 'Operacion',
    scope: { all: true }
  };
  return runSetupLocalLoginModule(defaultPassword, forcedContext);
}

function runFormatCustomerCategorizationCurrencyColumns() {
  var result = CustomerCategorizationService.formatSourceCurrencyColumns();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runInspectCustomerCategorizationAgeStats() {
  var dashboard = CustomerCategorizationService.getDashboard();
  var segmentSummary = dashboard.segmentSummary || [];
  var rows = (dashboard.sourceRows || dashboard.rows || []);
  var summary = segmentSummary.map(function (segment) {
    return {
      segmentId: segment.segmentId,
      segmentLabel: segment.segmentLabel,
      clients: segment.clients,
      validAgeClients: segment.validAgeClients,
      averageAge: segment.averageAge,
      malePct: segment.malePct,
      femalePct: segment.femalePct
    };
  });

  Logger.log(JSON.stringify(summary, null, 2));
  return {
    ok: true,
    segmentSummary: summary,
    totalRows: rows.length || null
  };
}

function runBirthdayCampaignDaily() {
  var result = CampaignProgrammingService.runDailyCampaigns();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function installBirthdayCampaignDailyTrigger() {
  var handler = 'runBirthdayCampaignDaily';
  var deleted = deleteBirthdayCampaignDailyTriggers_();
  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyDays(1)
    .atHour(17)
    .nearMinute(10)
    .inTimezone(Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE)
    .create();
  return {
    ok: true,
    handler: handler,
    schedule: 'Diario 17:10',
    deletedTriggers: deleted.deleted,
    triggers: ScriptApp.getProjectTriggers().filter(function (trigger) {
      return trigger.getHandlerFunction() === handler;
    }).length
  };
}

function deleteBirthdayCampaignDailyTriggers_() {
  var handlers = {
    runBirthdayCampaignDaily: true
  };
  var existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return handlers[trigger.getHandlerFunction()] === true;
  });
  existing.forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  return {
    deleted: existing.length,
    remaining: ScriptApp.getProjectTriggers().filter(function (trigger) {
      return handlers[trigger.getHandlerFunction()] === true;
    }).length
  };
}

function runMonthlyBalanceSync() {
  var result = MonthlyBalanceSyncService.syncCurrentMonthBalances();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runCustomerTransactionDailyRefresh() {
  var monthlyBalanceSync = MonthlyBalanceSyncService.syncCurrentMonthBalances();
  var sources = CustomerTransactionSourceService.getSourceSheets();
  var diagnostics = CustomerTransactionSourceService.getDiagnostics();
  var depositCharge = DepositChargeCorrelationService.rebuildSummaryFromSheet();
  var accountsFirst30 = AccountsService.getFirst30Summary();
  var result = {
    ok: true,
    timestamp: new Date().toISOString(),
    monthlyBalanceSync: monthlyBalanceSync,
    sourceCount: sources.length,
    sourceDiagnostics: diagnostics.map(function (item) {
      return {
        ok: !!item.ok,
        fileName: item.fileName || item.targetFileName || '',
        mimeType: item.mimeType || '',
        reason: item.reason || ''
      };
    }),
    sourceSheets: sources.map(function (item) {
      return item.displayLabel || ((item.label || item.spreadsheetName) + ' / ' + item.sheet.getName());
    }),
    depositChargeReady: !!(depositCharge && depositCharge.ready),
    accountsFirst30Ready: !!(accountsFirst30 && accountsFirst30.ready),
    monthlyBalanceReady: !!(monthlyBalanceSync && monthlyBalanceSync.ok),
    referenceDate: accountsFirst30 && accountsFirst30.referenceDate ? accountsFirst30.referenceDate : '',
    rangeLabel: accountsFirst30 && accountsFirst30.rangeLabel ? accountsFirst30.rangeLabel : ''
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function installCustomerTransactionDailyRefreshTrigger() {
  var handler = 'runCustomerTransactionDailyRefresh';
  var deleted = deleteCustomerTransactionDailyRefreshTriggers_();
  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .nearMinute(0)
    .inTimezone(Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE)
    .create();
  return {
    ok: true,
    handler: handler,
    schedule: 'Diario 10:00',
    deletedTriggers: deleted.deleted,
    triggers: ScriptApp.getProjectTriggers().filter(function (trigger) {
      return trigger.getHandlerFunction() === handler;
    }).length
  };
}

function deleteCustomerTransactionDailyRefreshTriggers_() {
  var handlers = {
    runCustomerTransactionDailyRefresh: true
  };
  var existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return handlers[trigger.getHandlerFunction()] === true;
  });
  existing.forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  return {
    deleted: existing.length,
    remaining: ScriptApp.getProjectTriggers().filter(function (trigger) {
      return handlers[trigger.getHandlerFunction()] === true;
    }).length
  };
}

function installRealtimeMonitoringAlertTrigger() {
  var liveHandler = 'runRealtimeMonitoringLiveSync';
  var cacheHandler = 'runRealtimeMonitoringCacheSync';
  var alertHandler = 'runRealtimeMonitoringAlertCheck';
  var deleted = deleteRealtimeMonitoringTriggers_();
  ScriptApp.newTrigger(liveHandler)
    .timeBased()
    .everyMinutes(1)
    .create();
  ScriptApp.newTrigger(cacheHandler)
    .timeBased()
    .everyMinutes(5)
    .create();
  ScriptApp.newTrigger(alertHandler)
    .timeBased()
    .everyMinutes(5)
    .create();
  return {
    ok: true,
    disabled: false,
    handlers: [liveHandler, cacheHandler, alertHandler],
    intervalMinutes: 5,
    liveIntervalMinutes: 1,
    alertIntervalMinutes: 5,
    cleanupSchedule: 'manual-only',
    deletedTriggers: deleted.deleted,
    triggers: ScriptApp.getProjectTriggers().filter(function (trigger) {
      return trigger.getHandlerFunction() === cacheHandler
        || trigger.getHandlerFunction() === liveHandler
        || trigger.getHandlerFunction() === alertHandler;
    }).length
  };
}

function deleteRealtimeMonitoringTriggers_() {
  var handlers = {
    runRealtimeMonitoringLiveSync: true,
    runRealtimeMonitoringCacheSync: true,
    runRealtimeMonitoringAlertCheck: true
  };
  var existing = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return handlers[trigger.getHandlerFunction()] === true;
  });
  existing.forEach(function (trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  return {
    deleted: existing.length,
    remaining: ScriptApp.getProjectTriggers().filter(function (trigger) {
      return handlers[trigger.getHandlerFunction()] === true;
    }).length
  };
}
