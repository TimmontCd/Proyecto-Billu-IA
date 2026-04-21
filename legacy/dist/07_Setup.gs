function bootstrapControlTower() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var context = {};
    initializeDefaultProperties_();
    context.sheets = ensureMasterSheets_();
    context.folders = ensureDriveFolders_();
    context.templates = ensureDocumentTemplates_(context.folders);
    context.seed = seedBaseData_();
    return ApiResponse.success(context, 'Bootstrap completado correctamente.');
  } catch (error) {
    return ApiResponse.error('Bootstrap failed', error.message);
  } finally {
    lock.releaseLock();
  }
}

function initializeDefaultProperties_() {
  var outlookIngressToken = AppConfig.getOutlookIngressToken() || generateWebhookToken_();
  AppConfig.setAll({
    MASTER_SPREADSHEET_ID: AppConfig.getSpreadsheetId(),
    MASTER_CLIENTS_SHEET_NAME: AppConfig.getMasterClientsSheetName(),
    ROOT_DRIVE_FOLDER_ID: AppConfig.getRootFolderId(),
    GA4_PROPERTY_ID: AppConfig.getGa4PropertyId(),
    REALTIME_CACHE_SPREADSHEET_ID: AppConfig.getRealtimeCacheSpreadsheetId(),
    REALTIME_CACHE_SHEET_NAME: AppConfig.getRealtimeCacheSheetName(),
    REALTIME_WINDOW_SHEET_NAME: AppConfig.getRealtimeWindowSheetName(),
    OUTLOOK_REAL_SPREADSHEET_ID: AppConfig.getRealtimeCacheSpreadsheetId(),
    OUTLOOK_REAL_SHEET_NAME: AppConfig.getOutlookRealSheetName(),
    OUTLOOK_INGEST_TOKEN: outlookIngressToken,
    ALERT_EMAILS: AppConfig.get('ALERT_EMAILS', 'martin.mercado89@gmail.com'),
    TRANSCRIPTION_LANGUAGE_CODE: AppConfig.get('TRANSCRIPTION_LANGUAGE_CODE', 'es-MX'),
    ENABLE_GA4: AppConfig.get('ENABLE_GA4', 'false'),
    ENABLE_SPEECH_TO_TEXT: AppConfig.get('ENABLE_SPEECH_TO_TEXT', 'false'),
    CUSTOMER_CATEGORIZATION_SPREADSHEET_ID: AppConfig.getCustomerCategorizationSpreadsheetId(),
    MONTHLY_BALANCE_SPREADSHEET_ID: AppConfig.getMonthlyBalanceSpreadsheetId(),
    MONTHLY_BALANCE_SHEET_NAME: AppConfig.getMonthlyBalanceSheetName(),
    TINCHO_ENABLE_DIALOGFLOW: AppConfig.get('TINCHO_ENABLE_DIALOGFLOW', 'false'),
    TINCHO_ENABLE_TTS: AppConfig.get('TINCHO_ENABLE_TTS', 'false'),
    TINCHO_ENABLE_EMAIL_ESCALATION: AppConfig.get('TINCHO_ENABLE_EMAIL_ESCALATION', 'false'),
    TINCHO_ESCALATION_EMAILS: AppConfig.get('TINCHO_ESCALATION_EMAILS', AppConfig.get('ALERT_EMAILS', '')),
    TINCHO_DIALOGFLOW_PROJECT_ID: AppConfig.get('TINCHO_DIALOGFLOW_PROJECT_ID', ''),
    TINCHO_DIALOGFLOW_LANGUAGE_CODE: AppConfig.get('TINCHO_DIALOGFLOW_LANGUAGE_CODE', 'es-MX'),
    TINCHO_DIALOGFLOW_KNOWLEDGE_BASE_ID: AppConfig.get('TINCHO_DIALOGFLOW_KNOWLEDGE_BASE_ID', ''),
    TINCHO_DIALOGFLOW_KNOWLEDGE_BASE_NAME: AppConfig.get('TINCHO_DIALOGFLOW_KNOWLEDGE_BASE_NAME', ''),
    TINCHO_DIALOGFLOW_KNOWLEDGE_BASE_DISPLAY_NAME: AppConfig.get('TINCHO_DIALOGFLOW_KNOWLEDGE_BASE_DISPLAY_NAME', 'Tincho Manuales'),
    TINCHO_DIALOGFLOW_CONFIDENCE_THRESHOLD: AppConfig.get('TINCHO_DIALOGFLOW_CONFIDENCE_THRESHOLD', '0.35'),
    TINCHO_TTS_LANGUAGE_CODE: AppConfig.get('TINCHO_TTS_LANGUAGE_CODE', 'es-MX'),
    TINCHO_TTS_VOICE_NAME: AppConfig.get('TINCHO_TTS_VOICE_NAME', ''),
    TINCHO_TTS_SSML_GENDER: AppConfig.get('TINCHO_TTS_SSML_GENDER', 'NEUTRAL'),
    TINCHO_TTS_AUDIO_ENCODING: AppConfig.get('TINCHO_TTS_AUDIO_ENCODING', 'MP3')
  });
}

function generateWebhookToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function ensureMasterSheets_() {
  var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
  var result = [];
  AppSchema.getSheetNames().forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    var headers = AppSchema.getHeaders(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    } else {
      var currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
      headers.forEach(function (header, index) {
        if (currentHeaders[index] !== header) {
          sheet.getRange(1, index + 1).setValue(header);
        }
      });
      sheet.setFrozenRows(1);
    }
    result.push({ name: sheetName, rows: sheet.getLastRow() });
  });
  return result;
}

function ensureDriveFolders_() {
  var rootFolder = DriveApp.getFolderById(AppConfig.getRootFolderId());
  var folderMap = {};
  Object.keys(APP_CONSTANTS.FOLDER_KEYS).forEach(function (key) {
    var name = APP_CONSTANTS.FOLDER_KEYS[key];
    var folder = findOrCreateFolder_(rootFolder, name);
    folderMap[key] = { id: folder.getId(), name: folder.getName() };
    AppConfig.set('FOLDER_' + key + '_ID', folder.getId());
  });
  return folderMap;
}

function ensureDocumentTemplates_(folders) {
  var templatesFolder = DriveApp.getFolderById(folders.TEMPLATES.id);
  var analysisTemplateId = AppConfig.get('DOC_TEMPLATE_ANALYSIS_ID', '');
  var minuteTemplateId = AppConfig.get('DOC_TEMPLATE_MINUTE_ID', '');

  if (!analysisTemplateId) {
    var analysisDoc = DocumentApp.create('TPL_Analisis_Funcional_Control_Tower');
    var analysisFile = DriveApp.getFileById(analysisDoc.getId());
    templatesFolder.addFile(analysisFile);
    DriveApp.getRootFolder().removeFile(analysisFile);
    buildAnalysisTemplate_(analysisDoc);
    AppConfig.set('DOC_TEMPLATE_ANALYSIS_ID', analysisDoc.getId());
    analysisTemplateId = analysisDoc.getId();
  }

  if (!minuteTemplateId) {
    var minuteDoc = DocumentApp.create('TPL_Minuta_Control_Tower');
    var minuteFile = DriveApp.getFileById(minuteDoc.getId());
    templatesFolder.addFile(minuteFile);
    DriveApp.getRootFolder().removeFile(minuteFile);
    buildMinuteTemplate_(minuteDoc);
    AppConfig.set('DOC_TEMPLATE_MINUTE_ID', minuteDoc.getId());
    minuteTemplateId = minuteDoc.getId();
  }

  return {
    analysisTemplateId: analysisTemplateId,
    minuteTemplateId: minuteTemplateId
  };
}

function buildAnalysisTemplate_(document) {
  var body = document.getBody();
  body.clear();
  body.appendParagraph('Especificacion Funcional').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('{{PROJECT_NAME}}').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Version: {{VERSION}}');
  body.appendParagraph('Generado por: {{AUTHOR}}');
  body.appendParagraph('Fecha: {{DATE}}');
  [
    'Resumen Ejecutivo',
    'Objetivo',
    'Alcance',
    'Flujo Actual',
    'Flujo Propuesto',
    'Requerimientos Funcionales',
    'Requerimientos No Funcionales',
    'Reglas de Negocio',
    'Excepciones',
    'Consideraciones Tecnicas',
    'Riesgos',
    'Criterios de Aceptacion',
    'Pendientes',
    'Anexos',
    'Bitacora del Documento'
  ].forEach(function (title) {
    body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('{{' + title.toUpperCase().replace(/\s+/g, '_') + '}}');
  });
  document.saveAndClose();
}

function buildMinuteTemplate_(document) {
  var body = document.getBody();
  body.clear();
  body.appendParagraph('Minuta de Reunion').setHeading(DocumentApp.ParagraphHeading.TITLE);
  ['Nombre de la reunion', 'Fecha', 'Participantes', 'Resumen', 'Acuerdos', 'Tareas', 'Riesgos o temas pendientes'].forEach(function (title) {
    body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph('{{' + title.toUpperCase().replace(/[^\w]+/g, '_') + '}}');
  });
  document.saveAndClose();
}

function seedBaseData_() {
  seedRoles_();
  seedUsers_();
  seedCatalogs_();
  seedFunnelCatalogs_();
  return { ok: true };
}

function seedRoles_() {
  var repository = new BaseRepository(APP_CONSTANTS.SHEETS.ROLES);
  if (repository.getAll().length) return;
  repository.bulkInsert([
    {
      id: APP_CONSTANTS.ROLES.ADMIN,
      nombre: 'Administrador',
      descripcion: 'Acceso completo a configuracion y vistas globales.',
      permisosJson: Utils.stringifyJson({ all: true }),
      createdAt: Utils.formatDate(new Date()),
      updatedAt: Utils.formatDate(new Date()),
      createdBy: 'system',
      status: APP_CONSTANTS.STATUS.ACTIVE
    },
    {
      id: APP_CONSTANTS.ROLES.OPERATOR,
      nombre: 'Operador',
      descripcion: 'Acceso limitado a captura y seguimiento.',
      permisosJson: Utils.stringifyJson({ projects: 'assigned', uploads: true }),
      createdAt: Utils.formatDate(new Date()),
      updatedAt: Utils.formatDate(new Date()),
      createdBy: 'system',
      status: APP_CONSTANTS.STATUS.ACTIVE
    }
  ]);
}

