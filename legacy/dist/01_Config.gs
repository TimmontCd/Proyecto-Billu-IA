var AppConfig = (function () {
  var MAINTENANCE_ACTION_TOKEN_KEYS = {
    formatCustomerCategorizationCurrencyColumns: 'CUSTOMER_CATEGORIZATION_FORMAT_TOKEN',
    installCustomerTransactionDailyRefreshTrigger: 'CUSTOMER_TRANSACTION_REFRESH_TOKEN',
    runCustomerTransactionDailyRefresh: 'CUSTOMER_TRANSACTION_REFRESH_TOKEN',
    runMonthlyBalanceSync: 'CUSTOMER_TRANSACTION_REFRESH_TOKEN',
    installBirthdayCampaignDailyTrigger: 'BIRTHDAY_CAMPAIGN_TRIGGER_TOKEN',
    configureBrevoMail: 'BREVO_MAIL_CONFIG_TOKEN',
    ensureTaskTrackingSheet: 'TASK_TRACKING_MAINTENANCE_TOKEN',
    configureTaskTrackingSpreadsheet: 'TASK_TRACKING_MAINTENANCE_TOKEN',
    upsertTaskTrackingUsers: 'TASK_TRACKING_MAINTENANCE_TOKEN',
    getWhatsAppPocStatus: 'WHATSAPP_POC_MAINTENANCE_TOKEN',
    debugWhatsAppAutomation: 'WHATSAPP_POC_MAINTENANCE_TOKEN',
    configureWhatsAppAutomation: 'WHATSAPP_POC_MAINTENANCE_TOKEN',
    configureWhatsAppPoc: 'WHATSAPP_POC_MAINTENANCE_TOKEN',
    sendWhatsAppPocTestMessage: 'WHATSAPP_POC_MAINTENANCE_TOKEN'
  };

  function getScriptProperties_() {
    return PropertiesService.getScriptProperties();
  }

  function get(key, fallback) {
    var value = getScriptProperties_().getProperty(key);
    return value === null || value === '' ? fallback : value;
  }

  function set(key, value) {
    getScriptProperties_().setProperty(key, String(value));
  }

  function setAll(values) {
    getScriptProperties_().setProperties(values, false);
  }

  function getAllowedDomains() {
    var raw = get('APP_ALLOWED_DOMAINS', '');
    return raw ? raw.split(',').map(function (item) { return item.trim().toLowerCase(); }).filter(String) : [];
  }

  function getAllowedExternalEmails() {
    var fallback = [
      'andreamurillomerca@gmail.com',
      'jadv0885@gmail.com',
      'juan.lara.casti@gmail.com'
    ].join(',');
    var raw = get('APP_ALLOWED_EXTERNAL_EMAILS', fallback);
    return raw ? raw.split(',').map(function (item) { return item.trim().toLowerCase(); }).filter(String) : [];
  }

  function getAuthLoginEnabled() {
    return String(get('AUTH_LOGIN_ENABLED', 'true')).toLowerCase() !== 'false';
  }

  function getAuthSessionTtlMinutes() {
    return Number(get('AUTH_SESSION_TTL_MINUTES', APP_CONSTANTS.AUTH.SESSION_TTL_MINUTES));
  }

  function getAuthIdleTtlMinutes() {
    return Number(get('AUTH_IDLE_TTL_MINUTES', APP_CONSTANTS.AUTH.IDLE_TTL_MINUTES));
  }

  function getAuthPasswordMaxAgeDays() {
    return Number(get('AUTH_PASSWORD_MAX_AGE_DAYS', APP_CONSTANTS.AUTH.PASSWORD_MAX_AGE_DAYS));
  }

  function getAuthPasswordMinLength() {
    return Number(get('AUTH_PASSWORD_MIN_LENGTH', APP_CONSTANTS.AUTH.PASSWORD_MIN_LENGTH));
  }

  function getAuthResetTokenTtlMinutes() {
    return Number(get('AUTH_RESET_TOKEN_TTL_MINUTES', APP_CONSTANTS.AUTH.RESET_TOKEN_TTL_MINUTES));
  }

  function getAuthLockMaxAttempts() {
    return Number(get('AUTH_LOCK_MAX_ATTEMPTS', APP_CONSTANTS.AUTH.LOCK_MAX_ATTEMPTS));
  }

  function getAuthLockMinutes() {
    return Number(get('AUTH_LOCK_MINUTES', APP_CONSTANTS.AUTH.LOCK_MINUTES));
  }

  function getAuthBreakGlassEmail() {
    return Utils.normalizeEmail(get('AUTH_BREAK_GLASS_EMAIL', ''));
  }

  function getSpreadsheetId() {
    return get('MASTER_SPREADSHEET_ID', '12tf0_7F8915wWELl5MeX7tUMZ4DOmqgbn0B5Lba66Pg');
  }

  function getMasterClientsSheetName() {
    return get('MASTER_CLIENTS_SHEET_NAME', 'Clientes');
  }

  function getRootFolderId() {
    return get('ROOT_DRIVE_FOLDER_ID', '1AC-3evNd-GZM7aXCFN6p3zZ1PNPDUdz9');
  }

  function getGa4PropertyId() {
    return get('GA4_PROPERTY_ID', '360838217');
  }

  function getRealtimeCacheSpreadsheetId() {
    return get('REALTIME_CACHE_SPREADSHEET_ID', '1_cTdUrofIlU_FG3xjfc5FUn5BIdcNtGo9XjPs7Hupw0');
  }

  function getRealtimeCacheSheetName() {
    return get('REALTIME_CACHE_SHEET_NAME', 'Eventos5minutos');
  }

  function getRealtimeWindowSheetName() {
    return get('REALTIME_WINDOW_SHEET_NAME', 'AcumuladoDiario');
  }

  function getRealtimeAuditSheetName() {
    return get('REALTIME_AUDIT_SHEET_NAME', 'MonitoreoRealtimeAudit');
  }

  function getOutlookRealSpreadsheetId() {
    return get('OUTLOOK_REAL_SPREADSHEET_ID', getRealtimeCacheSpreadsheetId());
  }

  function getOutlookRealSheetName() {
    return get('OUTLOOK_REAL_SHEET_NAME', 'OutlookAperturasReales');
  }

  function getClientBalanceSpreadsheetId() {
    return get('CLIENT_BALANCE_SPREADSHEET_ID', '1GJUGDH3JCC40cxcsGKOUDVMkQxirBMggmFoSea7GLBY');
  }

  function getTaskTrackingSpreadsheetId() {
    return get('TASK_TRACKING_SPREADSHEET_ID', getSpreadsheetId());
  }

  function getClientBalanceSheetName() {
    return get('CLIENT_BALANCE_SHEET_NAME', '');
  }

  function getCustomerCategorizationSpreadsheetId() {
    return get('CUSTOMER_CATEGORIZATION_SPREADSHEET_ID', '1IG9CglOJkrqfAEXpUhTa7fTi5Y11hxEBVqvY5s4pTqA');
  }

  function getCustomerCategorizationSheetName() {
    return get('CUSTOMER_CATEGORIZATION_SHEET_NAME', 'Cuentas');
  }

  function getConversionAgentSpreadsheetId() {
    return get('CONVERSION_AGENT_SPREADSHEET_ID', '1IPhKBhDGDzKjQSbYkeUfbjLonNw4ZbNrkCwxmEbfCdw');
  }

  function getConversionAgentStepsSheetName() {
    return get('CONVERSION_AGENT_STEPS_SHEET_NAME', 'PASOS');
  }

  function getConversionAgentSendsSheetName() {
    return get('CONVERSION_AGENT_SENDS_SHEET_NAME', 'envios');
  }

  function getWhatsAppAgentSpreadsheetId() {
    return get('WHATSAPP_AGENT_SPREADSHEET_ID', getConversionAgentSpreadsheetId());
  }

  function getWhatsAppAgentStepsSheetName() {
    return get('WHATSAPP_AGENT_STEPS_SHEET_NAME', getConversionAgentStepsSheetName());
  }

  function getWhatsAppAgentSendsSheetName() {
    return get('WHATSAPP_AGENT_SENDS_SHEET_NAME', getConversionAgentSendsSheetName());
  }

  function getWhatsAppAgentHandoffSheetName() {
    return get('WHATSAPP_AGENT_HANDOFF_SHEET_NAME', 'Escalamiento WhatsApp');
  }

  function getWhatsAppAgentLogSheetName() {
    return get('WHATSAPP_AGENT_LOG_SHEET_NAME', 'WhatsApp Log');
  }

  function getCampaignProgrammingSpreadsheetId() {
    return get('CAMPAIGN_PROGRAMMING_SPREADSHEET_ID', getConversionAgentSpreadsheetId());
  }

  function getCampaignConfigSheetName() {
    return get('CAMPAIGN_CONFIG_SHEET_NAME', 'Campañas Config');
  }

  function getCampaignLogSheetName() {
    return get('CAMPAIGN_LOG_SHEET_NAME', 'Campañas Log');
  }

  function getBilluWeekendSpreadsheetId() {
    return get('BILLU_WEEKEND_SPREADSHEET_ID', '1X5QvhrDjLYDcLobPqPiGQxUIV8Vg3TEMlftAwrOaWYI');
  }

  function getBilluWeekendSheetName() {
    return get('BILLU_WEEKEND_SHEET_NAME', 'Billúweekend');
  }

  function getBilluWeekendTransactionsSpreadsheetId() {
    return get('BILLU_WEEKEND_TRANSACTIONS_SPREADSHEET_ID', '1UZb2FIFrEG_ttM2mOeuzmbd1_twaB5iHJQontLrUzPI');
  }

  function getBilluWeekendTransactionsSheetId() {
    var value = Number(get('BILLU_WEEKEND_TRANSACTIONS_SHEET_ID', '1200098367'));
    return isNaN(value) ? 1200098367 : value;
  }

  function getBilluWeekendDigitalBin() {
    var bin = String(get('BILLU_WEEKEND_DIGITAL_BIN', '41309831')).replace(/\D/g, '');
    if (bin === '41309841') return '41309831';
    return bin;
  }

  function getBilluWeekendMinCargoAmount() {
    var value = Number(get('BILLU_WEEKEND_MIN_CARGO_AMOUNT', '500'));
    return isNaN(value) ? 500 : value;
  }

  function getBilluWeekendTargetDates() {
    var raw = get('BILLU_WEEKEND_TARGET_DATES', '2026-03-28,2026-03-29,2026-03-30');
    var dates = String(raw || '')
      .split(',')
      .map(function (item) { return String(item || '').trim(); })
      .filter(function (item) { return /^\d{4}-\d{2}-\d{2}$/.test(item); });

    var unique = {};
    dates.forEach(function (item) { unique[item] = true; });
    if (unique['2026-03-28'] && unique['2026-03-29'] && !unique['2026-03-30']) {
      unique['2026-03-30'] = true;
    }

    var normalized = Object.keys(unique).sort();
    if (!normalized.length) return ['2026-03-28', '2026-03-29', '2026-03-30'];
    return normalized;
  }

  function getProjectsSourceSpreadsheetId() {
    return get('PROJECTS_SOURCE_SPREADSHEET_ID', '1o61Ebs_7rc6MA8IdYVQ17EcnRipTo551T7unQpfvKXU');
  }

  function getProjectsSourceProjectsSheetName() {
    return get('PROJECTS_SOURCE_PROJECTS_SHEET_NAME', 'Proyectos');
  }

  function getProjectsSourceTemplateSheetName() {
    return get('PROJECTS_SOURCE_TEMPLATE_SHEET_NAME', 'machote proyectos');
  }

  function getProjectsSourceActiveModelSheetName() {
    return get('PROJECTS_SOURCE_ACTIVE_MODEL_SHEET_NAME', 'Proyecto Menores');
  }

  function getProjectsSourceServiceOrdersSheetName() {
    return get('PROJECTS_SOURCE_SERVICE_ORDERS_SHEET_NAME', 'Ordenes de Servicio');
  }

  function getProjectsSourceIncidentsSheetName() {
    return get('PROJECTS_SOURCE_INCIDENTS_SHEET_NAME', 'Incidencias');
  }

  function getMailProvider() {
    return get('MAIL_PROVIDER', 'GMAIL');
  }

  function getBrevoApiKey() {
    return get('BREVO_API_KEY', '');
  }

  function getBrevoSenderEmail() {
    return get('BREVO_SENDER_EMAIL', '');
  }

  function getBrevoSenderName() {
    return get('BREVO_SENDER_NAME', 'Billú');
  }

  function getBrevoReplyToEmail() {
    return get('BREVO_REPLY_TO_EMAIL', '');
  }

  function getBrevoReplyToName() {
    return get('BREVO_REPLY_TO_NAME', getBrevoSenderName());
  }

  function getWhatsAppVerifyToken() {
    return get('WHATSAPP_VERIFY_TOKEN', '');
  }

  function getWhatsAppPhoneNumberId() {
    return get('WHATSAPP_PHONE_NUMBER_ID', '');
  }

  function getWhatsAppAccessToken() {
    return get('WHATSAPP_ACCESS_TOKEN', '');
  }

  function getWhatsAppAutoReplyMode() {
    var raw = String(get('WHATSAPP_AUTO_REPLY_MODE', 'ACK_ONLY') || '').trim().toUpperCase();
    if (['OFF', 'ACK_ONLY', 'FULL'].indexOf(raw) === -1) return 'ACK_ONLY';
    return raw;
  }

  function getWhatsAppAutoReplyEnabled() {
    return String(get('WHATSAPP_AUTO_REPLY_ENABLED', 'false')).toLowerCase() === 'true'
      && getWhatsAppAutoReplyMode() !== 'OFF';
  }

  function getWhatsAppScreenshotAssistEnabled() {
    return String(get('WHATSAPP_SCREENSHOT_ASSIST_ENABLED', 'false')).toLowerCase() === 'true';
  }

  function getMonthlyBalanceSpreadsheetId() {
    return get('MONTHLY_BALANCE_SPREADSHEET_ID', '1IG9CglOJkrqfAEXpUhTa7fTi5Y11hxEBVqvY5s4pTqA');
  }

  function getMonthlyBalanceSheetName() {
    return get('MONTHLY_BALANCE_SHEET_NAME', 'Cuentas');
  }

  function getCardsSummarySpreadsheetId() {
    return get('CARDS_SUMMARY_SPREADSHEET_ID', '1tuIhadUmtTfdCeIyFGVk3xu9hcUwriS7C0RtesCohc0');
  }

  function getMerchantHomologationSpreadsheetId() {
    return get('MERCHANT_HOMOLOGATION_SPREADSHEET_ID', '1MBGT1rKjU4w27C_0xz6dGXUlPCEv0wZDB6IFI7UjmDM');
  }

  function getMerchantHomologationSheetName() {
    return get('MERCHANT_HOMOLOGATION_SHEET_NAME', '');
  }

  function getCustomerTransactionDriveFolderId() {
    return get('CUSTOMER_TRANSACTION_DRIVE_FOLDER_ID', '1-oqSdioDhy1tYsn6vOzzyQRUlsDmuGr7');
  }

  function getCustomerTransactionDriveFileName() {
    return get('CUSTOMER_TRANSACTION_DRIVE_FILE_NAME', 'Acumulado de Transacciones');
  }

  function getCustomerTransactionSourceConfigs() {
    return [
      {
        spreadsheetId: '1Jzlu4j5g14JnrCNMPaafGiRdQuhZC_fUC4IPV3apXXw',
        label: 'Transacciones Enero 2026',
        sheetNames: [],
        sheetIds: [806195810]
      },
      {
        spreadsheetId: '1KmKw_CjxSXbvfzALGpq1mNNgsUNj01govI5tlegvfPo',
        label: 'Transacciones Febrero 2026',
        sheetNames: [],
        sheetIds: [748849316]
      },
      {
        spreadsheetId: '1UZb2FIFrEG_ttM2mOeuzmbd1_twaB5iHJQontLrUzPI',
        label: 'Transacciones Marzo 2026',
        sheetNames: [],
        sheetIds: [1200098367]
      }
    ].filter(function (item) {
      return item && item.spreadsheetId;
    });
  }

  function getOutlookIngressToken() {
    return get('OUTLOOK_INGEST_TOKEN', '');
  }

  function getMaintenanceActionToken(actionName) {
    var key = MAINTENANCE_ACTION_TOKEN_KEYS[String(actionName || '').trim()] || '';
    return key ? get(key, '') : '';
  }

  function getAppInfo() {
    return {
      appName: APP_CONSTANTS.APP_NAME,
      version: APP_CONSTANTS.VERSION,
      timeZone: Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE,
      allowedExternalEmails: getAllowedExternalEmails(),
      spreadsheetId: getSpreadsheetId(),
      masterClientsSheetName: getMasterClientsSheetName(),
      rootFolderId: getRootFolderId(),
      ga4PropertyId: getGa4PropertyId(),
      realtimeCacheSpreadsheetId: getRealtimeCacheSpreadsheetId(),
      realtimeCacheSheetName: getRealtimeCacheSheetName(),
      realtimeWindowSheetName: getRealtimeWindowSheetName(),
      realtimeAuditSheetName: getRealtimeAuditSheetName(),
      outlookRealSpreadsheetId: getOutlookRealSpreadsheetId(),
      outlookRealSheetName: getOutlookRealSheetName(),
      clientBalanceSpreadsheetId: getClientBalanceSpreadsheetId(),
      taskTrackingSpreadsheetId: getTaskTrackingSpreadsheetId(),
      clientBalanceSheetName: getClientBalanceSheetName(),
      customerCategorizationSpreadsheetId: getCustomerCategorizationSpreadsheetId(),
      customerCategorizationSheetName: getCustomerCategorizationSheetName(),
      conversionAgentSpreadsheetId: getConversionAgentSpreadsheetId(),
      conversionAgentStepsSheetName: getConversionAgentStepsSheetName(),
      conversionAgentSendsSheetName: getConversionAgentSendsSheetName(),
      whatsappAgentSpreadsheetId: getWhatsAppAgentSpreadsheetId(),
      whatsappAgentStepsSheetName: getWhatsAppAgentStepsSheetName(),
      whatsappAgentSendsSheetName: getWhatsAppAgentSendsSheetName(),
      whatsappAgentHandoffSheetName: getWhatsAppAgentHandoffSheetName(),
      whatsappAgentLogSheetName: getWhatsAppAgentLogSheetName(),
      campaignProgrammingSpreadsheetId: getCampaignProgrammingSpreadsheetId(),
      campaignConfigSheetName: getCampaignConfigSheetName(),
      campaignLogSheetName: getCampaignLogSheetName(),
      billuWeekendSpreadsheetId: getBilluWeekendSpreadsheetId(),
      billuWeekendSheetName: getBilluWeekendSheetName(),
      billuWeekendTransactionsSpreadsheetId: getBilluWeekendTransactionsSpreadsheetId(),
      billuWeekendTransactionsSheetId: getBilluWeekendTransactionsSheetId(),
      billuWeekendDigitalBin: getBilluWeekendDigitalBin(),
      billuWeekendMinCargoAmount: getBilluWeekendMinCargoAmount(),
      billuWeekendTargetDates: getBilluWeekendTargetDates(),
      projectsSourceSpreadsheetId: getProjectsSourceSpreadsheetId(),
      projectsSourceProjectsSheetName: getProjectsSourceProjectsSheetName(),
      projectsSourceTemplateSheetName: getProjectsSourceTemplateSheetName(),
      projectsSourceActiveModelSheetName: getProjectsSourceActiveModelSheetName(),
      projectsSourceServiceOrdersSheetName: getProjectsSourceServiceOrdersSheetName(),
      projectsSourceIncidentsSheetName: getProjectsSourceIncidentsSheetName(),
      mailProvider: getMailProvider(),
      brevoConfigured: !!(getBrevoApiKey() && getBrevoSenderEmail()),
      whatsappPhoneNumberId: getWhatsAppPhoneNumberId(),
      whatsappVerifyTokenConfigured: !!getWhatsAppVerifyToken(),
      whatsappApiConfigured: !!(getWhatsAppPhoneNumberId() && getWhatsAppAccessToken()),
      whatsappAutoReplyEnabled: getWhatsAppAutoReplyEnabled(),
      whatsappAutoReplyMode: getWhatsAppAutoReplyMode(),
      whatsappScreenshotAssistEnabled: getWhatsAppScreenshotAssistEnabled(),
      monthlyBalanceSpreadsheetId: getMonthlyBalanceSpreadsheetId(),
      monthlyBalanceSheetName: getMonthlyBalanceSheetName(),
      cardsSummarySpreadsheetId: getCardsSummarySpreadsheetId(),
      merchantHomologationSpreadsheetId: getMerchantHomologationSpreadsheetId(),
      merchantHomologationSheetName: getMerchantHomologationSheetName(),
      customerTransactionDriveFolderId: getCustomerTransactionDriveFolderId(),
      customerTransactionDriveFileName: getCustomerTransactionDriveFileName(),
      customerTransactionSourceConfigs: getCustomerTransactionSourceConfigs(),
      authLoginEnabled: getAuthLoginEnabled(),
      authSessionTtlMinutes: getAuthSessionTtlMinutes(),
      authIdleTtlMinutes: getAuthIdleTtlMinutes(),
      authPasswordMaxAgeDays: getAuthPasswordMaxAgeDays(),
      authPasswordMinLength: getAuthPasswordMinLength(),
      enableGa4: get('ENABLE_GA4', 'false') === 'true',
      enableSpeechToText: get('ENABLE_SPEECH_TO_TEXT', 'false') === 'true'
    };
  }

  return {
    get: get,
    set: set,
    setAll: setAll,
    getAllowedDomains: getAllowedDomains,
    getAllowedExternalEmails: getAllowedExternalEmails,
    getAuthLoginEnabled: getAuthLoginEnabled,
    getAuthSessionTtlMinutes: getAuthSessionTtlMinutes,
    getAuthIdleTtlMinutes: getAuthIdleTtlMinutes,
    getAuthPasswordMaxAgeDays: getAuthPasswordMaxAgeDays,
    getAuthPasswordMinLength: getAuthPasswordMinLength,
    getAuthResetTokenTtlMinutes: getAuthResetTokenTtlMinutes,
    getAuthLockMaxAttempts: getAuthLockMaxAttempts,
    getAuthLockMinutes: getAuthLockMinutes,
    getAuthBreakGlassEmail: getAuthBreakGlassEmail,
    getSpreadsheetId: getSpreadsheetId,
    getMasterClientsSheetName: getMasterClientsSheetName,
    getRootFolderId: getRootFolderId,
    getGa4PropertyId: getGa4PropertyId,
    getRealtimeCacheSpreadsheetId: getRealtimeCacheSpreadsheetId,
    getRealtimeCacheSheetName: getRealtimeCacheSheetName,
    getRealtimeWindowSheetName: getRealtimeWindowSheetName,
    getRealtimeAuditSheetName: getRealtimeAuditSheetName,
    getOutlookRealSpreadsheetId: getOutlookRealSpreadsheetId,
    getOutlookRealSheetName: getOutlookRealSheetName,
    getClientBalanceSpreadsheetId: getClientBalanceSpreadsheetId,
    getTaskTrackingSpreadsheetId: getTaskTrackingSpreadsheetId,
    getClientBalanceSheetName: getClientBalanceSheetName,
    getCustomerCategorizationSpreadsheetId: getCustomerCategorizationSpreadsheetId,
    getCustomerCategorizationSheetName: getCustomerCategorizationSheetName,
    getConversionAgentSpreadsheetId: getConversionAgentSpreadsheetId,
    getConversionAgentStepsSheetName: getConversionAgentStepsSheetName,
    getConversionAgentSendsSheetName: getConversionAgentSendsSheetName,
    getWhatsAppAgentSpreadsheetId: getWhatsAppAgentSpreadsheetId,
    getWhatsAppAgentStepsSheetName: getWhatsAppAgentStepsSheetName,
    getWhatsAppAgentSendsSheetName: getWhatsAppAgentSendsSheetName,
    getWhatsAppAgentHandoffSheetName: getWhatsAppAgentHandoffSheetName,
    getWhatsAppAgentLogSheetName: getWhatsAppAgentLogSheetName,
    getCampaignProgrammingSpreadsheetId: getCampaignProgrammingSpreadsheetId,
    getCampaignConfigSheetName: getCampaignConfigSheetName,
    getCampaignLogSheetName: getCampaignLogSheetName,
    getBilluWeekendSpreadsheetId: getBilluWeekendSpreadsheetId,
    getBilluWeekendSheetName: getBilluWeekendSheetName,
    getBilluWeekendTransactionsSpreadsheetId: getBilluWeekendTransactionsSpreadsheetId,
    getBilluWeekendTransactionsSheetId: getBilluWeekendTransactionsSheetId,
    getBilluWeekendDigitalBin: getBilluWeekendDigitalBin,
    getBilluWeekendMinCargoAmount: getBilluWeekendMinCargoAmount,
    getBilluWeekendTargetDates: getBilluWeekendTargetDates,
    getProjectsSourceSpreadsheetId: getProjectsSourceSpreadsheetId,
    getProjectsSourceProjectsSheetName: getProjectsSourceProjectsSheetName,
    getProjectsSourceTemplateSheetName: getProjectsSourceTemplateSheetName,
    getProjectsSourceActiveModelSheetName: getProjectsSourceActiveModelSheetName,
    getProjectsSourceServiceOrdersSheetName: getProjectsSourceServiceOrdersSheetName,
    getProjectsSourceIncidentsSheetName: getProjectsSourceIncidentsSheetName,
    getMailProvider: getMailProvider,
    getBrevoApiKey: getBrevoApiKey,
    getBrevoSenderEmail: getBrevoSenderEmail,
    getBrevoSenderName: getBrevoSenderName,
    getBrevoReplyToEmail: getBrevoReplyToEmail,
    getBrevoReplyToName: getBrevoReplyToName,
    getWhatsAppVerifyToken: getWhatsAppVerifyToken,
    getWhatsAppPhoneNumberId: getWhatsAppPhoneNumberId,
    getWhatsAppAccessToken: getWhatsAppAccessToken,
    getWhatsAppAutoReplyEnabled: getWhatsAppAutoReplyEnabled,
    getWhatsAppAutoReplyMode: getWhatsAppAutoReplyMode,
    getWhatsAppScreenshotAssistEnabled: getWhatsAppScreenshotAssistEnabled,
    getMonthlyBalanceSpreadsheetId: getMonthlyBalanceSpreadsheetId,
    getMonthlyBalanceSheetName: getMonthlyBalanceSheetName,
    getCardsSummarySpreadsheetId: getCardsSummarySpreadsheetId,
    getMerchantHomologationSpreadsheetId: getMerchantHomologationSpreadsheetId,
    getMerchantHomologationSheetName: getMerchantHomologationSheetName,
    getCustomerTransactionDriveFolderId: getCustomerTransactionDriveFolderId,
    getCustomerTransactionDriveFileName: getCustomerTransactionDriveFileName,
    getCustomerTransactionSourceConfigs: getCustomerTransactionSourceConfigs,
    getOutlookIngressToken: getOutlookIngressToken,
    getMaintenanceActionToken: getMaintenanceActionToken,
    getAppInfo: getAppInfo
  };
})();
