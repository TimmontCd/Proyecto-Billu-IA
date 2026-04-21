function doGet(e) {
  if (e && e.parameter && e.parameter['hub.mode']) {
    if (
      e.parameter['hub.mode'] === 'subscribe' &&
      e.parameter['hub.verify_token'] === AppConfig.getWhatsAppVerifyToken()
    ) {
      return ContentService.createTextOutput(e.parameter['hub.challenge'] || '');
    }
    return createJsonOutput_(ApiResponse.error('Invalid WhatsApp verification token.'));
  }
  if (e && e.parameter && e.parameter.action === 'formatCustomerCategorizationCurrencyColumns') {
    if (!isAuthorizedMaintenanceAction_('formatCustomerCategorizationCurrencyColumns', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      CustomerCategorizationService.formatSourceCurrencyColumns(),
      'Customer categorization currency columns formatted.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'installCustomerTransactionDailyRefreshTrigger') {
    if (!isAuthorizedMaintenanceAction_('installCustomerTransactionDailyRefreshTrigger', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      installCustomerTransactionDailyRefreshTrigger(),
      'Customer transaction daily refresh trigger installed.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'runCustomerTransactionDailyRefresh') {
    if (!isAuthorizedMaintenanceAction_('runCustomerTransactionDailyRefresh', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      runCustomerTransactionDailyRefresh(),
      'Customer transaction daily refresh executed.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'runMonthlyBalanceSync') {
    if (!isAuthorizedMaintenanceAction_('runMonthlyBalanceSync', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      runMonthlyBalanceSync(),
      'Monthly balance sync executed.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'installBirthdayCampaignDailyTrigger') {
    if (!isAuthorizedMaintenanceAction_('installBirthdayCampaignDailyTrigger', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      installBirthdayCampaignDailyTrigger(),
      'Birthday campaign daily trigger installed.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'configureBrevoMail') {
    if (!isAuthorizedMaintenanceAction_('configureBrevoMail', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    if (!e.parameter.apiKey || !e.parameter.senderEmail) {
      return createJsonOutput_(ApiResponse.error('Missing apiKey or senderEmail.'));
    }
    AppConfig.setAll({
      MAIL_PROVIDER: 'BREVO',
      BREVO_API_KEY: e.parameter.apiKey,
      BREVO_SENDER_EMAIL: e.parameter.senderEmail,
      BREVO_SENDER_NAME: e.parameter.senderName || 'Billú',
      BREVO_REPLY_TO_EMAIL: e.parameter.replyToEmail || '',
      BREVO_REPLY_TO_NAME: e.parameter.replyToName || (e.parameter.senderName || 'Billú')
    });
    return createJsonOutput_(ApiResponse.success({
      provider: AppConfig.getMailProvider(),
      senderEmail: AppConfig.getBrevoSenderEmail(),
      senderName: AppConfig.getBrevoSenderName(),
      replyToEmail: AppConfig.getBrevoReplyToEmail()
    }, 'Brevo mail configured.'));
  }
  if (e && e.parameter && e.parameter.action === 'ensureTaskTrackingSheet') {
    if (!isAuthorizedMaintenanceAction_('ensureTaskTrackingSheet', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      TaskTrackingService.ensureSheetReady(),
      'Task tracking sheet ensured.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'configureTaskTrackingSpreadsheet') {
    if (!isAuthorizedMaintenanceAction_('configureTaskTrackingSpreadsheet', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    if (!e.parameter.spreadsheetId) {
      return createJsonOutput_(ApiResponse.error('Missing spreadsheetId.'));
    }
    AppConfig.set('TASK_TRACKING_SPREADSHEET_ID', e.parameter.spreadsheetId);
    return createJsonOutput_(ApiResponse.success(
      TaskTrackingService.ensureSheetReady(),
      'Task tracking spreadsheet configured.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'upsertTaskTrackingUsers') {
    if (!isAuthorizedMaintenanceAction_('upsertTaskTrackingUsers', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    if (!e.parameter.usersJson) {
      return createJsonOutput_(ApiResponse.error('Missing usersJson.'));
    }
    return createJsonOutput_(ApiResponse.success(
      runUpsertNamedOperatorUsers(e.parameter.usersJson),
      'Task tracking users upserted.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'getWhatsAppPocStatus') {
    if (!isAuthorizedMaintenanceAction_('getWhatsAppPocStatus', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      getWhatsAppPocStatus(),
      'WhatsApp PoC status retrieved.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'debugWhatsAppAutomation') {
    if (!isAuthorizedMaintenanceAction_('debugWhatsAppAutomation', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      getWhatsAppAutomationDebugStatus(),
      'WhatsApp automation debug status retrieved.'
    ));
  }
  if (e && e.parameter && e.parameter.action === 'configureWhatsAppAutomation') {
    if (!isAuthorizedMaintenanceAction_('configureWhatsAppAutomation', e.parameter.token)) {
      return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
    }
    return createJsonOutput_(ApiResponse.success(
      configureWhatsAppAutomation(
        e.parameter.autoReplyEnabled,
        e.parameter.autoReplyMode,
        e.parameter.screenshotAssistEnabled
      ),
      'WhatsApp automation configured.'
    ));
  }
  var template = HtmlService.createTemplateFromFile('index');
  template.appInfo = AppConfig.getAppInfo();
  template.chePhotoDataUrl = getBeBotAvatarDataUrl_();
  return template
    .evaluate()
    .setTitle(APP_CONSTANTS.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var BEBOT_AVATAR_DATA_URL_CACHE = null;

function getBeBotAvatarDataUrl_() {
  if (BEBOT_AVATAR_DATA_URL_CACHE) return BEBOT_AVATAR_DATA_URL_CACHE;
  var fallbackDataUrl = APP_ASSETS.CHE_PHOTO_DATA_URL || '';
  try {
    var svgContent = HtmlService.createHtmlOutputFromFile('bebot-avatar').getContent();
    if (!svgContent) return fallbackDataUrl;
    BEBOT_AVATAR_DATA_URL_CACHE =
      'data:image/svg+xml;base64,' + Utilities.base64Encode(svgContent, Utilities.Charset.UTF_8);
    return BEBOT_AVATAR_DATA_URL_CACHE;
  } catch (error) {
    return fallbackDataUrl;
  }
}

function doPost(e) {
  try {
    var payload = parsePostPayload_(e);
    if (payload && payload.object === 'whatsapp_business_account') {
      var pocResult = WhatsAppConversationalPocService.handleWebhook(payload);
      var dashboardResult = null;
      var dashboardError = '';
      try {
        dashboardResult = WhatsAppAgentService.ingestWebhook(payload);
      } catch (dashboardSyncError) {
        dashboardError = dashboardSyncError && dashboardSyncError.message
          ? dashboardSyncError.message
          : String(dashboardSyncError || 'Unknown dashboard sync error.');
      }
      return createJsonOutput_(ApiResponse.success({
        poc: pocResult,
        dashboard: dashboardResult,
        dashboardError: dashboardError
      }, dashboardError ? 'WhatsApp webhook processed with dashboard sync warning.' : 'WhatsApp webhook processed.'));
    }
    if (payload && payload.action === 'formatCustomerCategorizationCurrencyColumns') {
      if (!isAuthorizedMaintenanceAction_('formatCustomerCategorizationCurrencyColumns', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        CustomerCategorizationService.formatSourceCurrencyColumns(),
        'Customer categorization currency columns formatted.'
      ));
    }
    if (payload && payload.action === 'installCustomerTransactionDailyRefreshTrigger') {
      if (!isAuthorizedMaintenanceAction_('installCustomerTransactionDailyRefreshTrigger', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        installCustomerTransactionDailyRefreshTrigger(),
        'Customer transaction daily refresh trigger installed.'
      ));
    }
    if (payload && payload.action === 'runCustomerTransactionDailyRefresh') {
      if (!isAuthorizedMaintenanceAction_('runCustomerTransactionDailyRefresh', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        runCustomerTransactionDailyRefresh(),
        'Customer transaction daily refresh executed.'
      ));
    }
    if (payload && payload.action === 'runMonthlyBalanceSync') {
      if (!isAuthorizedMaintenanceAction_('runMonthlyBalanceSync', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        runMonthlyBalanceSync(),
        'Monthly balance sync executed.'
      ));
    }
    if (payload && payload.action === 'installBirthdayCampaignDailyTrigger') {
      if (!isAuthorizedMaintenanceAction_('installBirthdayCampaignDailyTrigger', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        installBirthdayCampaignDailyTrigger(),
        'Birthday campaign daily trigger installed.'
      ));
    }
    if (payload && payload.action === 'configureBrevoMail') {
      if (!isAuthorizedMaintenanceAction_('configureBrevoMail', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      if (!payload.apiKey || !payload.senderEmail) {
        return createJsonOutput_(ApiResponse.error('Missing apiKey or senderEmail.'));
      }
      AppConfig.setAll({
        MAIL_PROVIDER: 'BREVO',
        BREVO_API_KEY: payload.apiKey,
        BREVO_SENDER_EMAIL: payload.senderEmail,
        BREVO_SENDER_NAME: payload.senderName || 'Billú',
        BREVO_REPLY_TO_EMAIL: payload.replyToEmail || '',
        BREVO_REPLY_TO_NAME: payload.replyToName || (payload.senderName || 'Billú')
      });
      return createJsonOutput_(ApiResponse.success({
        provider: AppConfig.getMailProvider(),
        senderEmail: AppConfig.getBrevoSenderEmail(),
        senderName: AppConfig.getBrevoSenderName(),
        replyToEmail: AppConfig.getBrevoReplyToEmail()
      }, 'Brevo mail configured.'));
    }
    if (payload && payload.action === 'ensureTaskTrackingSheet') {
      if (!isAuthorizedMaintenanceAction_('ensureTaskTrackingSheet', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        TaskTrackingService.ensureSheetReady(),
        'Task tracking sheet ensured.'
      ));
    }
    if (payload && payload.action === 'configureTaskTrackingSpreadsheet') {
      if (!isAuthorizedMaintenanceAction_('configureTaskTrackingSpreadsheet', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      if (!payload.spreadsheetId) {
        return createJsonOutput_(ApiResponse.error('Missing spreadsheetId.'));
      }
      AppConfig.set('TASK_TRACKING_SPREADSHEET_ID', payload.spreadsheetId);
      return createJsonOutput_(ApiResponse.success(
        TaskTrackingService.ensureSheetReady(),
        'Task tracking spreadsheet configured.'
      ));
    }
    if (payload && payload.action === 'upsertTaskTrackingUsers') {
      if (!isAuthorizedMaintenanceAction_('upsertTaskTrackingUsers', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      if (!payload.usersJson) {
        return createJsonOutput_(ApiResponse.error('Missing usersJson.'));
      }
      return createJsonOutput_(ApiResponse.success(
        runUpsertNamedOperatorUsers(payload.usersJson),
        'Task tracking users upserted.'
      ));
    }
    if (payload && payload.action === 'configureWhatsAppPoc') {
      if (!isAuthorizedMaintenanceAction_('configureWhatsAppPoc', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        configureWhatsAppPoc(
          payload.verifyToken,
          payload.accessToken,
          payload.phoneNumberId,
          payload.testTo
        ),
        'WhatsApp PoC configured.'
      ));
    }
    if (payload && payload.action === 'sendWhatsAppPocTestMessage') {
      if (!isAuthorizedMaintenanceAction_('sendWhatsAppPocTestMessage', payload.token)) {
        return createJsonOutput_(ApiResponse.error('Unauthorized maintenance action.'));
      }
      return createJsonOutput_(ApiResponse.success(
        sendWhatsAppPocTestMessage(payload.to, payload.body),
        'WhatsApp PoC test message executed.'
      ));
    }
    var result = OutlookRealOpeningsService.ingest(payload);
    return createJsonOutput_(ApiResponse.success(result, 'Outlook opening ingested.'));
  } catch (error) {
    return createJsonOutput_(ApiResponse.error('Outlook opening ingest failed', error.message));
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function isAuthorizedMaintenanceAction_(actionName, providedToken) {
  var expectedToken = AppConfig.getMaintenanceActionToken(actionName);
  return !!expectedToken && String(providedToken || '') === String(expectedToken);
}

function parsePostPayload_(e) {
  if (!e) throw new Error('Missing request event.');
  var raw = e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw) {
    var parsed = Utils.parseJson(raw, null);
    if (!parsed) throw new Error('Invalid JSON payload.');
    return parsed;
  }
  return e.parameter || {};
}

function createJsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function configureWhatsAppPoc(verifyToken, accessToken, phoneNumberId, testTo) {
  if (!verifyToken || !accessToken || !phoneNumberId) {
    throw new Error('Missing verifyToken, accessToken or phoneNumberId.');
  }

  var values = {
    WHATSAPP_VERIFY_TOKEN: String(verifyToken),
    WHATSAPP_ACCESS_TOKEN: String(accessToken),
    WHATSAPP_PHONE_NUMBER_ID: String(phoneNumberId)
  };

  if (testTo) values.WHATSAPP_TEST_TO = String(testTo);
  AppConfig.setAll(values);

  return getWhatsAppPocStatus();
}

function getWhatsAppPocStatus() {
  var verifyToken = AppConfig.getWhatsAppVerifyToken();
  var phoneNumberId = AppConfig.getWhatsAppPhoneNumberId();
  var testTo = AppConfig.get('WHATSAPP_TEST_TO', '');
  return {
    verifyTokenConfigured: !!verifyToken,
    verifyTokenPreview: verifyToken ? verifyToken.slice(0, 6) + '***' : '',
    phoneNumberIdConfigured: !!phoneNumberId,
    phoneNumberId: phoneNumberId,
    accessTokenConfigured: !!AppConfig.getWhatsAppAccessToken(),
    autoReplyEnabled: AppConfig.getWhatsAppAutoReplyEnabled(),
    autoReplyMode: AppConfig.getWhatsAppAutoReplyMode(),
    screenshotAssistEnabled: AppConfig.getWhatsAppScreenshotAssistEnabled(),
    testTo: testTo
  };
}

function getWhatsAppAutomationDebugStatus() {
  var props = PropertiesService.getScriptProperties().getProperties();
  return {
    marker: 'whatsapp-automation-debug-2026-03-31-v1',
    raw: {
      WHATSAPP_AUTO_REPLY_ENABLED: props.WHATSAPP_AUTO_REPLY_ENABLED || '',
      WHATSAPP_AUTO_REPLY_MODE: props.WHATSAPP_AUTO_REPLY_MODE || '',
      WHATSAPP_SCREENSHOT_ASSIST_ENABLED: props.WHATSAPP_SCREENSHOT_ASSIST_ENABLED || '',
      WHATSAPP_ACCESS_TOKEN_CONFIGURED: !!(props.WHATSAPP_ACCESS_TOKEN || ''),
      WHATSAPP_PHONE_NUMBER_ID: props.WHATSAPP_PHONE_NUMBER_ID || '',
      WHATSAPP_TEST_TO: props.WHATSAPP_TEST_TO || ''
    },
    computed: {
      autoReplyEnabled: AppConfig.getWhatsAppAutoReplyEnabled(),
      autoReplyMode: AppConfig.getWhatsAppAutoReplyMode(),
      screenshotAssistEnabled: AppConfig.getWhatsAppScreenshotAssistEnabled()
    }
  };
}

function configureWhatsAppAutomation(autoReplyEnabled, autoReplyMode, screenshotAssistEnabled) {
  var mode = String(autoReplyMode || 'ACK_ONLY').trim().toUpperCase();
  if (['OFF', 'ACK_ONLY', 'FULL'].indexOf(mode) === -1) {
    throw new Error('Invalid autoReplyMode. Use OFF, ACK_ONLY or FULL.');
  }

  AppConfig.setAll({
    WHATSAPP_AUTO_REPLY_ENABLED: String(String(autoReplyEnabled).toLowerCase() === 'true'),
    WHATSAPP_AUTO_REPLY_MODE: mode,
    WHATSAPP_SCREENSHOT_ASSIST_ENABLED: String(String(screenshotAssistEnabled).toLowerCase() === 'true')
  });

  return getWhatsAppPocStatus();
}

function sendWhatsAppPocTestMessage(to, body) {
  var destination = String(to || AppConfig.get('WHATSAPP_TEST_TO', '')).trim();
  if (!destination) throw new Error('Missing destination phone number.');
  return WhatsAppConversationalPocService.sendTestMessage(destination, body || '');
}
