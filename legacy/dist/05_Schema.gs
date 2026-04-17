var AppSchema = (function () {
  var base = ['id', 'createdAt', 'updatedAt', 'createdBy', 'status'];

  var schemas = {};
  schemas[APP_CONSTANTS.SHEETS.USERS] = base.concat([
    'email', 'nombre', 'rolId', 'rolesJson', 'area', 'activo', 'alcanceJson',
    'passwordHash', 'passwordSalt', 'passwordUpdatedAt', 'mustChangePassword',
    'failedLoginAttempts', 'lockedUntil', 'lastLoginAt', 'passwordResetTokenHash',
    'passwordResetRequestedAt'
  ]);
  schemas[APP_CONSTANTS.SHEETS.ROLES] = base.concat(['nombre', 'descripcion', 'permisosJson']);
  schemas[APP_CONSTANTS.SHEETS.CATALOGS] = base.concat(['categoria', 'clave', 'etiqueta', 'orden', 'metadataJson']);
  schemas[APP_CONSTANTS.SHEETS.PROJECTS] = base.concat([
    'folio', 'nombre', 'descripcion', 'area', 'responsableEmail', 'sponsor', 'fechaInicio', 'fechaCompromiso',
    'estatus', 'avancePct', 'prioridad', 'riesgo', 'dependencias', 'comentarios', 'semaforo', 'allowedUsers',
    'kpiMeta', 'kpiActual', 'backlog', 'bloqueos'
  ]);
  schemas[APP_CONSTANTS.SHEETS.TASKS] = base.concat([
    'proyectoId', 'titulo', 'descripcion', 'responsableEmail', 'fechaInicio', 'fechaCompromiso', 'fechaCierreReal',
    'estatus', 'avancePct', 'prioridad', 'diasDesfase', 'bloqueada', 'comentarios'
  ]);
  schemas[APP_CONSTANTS.SHEETS.TEAM_TASKS] = base.concat([
    'titulo', 'descripcion', 'responsableEmail', 'responsableNombre', 'area', 'prioridad', 'estadoTarea',
    'fechaInicio', 'fechaLimite', 'fechaCompletado', 'avancePct', 'proyectoId', 'asignadoPor', 'asignadoPorNombre',
    'comentarios', 'ultimoRecordatorioAt', 'ultimoRecordatorioTipo'
  ]);
  schemas[APP_CONSTANTS.SHEETS.ADVANCES] = base.concat(['proyectoId', 'tareaId', 'comentario', 'avancePct', 'evidenciaDriveIds']);
  schemas[APP_CONSTANTS.SHEETS.INCIDENTS] = base.concat(['proyectoId', 'tareaId', 'tipo', 'severidad', 'descripcion', 'bloqueante', 'responsableEmail']);
  schemas[APP_CONSTANTS.SHEETS.ALERTS] = base.concat(['tipo', 'modulo', 'severidad', 'mensaje', 'destinatarios', 'fechaEnvio', 'entidadId', 'metadataJson']);
  schemas[APP_CONSTANTS.SHEETS.DOCUMENTS] = base.concat(['tipo', 'entidadOrigen', 'entidadId', 'driveFileId', 'nombre', 'version', 'generadoPor']);
  schemas[APP_CONSTANTS.SHEETS.AUDIOS] = base.concat(['proyectoId', 'driveFileId', 'nombreArchivo', 'mimeType', 'tamano', 'estadoTranscripcion', 'transcriptIdExt', 'texto']);
  schemas[APP_CONSTANTS.SHEETS.MINUTES] = base.concat(['proyectoId', 'audioId', 'nombreReunion', 'fechaReunion', 'participantes', 'resumen', 'acuerdos', 'tareasJson', 'docId']);
  schemas[APP_CONSTANTS.SHEETS.FUNCTIONAL_ANALYSES] = base.concat([
    'proyectoId', 'nombre', 'objetivo', 'descripcion', 'problemaActual', 'alcance', 'reglasNegocio', 'excepciones',
    'flujoActual', 'flujoFuturo', 'dependencias', 'riesgos', 'criteriosAceptacion', 'referencias', 'docId', 'version'
  ]);
  schemas[APP_CONSTANTS.SHEETS.FUNNEL_STEPS] = base.concat(['orden', 'nombre', 'descripcion', 'activo']);
  schemas[APP_CONSTANTS.SHEETS.FUNNEL_CAUSES] = base.concat(['codigo', 'nombre', 'descripcion', 'categoria', 'activo']);
  schemas[APP_CONSTANTS.SHEETS.FUNNEL_EVENTS] = base.concat(['fecha', 'hora', 'paso', 'causaId', 'canal', 'origen', 'total', 'descripcionEvento', 'metadataJson']);
  schemas[APP_CONSTANTS.SHEETS.DATASETS] = base.concat(['nombre', 'tipo', 'estructuraJson', 'origen', 'fechaCarga', 'hojaOrigen', 'ownerEmail']);
  schemas[APP_CONSTANTS.SHEETS.DATASET_ROWS] = base.concat(['datasetId', 'technicalId', 'payloadJson', 'periodo', 'canal', 'categoria', 'estado', 'municipio', 'montoAgregado']);
  schemas[APP_CONSTANTS.SHEETS.SAVED_QUERIES] = base.concat(['nombre', 'modulo', 'filtrosJson', 'columnas', 'usuarioEmail']);
  schemas[APP_CONSTANTS.SHEETS.HISTORICAL] = base.concat([
    'fecha', 'hora', 'franjaHoraria', 'saldo', 'venta', 'canal', 'producto', 'region', 'estado', 'municipio',
    'segmento', 'responsable', 'identificadorTecnico', 'origenCarga', 'timestampCarga', 'hashRegistro'
  ]);
  schemas[APP_CONSTANTS.SHEETS.HISTORICAL_LOADS] = base.concat([
    'fechaCarga', 'archivoOrigen', 'tipoCarga', 'registrosLeidos', 'registrosValidos', 'registrosDuplicados',
    'registrosError', 'usuarioCarga', 'observaciones'
  ]);
  schemas[APP_CONSTANTS.SHEETS.PROTOTYPE_HEATMAP_EVENTS] = base.concat([
    'prototypeId', 'screenId', 'variantId', 'sessionId', 'eventType', 'zoneId', 'xNorm', 'yNorm',
    'fieldName', 'buttonState', 'outcome', 'metaJson'
  ]);
  schemas[APP_CONSTANTS.SHEETS.TINCHO_MANUALS] = base.concat([
    'titulo', 'area', 'tags', 'sourceType', 'sourceName', 'versionManual', 'contenido', 'resumen', 'activo',
    'dialogflowKnowledgeBaseId', 'dialogflowKnowledgeBaseName', 'dialogflowDocumentId', 'dialogflowDocumentName',
    'syncStatus', 'syncError', 'syncAttemptAt'
  ]);
  schemas[APP_CONSTANTS.SHEETS.TINCHO_QUERIES] = base.concat([
    'userEmail', 'userName', 'pregunta', 'respuesta', 'answerStatus', 'answerEngine', 'confidenceScore',
    'confidenceLabel', 'dialogflowResponseId', 'sourceManualIds', 'sourceManualTitles', 'suggestedStepsJson',
    'requiresEscalation', 'escalationId', 'feedbackScore', 'feedbackComment'
  ]);
  schemas[APP_CONSTANTS.SHEETS.TINCHO_FEEDBACK] = base.concat([
    'queryId', 'userEmail', 'userName', 'utilidad', 'calificacion', 'comentario'
  ]);
  schemas[APP_CONSTANTS.SHEETS.TINCHO_ESCALATIONS] = base.concat([
    'queryId', 'userEmail', 'userName', 'pregunta', 'destinatarios', 'estadoEscalacion', 'mailSentAt', 'detalle'
  ]);
  schemas[APP_CONSTANTS.SHEETS.AUDIT_LOG] = base.concat(['entidad', 'entidadId', 'accion', 'payloadJson', 'usuario']);

  function getSheetNames() {
    return Object.keys(schemas);
  }

  function getHeaders(sheetName) {
    if (!schemas[sheetName]) throw new Error('Schema not found for sheet: ' + sheetName);
    return schemas[sheetName];
  }

  return {
    getHeaders: getHeaders,
    getSheetNames: getSheetNames
  };
})();