function seedUsers_() {
  var repository = new BaseRepository(APP_CONSTANTS.SHEETS.USERS);
  if (repository.getAll().length) return;
  var adminEmail = Utils.normalizeEmail(AppConfig.get('DEFAULT_ADMIN_EMAIL', AuthService.getCurrentEmail() || ''));
  if (!adminEmail) return;
  repository.insert({
    id: Utils.generateId('USR'),
    email: adminEmail,
    nombre: adminEmail,
    rolId: APP_CONSTANTS.ROLES.ADMIN,
    area: 'Direccion',
    activo: true,
    alcanceJson: Utils.stringifyJson({ all: true }),
    createdAt: Utils.formatDate(new Date()),
    updatedAt: Utils.formatDate(new Date()),
    createdBy: adminEmail,
    status: APP_CONSTANTS.STATUS.ACTIVE
  });
}

function seedCatalogs_() {
  var repository = new BaseRepository(APP_CONSTANTS.SHEETS.CATALOGS);
  if (repository.getAll().length) return;
  var records = [
    ['AREA', 'VENTAS', 'Ventas'],
    ['AREA', 'MARKETING', 'Marketing'],
    ['AREA', 'DATOS', 'Datos'],
    ['AREA', 'PROYECTOS', 'Proyectos'],
    ['PROJECT_STATUS', APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED, 'No iniciado'],
    ['PROJECT_STATUS', APP_CONSTANTS.PROJECT_STATUS.IN_PROGRESS, 'En progreso'],
    ['PROJECT_STATUS', APP_CONSTANTS.PROJECT_STATUS.BLOCKED, 'Bloqueado'],
    ['PROJECT_STATUS', APP_CONSTANTS.PROJECT_STATUS.AT_RISK, 'En riesgo'],
    ['PROJECT_STATUS', APP_CONSTANTS.PROJECT_STATUS.DONE, 'Terminado'],
    ['PRIORITY', APP_CONSTANTS.PRIORITY.LOW, 'Baja'],
    ['PRIORITY', APP_CONSTANTS.PRIORITY.MEDIUM, 'Media'],
    ['PRIORITY', APP_CONSTANTS.PRIORITY.HIGH, 'Alta'],
    ['PRIORITY', APP_CONSTANTS.PRIORITY.CRITICAL, 'Critica']
  ].map(function (item, index) {
    return {
      id: Utils.generateId('CAT'),
      categoria: item[0],
      clave: item[1],
      etiqueta: item[2],
      orden: index + 1,
      metadataJson: '{}',
      createdAt: Utils.formatDate(new Date()),
      updatedAt: Utils.formatDate(new Date()),
      createdBy: 'system',
      status: APP_CONSTANTS.STATUS.ACTIVE
    };
  });
  repository.bulkInsert(records);
}

function seedFunnelCatalogs_() {
  var stepRepo = new BaseRepository(APP_CONSTANTS.SHEETS.FUNNEL_STEPS);
  var causeRepo = new BaseRepository(APP_CONSTANTS.SHEETS.FUNNEL_CAUSES);
  if (!stepRepo.getAll().length) {
    stepRepo.bulkInsert([
      'Inicio', 'Captura', 'Validacion INE', 'OCR', 'Biometria', 'OTP', 'Firma', 'Aprobacion', 'Cuenta creada'
    ].map(function (name, index) {
      return {
        id: Utils.generateId('FST'),
        orden: index + 1,
        nombre: name,
        descripcion: name,
        activo: true,
        createdAt: Utils.formatDate(new Date()),
        updatedAt: Utils.formatDate(new Date()),
        createdBy: 'system',
        status: APP_CONSTANTS.STATUS.ACTIVE
      };
    }));
  }
  if (!causeRepo.getAll().length) {
    causeRepo.bulkInsert([
      ['ERR_INE_FRONT', 'Error de lectura frontal', 'INE'],
      ['ERR_OCR', 'Falla OCR', 'OCR'],
      ['ERR_BIOMETRIA', 'Biometria rechazada', 'Biometria'],
      ['ERR_OTP', 'OTP no validado', 'OTP']
    ].map(function (item) {
      return {
        id: Utils.generateId('FCA'),
        codigo: item[0],
        nombre: item[1],
        descripcion: item[1],
        categoria: item[2],
        activo: true,
        createdAt: Utils.formatDate(new Date()),
        updatedAt: Utils.formatDate(new Date()),
        createdBy: 'system',
        status: APP_CONSTANTS.STATUS.ACTIVE
      };
    }));
  }
}

function findOrCreateFolder_(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(name);
}
