var ProjectService = (function () {
  var STATUS_MAP_ = {
    done: APP_CONSTANTS.PROJECT_STATUS.DONE,
    inprogress: APP_CONSTANTS.PROJECT_STATUS.IN_PROGRESS,
    blocked: APP_CONSTANTS.PROJECT_STATUS.BLOCKED,
    atrisk: APP_CONSTANTS.PROJECT_STATUS.AT_RISK,
    notstarted: APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED
  };

  var PRIORITY_MAP_ = {
    critical: APP_CONSTANTS.PRIORITY.CRITICAL,
    high: APP_CONSTANTS.PRIORITY.HIGH,
    medium: APP_CONSTANTS.PRIORITY.MEDIUM,
    low: APP_CONSTANTS.PRIORITY.LOW
  };

  function getProjectRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.PROJECTS);
  }

  function getTaskRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.TASKS);
  }

  function listProjects(filters, userContext) {
    var sourceProjects = getProjectsFromConfiguredSource_();
    var localProjects = getProjectRepo_().getAll();
    var list = mergeProjectLists_(sourceProjects, localProjects).filter(function (project) {
      return canUserAccessProject_(project, userContext);
    });

    filters = filters || {};
    return list.filter(function (project) {
      return ['area', 'responsableEmail', 'estatus', 'prioridad'].every(function (field) {
        return !filters[field] || String(project[field]) === String(filters[field]);
      });
    });
  }

  function saveProject(payload, userContext) {
    Utils.requireFields(payload, ['nombre', 'area', 'responsableEmail', 'fechaCompromiso']);
    var repo = getProjectRepo_();
    var current = payload.id ? repo.findById(payload.id) : null;
    var record = Object.assign({}, payload, {
      folio: payload.folio || (current && current.folio) || Utils.generateId('PRJ'),
      avancePct: Number(payload.avancePct || 0),
      prioridad: payload.prioridad || APP_CONSTANTS.PRIORITY.MEDIUM,
      riesgo: payload.riesgo || APP_CONSTANTS.RISK.LOW,
      estatus: payload.estatus || (current && current.estatus) || APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED
    });
    record.semaforo = Utils.computeTrafficLight(record);

    var saved = payload.id ? repo.update(payload.id, record) : repo.insert(record);
    AuditLogger.log('Proyecto', saved.id, payload.id ? 'UPDATE' : 'CREATE', saved, userContext.email);
    return saved;
  }

  function getProjectDetail(projectId, userContext) {
    var list = listProjects({}, userContext).filter(function (item) {
      return String(item.id || '') === String(projectId || '');
    });
    if (!list.length) throw new Error('No autorizado para consultar este proyecto.');
    var project = list[0];

    var taskRepo = getTaskRepo_();
    var advanceRepo = new BaseRepository(APP_CONSTANTS.SHEETS.ADVANCES);
    var incidentRepo = new BaseRepository(APP_CONSTANTS.SHEETS.INCIDENTS);
    var documentRepo = new BaseRepository(APP_CONSTANTS.SHEETS.DOCUMENTS);

    return {
      project: project,
      tasks: project.sourceType === 'SHEET' ? [] : taskRepo.query({ proyectoId: projectId }),
      advances: project.sourceType === 'SHEET' ? [] : advanceRepo.query({ proyectoId: projectId }),
      incidents: project.sourceType === 'SHEET' ? [] : incidentRepo.query({ proyectoId: projectId }),
      documents: project.sourceType === 'SHEET' ? [] : documentRepo.query({ entidadId: projectId })
    };
  }

  function saveTask(payload, userContext) {
    Utils.requireFields(payload, ['proyectoId', 'titulo', 'responsableEmail', 'fechaCompromiso']);
    var repo = getTaskRepo_();
    var dueDate = new Date(payload.fechaCompromiso);
    var diff = Math.floor((Utils.startOfDay(new Date()) - Utils.startOfDay(dueDate)) / (1000 * 60 * 60 * 24));
    var saved = payload.id ? repo.update(payload.id, Object.assign({}, payload, {
      diasDesfase: diff > 0 ? diff : 0
    })) : repo.insert(Object.assign({}, payload, {
      diasDesfase: diff > 0 ? diff : 0,
      avancePct: Number(payload.avancePct || 0),
      estatus: payload.estatus || APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED
    }));
    AuditLogger.log('Tarea', saved.id, payload.id ? 'UPDATE' : 'CREATE', saved, userContext.email);
    recalculateProjectProgress_(payload.proyectoId);
    return saved;
  }

  function saveAdvance(payload, userContext) {
    Utils.requireFields(payload, ['proyectoId', 'comentario']);
    var advanceRepo = new BaseRepository(APP_CONSTANTS.SHEETS.ADVANCES);
    var saved = advanceRepo.insert({
      proyectoId: payload.proyectoId,
      tareaId: payload.tareaId || '',
      comentario: payload.comentario,
      avancePct: Number(payload.avancePct || 0),
      evidenciaDriveIds: payload.evidenciaDriveIds || ''
    });

    if (payload.tareaId) {
      var task = getTaskRepo_().findById(payload.tareaId);
      if (task) {
        getTaskRepo_().update(payload.tareaId, { avancePct: Number(payload.avancePct || task.avancePct || 0) });
      }
    }
    recalculateProjectProgress_(payload.proyectoId);
    AuditLogger.log('Avance', saved.id, 'CREATE', saved, userContext.email);
    return saved;
  }

  function recalculateProjectProgress_(projectId) {
    var tasks = getTaskRepo_().query({ proyectoId: projectId });
    var repo = getProjectRepo_();
    var project = repo.findById(projectId);
    if (!project) return;
    var progress = tasks.length ? Math.round(Utils.average(tasks, 'avancePct')) : Number(project.avancePct || 0);
    var update = {
      avancePct: progress,
      semaforo: Utils.computeTrafficLight(Object.assign({}, project, { avancePct: progress }))
    };
    repo.update(projectId, update);
  }

  function getPortfolioSummary(userContext) {
    var projects = listProjects({}, userContext);
    var overdue = projects.filter(function (project) {
      return project.fechaCompromiso && new Date(project.fechaCompromiso) < new Date() && Number(project.avancePct || 0) < 100;
    });
    return {
      total: projects.length,
      critical: projects.filter(function (project) { return project.semaforo === 'RED'; }).length,
      overdue: overdue.length,
      completed: projects.filter(function (project) { return project.estatus === APP_CONSTANTS.PROJECT_STATUS.DONE; }).length,
      byArea: Object.keys(Utils.groupBy(projects, 'area')).map(function (area) {
        var group = projects.filter(function (project) { return project.area === area; });
        return { area: area, total: group.length, avancePromedio: Math.round(Utils.average(group, 'avancePct')) };
      })
    };
  }

  function canUserAccessProject_(project, userContext) {
    if (!userContext || AuthService.hasRole(userContext, APP_CONSTANTS.ROLES.ADMIN)) return true;
    var owner = Utils.normalizeEmail(project.responsableEmail || project.ownerEmail || '');
    var allowed = splitEmails_(project.allowedUsers || '');
    if (!owner && !allowed.length) return true;
    if (owner && owner === userContext.email) return true;
    return allowed.indexOf(userContext.email) > -1;
  }

  function splitEmails_(value) {
    return String(value || '')
      .split(/[;,]/)
      .map(function (item) { return Utils.normalizeEmail(item); })
      .filter(Boolean);
  }

  function mergeProjectLists_(sourceProjects, localProjects) {
    var byKey = {};
    (sourceProjects || []).forEach(function (project) {
      var normalized = sanitizeProjectRecord_(project, 'SHEET');
      var key = projectMergeKey_(normalized);
      byKey[key] = normalized;
    });
    (localProjects || []).forEach(function (project) {
      var normalized = sanitizeProjectRecord_(project, 'LOCAL');
      var key = projectMergeKey_(normalized);
      if (!byKey[key]) {
        byKey[key] = normalized;
        return;
      }
      byKey[key] = Object.assign({}, normalized, byKey[key]);
    });
    return Object.keys(byKey).map(function (key) { return byKey[key]; });
  }

  function projectMergeKey_(project) {
    return normalizeKey_(project.id || project.folio || project.nombre || '');
  }

  function sanitizeProjectRecord_(project, sourceType) {
    var record = Object.assign({}, project || {});
    record.id = String(record.id || '').trim() || buildStableSourceId_(record.folio || record.nombre || '', 0);
    record.folio = String(record.folio || record.id || '').trim();
    record.nombre = String(record.nombre || '').trim();
    record.area = String(record.area || '').trim();
    record.responsableEmail = Utils.normalizeEmail(record.responsableEmail || '');
    record.responsableNombre = String(record.responsableNombre || '').trim();
    record.responsableTelefono = normalizePhone_(record.responsableTelefono || '');
    record.sponsor = String(record.sponsor || '').trim();
    record.fechaInicio = formatDateForProject_(record.fechaInicio);
    record.fechaCompromiso = formatDateForProject_(record.fechaCompromiso);
    record.estatus = normalizeProjectStatus_(record.estatus);
    record.prioridad = normalizePriority_(record.prioridad);
    record.semaforo = normalizeTrafficLight_(
      record.semaforo || Utils.computeTrafficLight(record)
    );
    record.avancePct = parsePercent_(record.avancePct, record.estatus);
    record.allowedUsers = String(record.allowedUsers || '').trim();
    record.backlog = Math.max(0, Number(record.backlog || 0));
    record.pipelineDone = Math.max(0, Number(record.pipelineDone || 0));
    record.pipelineBacklog = Math.max(0, Number(record.pipelineBacklog || 0));
    record.impactEstimate = Number(record.impactEstimate || 0);
    record.incidentCriticalCount = Math.max(0, Number(record.incidentCriticalCount || 0));
    record.incidentHighCount = Math.max(0, Number(record.incidentHighCount || 0));
    record.incidentMediumCount = Math.max(0, Number(record.incidentMediumCount || 0));
    record.mttrMinutes = Math.max(0, Number(record.mttrMinutes || 0));
    record.tipo = normalizeProjectType_(record.tipo || '');
    record.sourceType = record.sourceType || sourceType || 'LOCAL';
    return record;
  }

  function getProjectsFromConfiguredSource_() {
    var spreadsheetId = AppConfig.getProjectsSourceSpreadsheetId();
    if (!spreadsheetId) return [];
    try {
      var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      var projectsSheet = pickSourceSheet_(
        spreadsheet,
        AppConfig.getProjectsSourceProjectsSheetName(),
        ['proyectos', 'projectos', 'listado de proyectos']
      );
      if (!projectsSheet) return [];

      var serviceOrdersSheet = pickSourceSheet_(
        spreadsheet,
        AppConfig.getProjectsSourceServiceOrdersSheetName(),
        ['ordenes de servicio', 'órdenes de servicio', 'ordenes', 'ordenes servicio', 'mejoras']
      );
      var incidentsSheet = pickSourceSheet_(
        spreadsheet,
        AppConfig.getProjectsSourceIncidentsSheetName(),
        ['incidencias', 'incidentes', 'issues', 'tickets']
      );
      var templateSheet = pickSourceSheet_(
        spreadsheet,
        AppConfig.getProjectsSourceTemplateSheetName(),
        ['machote proyectos', 'plantilla proyectos', 'template proyectos']
      );
      var activeModelSheet = pickSourceSheet_(
        spreadsheet,
        AppConfig.getProjectsSourceActiveModelSheetName(),
        ['proyecto menores', 'proyecto modelo', 'proyecto activo']
      );

      var sourceProjects = readSheetObjects_(projectsSheet);
      var orders = readSheetObjects_(serviceOrdersSheet);
      var incidents = readSheetObjects_(incidentsSheet);
      var templateRows = readSheetObjects_(templateSheet);
      var activeModelRows = readSheetObjects_(activeModelSheet);

      var orderAgg = buildServiceOrderAggregateByProject_(orders);
      var incidentAgg = buildIncidentAggregateByProject_(incidents);
      var templateTaskCount = templateRows.length;
      var activeModelTaskCount = activeModelRows.length;

      return sourceProjects
        .map(function (row, index) {
          return mapSourceProjectRow_(
            row,
            index + 2,
            projectsSheet.getName(),
            orderAgg,
            incidentAgg,
            templateTaskCount,
            activeModelTaskCount
          );
        })
        .filter(function (project) { return project && project.nombre; });
    } catch (error) {
      Logger.log('No fue posible leer Projects source spreadsheet: ' + error.message);
      return [];
    }
  }

  function pickSourceSheet_(spreadsheet, preferredName, aliases) {
    if (!spreadsheet) return null;
    if (preferredName) {
      var exact = spreadsheet.getSheetByName(preferredName);
      if (exact) return exact;
    }
    var candidates = (aliases || []).map(normalizeKey_);
    var sheets = spreadsheet.getSheets();
    for (var i = 0; i < sheets.length; i += 1) {
      var sheet = sheets[i];
      var normalizedName = normalizeKey_(sheet.getName());
      if (candidates.indexOf(normalizedName) > -1) return sheet;
    }
    return null;
  }

  function readSheetObjects_(sheet) {
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow < 2 || lastColumn < 1) return [];

    var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (header, index) {
      var label = String(header || '').trim();
      return label || ('col_' + (index + 1));
    });
    var values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

    return values.map(function (row) {
      var item = {};
      headers.forEach(function (header, index) {
        item[header] = row[index];
      });
      return item;
    });
  }

  function mapSourceProjectRow_(row, rowNumber, sheetName, orderAgg, incidentAgg, templateTaskCount, activeModelTaskCount) {
    var projectName = pickRowValue_(row, [
      'nombreproyecto', 'proyecto', 'nombre', 'projectname', 'titulo'
    ]);
    if (!projectName) return null;

    var folio = pickRowValue_(row, ['folio', 'clave', 'codigo', 'idproyecto', 'projectid', 'id']);
    var responsible = pickRowValue_(row, ['responsableemail', 'responsable', 'owner', 'correo', 'email']);
    var statusRaw = pickRowValue_(row, ['estatus', 'estado', 'status', 'fase']);
    var priorityRaw = pickRowValue_(row, ['prioridad', 'criticidad', 'severidad', 'priority']);
    var trafficRaw = pickRowValue_(row, ['semaforo', 'trafficlight', 'riesgo']);
    var progressRaw = pickRowValue_(row, ['avancepct', 'avance', 'progreso', 'porcentajeavance', 'progress']);
    var dueDateRaw = pickRowValue_(row, ['fechacompromiso', 'fechafin', 'fechalimite', 'fechaobjetivo', 'fechacierre']);
    var startDateRaw = pickRowValue_(row, ['fechainicio', 'fechaarranque', 'fechastart']);
    var areaRaw = pickRowValue_(row, ['area', 'squad', 'categoria', 'dominio']);
    var sponsorRaw = pickRowValue_(row, ['sponsor', 'lider', 'ownername']);
    var ownerNameRaw = pickRowValue_(row, ['responsablenombre', 'ownername', 'owner', 'responsable']);
    var ownerPhoneRaw = pickRowValue_(row, ['responsabletelefono', 'telefono', 'celular', 'ownerphone', 'phone']);
    var typeRaw = pickRowValue_(row, ['tipo', 'tiporegistro', 'recordtype', 'clase']);
    var commentsRaw = pickRowValue_(row, ['comentarios', 'comentario', 'detalle', 'descripcion', 'notas']);
    var impactRaw = pickRowValue_(row, ['impactoestimado', 'impacto', 'impactoeconomico', 'montoestimado']);

    var keys = buildProjectKeys_(row, projectName, folio);
    var aggregateOrders = findAggregate_(orderAgg, keys);
    var aggregateIncidents = findAggregate_(incidentAgg, keys);

    var estatus = normalizeProjectStatus_(statusRaw);
    var prioridad = normalizePriority_(priorityRaw);
    var avancePct = parsePercent_(progressRaw, estatus);
    var semaforo = normalizeTrafficLight_(trafficRaw || Utils.computeTrafficLight({
      estatus: estatus,
      prioridad: prioridad,
      avancePct: avancePct
    }));

    var incidentCriticalCount = Number((aggregateIncidents && aggregateIncidents.critical) || 0);
    var incidentHighCount = Number((aggregateIncidents && aggregateIncidents.high) || 0);
    var incidentMediumCount = Number((aggregateIncidents && aggregateIncidents.medium) || 0);
    if (incidentCriticalCount > 0) {
      semaforo = 'RED';
      prioridad = APP_CONSTANTS.PRIORITY.CRITICAL;
      if (estatus === APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED) {
        estatus = APP_CONSTANTS.PROJECT_STATUS.AT_RISK;
      }
    } else if (!trafficRaw && incidentHighCount > 0 && semaforo !== 'RED') {
      semaforo = 'YELLOW';
    }

    var mttrMinutes = Number((aggregateIncidents && aggregateIncidents.mttrMinutes) || 0);
    var fallbackMttr = Math.max(15, Math.round((incidentCriticalCount * 180 + incidentHighCount * 95 + incidentMediumCount * 55) / Math.max(1, incidentCriticalCount + incidentHighCount + incidentMediumCount)));
    if (!mttrMinutes) mttrMinutes = fallbackMttr;

    var pipelineDone = Number((aggregateOrders && aggregateOrders.done) || 0);
    var pipelineBacklog = Number((aggregateOrders && aggregateOrders.pending) || 0);
    var backlog = pipelineBacklog + Number((aggregateIncidents && aggregateIncidents.open) || 0);
    var impactEstimate = parseNumber_(impactRaw) + Number((aggregateOrders && aggregateOrders.impactEstimate) || 0);

    return sanitizeProjectRecord_({
      id: buildStableSourceId_(folio || projectName, rowNumber),
      folio: String(folio || '').trim() || ('PRJ-' + rowNumber),
      nombre: String(projectName || '').trim(),
      descripcion: String(commentsRaw || '').trim(),
      area: String(areaRaw || '').trim() || 'Proyectos',
      responsableEmail: normalizeEmailIfPossible_(responsible),
      responsableNombre: String(ownerNameRaw || '').trim(),
      responsableTelefono: normalizePhone_(ownerPhoneRaw),
      sponsor: String(sponsorRaw || '').trim(),
      fechaInicio: formatDateForProject_(startDateRaw),
      fechaCompromiso: formatDateForProject_(dueDateRaw),
      estatus: estatus,
      avancePct: avancePct,
      prioridad: prioridad,
      semaforo: semaforo,
      comentarios: commentsRaw || '',
      backlog: backlog,
      pipelineDone: pipelineDone,
      pipelineBacklog: pipelineBacklog,
      impactEstimate: impactEstimate,
      incidentCriticalCount: incidentCriticalCount,
      incidentHighCount: incidentHighCount,
      incidentMediumCount: incidentMediumCount,
      mttrMinutes: mttrMinutes,
      tipo: normalizeProjectType_(typeRaw || inferProjectTypeFromSignals_(aggregateIncidents, aggregateOrders)),
      sourceType: 'SHEET',
      sourceSheetName: sheetName,
      sourceRowNumber: rowNumber,
      templateTaskCount: Number(templateTaskCount || 0),
      activeModelTaskCount: Number(activeModelTaskCount || 0)
    }, 'SHEET');
  }

  function buildProjectKeys_(row, projectName, folio) {
    var keys = [
      projectName,
      folio,
      pickRowValue_(row, ['id', 'projectid', 'proyectoid', 'clave', 'codigo']),
      pickRowValue_(row, ['nombreproyecto', 'proyecto', 'nombre'])
    ];
    return keys
      .map(normalizeKey_)
      .filter(Boolean);
  }

  function buildServiceOrderAggregateByProject_(rows) {
    var byProject = {};
    (rows || []).forEach(function (row) {
      var key = resolveProjectKeyFromRow_(row);
      if (!key) return;
      if (!byProject[key]) {
        byProject[key] = { pending: 0, done: 0, impactEstimate: 0 };
      }
      var status = normalizeStatusWord_(pickRowValue_(row, ['estatus', 'estado', 'status', 'avance', 'fase']));
      var isClosed = isClosedStatus_(status);
      if (isClosed) byProject[key].done += 1;
      else byProject[key].pending += 1;
      byProject[key].impactEstimate += parseNumber_(pickRowValue_(row, ['impacto', 'impactoestimado', 'monto', 'montoestimado']));
    });
    return byProject;
  }

  function buildIncidentAggregateByProject_(rows) {
    var byProject = {};
    (rows || []).forEach(function (row) {
      var key = resolveProjectKeyFromRow_(row);
      if (!key) return;
      if (!byProject[key]) {
        byProject[key] = { open: 0, critical: 0, high: 0, medium: 0, mttrMinutes: 0, mttrSamples: 0 };
      }
      var status = normalizeStatusWord_(pickRowValue_(row, ['estatus', 'estado', 'status', 'situacion']));
      if (isClosedStatus_(status)) return;

      byProject[key].open += 1;
      var severity = normalizeIncidentSeverity_(pickRowValue_(row, ['severidad', 'criticidad', 'prioridad', 'nivel']));
      if (severity === 'critical') byProject[key].critical += 1;
      else if (severity === 'high') byProject[key].high += 1;
      else byProject[key].medium += 1;

      var mttr = parseNumber_(pickRowValue_(row, ['mttr', 'tiemporesolucionmin', 'tiemporesolucion', 'minutosresolucion']));
      if (mttr > 0) {
        byProject[key].mttrMinutes += mttr;
        byProject[key].mttrSamples += 1;
      }
    });

    Object.keys(byProject).forEach(function (key) {
      var item = byProject[key];
      item.mttrMinutes = item.mttrSamples > 0 ? Math.round(item.mttrMinutes / item.mttrSamples) : 0;
      delete item.mttrSamples;
    });
    return byProject;
  }

  function resolveProjectKeyFromRow_(row) {
    var value = pickRowValue_(row, [
      'proyectoid', 'projectid', 'idproyecto', 'folio', 'claveproyecto', 'codigo',
      'proyecto', 'nombreproyecto', 'nombre'
    ]);
    return normalizeKey_(value);
  }

  function findAggregate_(aggregateMap, keys) {
    var map = aggregateMap || {};
    var result = null;
    (keys || []).some(function (key) {
      if (map[key]) {
        result = map[key];
        return true;
      }
      return false;
    });
    return result;
  }

  function normalizeProjectStatus_(value) {
    var key = normalizeStatusWord_(value);
    if (!key) return APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED;
    if (/(cancelad|cerrad|terminad|completad|implementad|finalizad|done|resuelt)/.test(key)) return STATUS_MAP_.done;
    if (/(bloquead|blocked)/.test(key)) return STATUS_MAP_.blocked;
    if (/(riesgo|atrisk|risk|alerta)/.test(key)) return STATUS_MAP_.atrisk;
    if (/(encurso|enproceso|progreso|inprogress|activo|working)/.test(key)) return STATUS_MAP_.inprogress;
    if (/(pendiente|planificado|backlog|notstarted|nuevo)/.test(key)) return STATUS_MAP_.notstarted;
    return APP_CONSTANTS.PROJECT_STATUS.NOT_STARTED;
  }

  function normalizePriority_(value) {
    var key = normalizeStatusWord_(value);
    if (!key) return APP_CONSTANTS.PRIORITY.MEDIUM;
    if (/(critic|urgente|p0|p1)/.test(key)) return PRIORITY_MAP_.critical;
    if (/(alta|high|p2)/.test(key)) return PRIORITY_MAP_.high;
    if (/(baja|low|p4)/.test(key)) return PRIORITY_MAP_.low;
    return PRIORITY_MAP_.medium;
  }

  function normalizeTrafficLight_(value) {
    var key = normalizeStatusWord_(value);
    if (!key) return '';
    if (/(rojo|red|critic|critico)/.test(key)) return 'RED';
    if (/(amarillo|yellow|riesgo|alerta)/.test(key)) return 'YELLOW';
    if (/(verde|green|ok|controlad|normal)/.test(key)) return 'GREEN';
    return '';
  }

  function normalizeIncidentSeverity_(value) {
    var key = normalizeStatusWord_(value);
    if (/(crit|p1|sev1|s1)/.test(key)) return 'critical';
    if (/(alt|high|p2|sev2|s2)/.test(key)) return 'high';
    return 'medium';
  }

  function normalizeStatusWord_(value) {
    return normalizeKey_(value);
  }

  function normalizeProjectType_(value) {
    var key = normalizeStatusWord_(value);
    if (!key) return 'PROYECTO';
    if (/(incid|incident|ticket|issue)/.test(key)) return 'INCIDENCIA';
    if (/(mejora|enhancement|improvement|orden|serviceorder|servicio)/.test(key)) return 'MEJORA';
    return 'PROYECTO';
  }

  function inferProjectTypeFromSignals_(aggregateIncidents, aggregateOrders) {
    if (aggregateIncidents && Number(aggregateIncidents.open || 0) > 0) return 'INCIDENCIA';
    if (aggregateOrders && (Number(aggregateOrders.pending || 0) > 0 || Number(aggregateOrders.done || 0) > 0)) return 'MEJORA';
    return 'PROYECTO';
  }

  function isClosedStatus_(statusWord) {
    var key = normalizeStatusWord_(statusWord);
    return /(cerrad|completad|resuelt|finalizad|done|implementad|cancelad)/.test(key);
  }

  function parsePercent_(value, statusFallback) {
    var direct = parseNumber_(value);
    if (!isFinite(direct)) {
      if (String(statusFallback || '') === APP_CONSTANTS.PROJECT_STATUS.DONE) return 100;
      return 0;
    }
    if (String(value || '').indexOf('%') > -1) return clamp_(direct, 0, 100);
    if (direct >= 0 && direct <= 1) return clamp_(Math.round(direct * 100), 0, 100);
    return clamp_(Math.round(direct), 0, 100);
  }

  function parseNumber_(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    var raw = String(value).trim();
    if (!raw) return 0;
    var cleaned = raw.replace(/[^\d,.\-]/g, '');
    if (!cleaned) return 0;

    if (cleaned.indexOf(',') > -1 && cleaned.indexOf('.') > -1) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.indexOf(',') > -1) {
      cleaned = cleaned.replace(',', '.');
    }

    var parsed = Number(cleaned);
    return isFinite(parsed) ? parsed : 0;
  }

  function formatDateForProject_(value) {
    if (!value) return '';
    var date = null;
    if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
      date = value;
    } else if (typeof value === 'string') {
      var text = String(value).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
      var ddmmyyyy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        date = new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]));
      } else {
        var parsed = new Date(text);
        if (!isNaN(parsed.getTime())) date = parsed;
      }
    }
    if (!date || isNaN(date.getTime())) return '';
    return Utilities.formatDate(date, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, 'yyyy-MM-dd');
  }

  function normalizeEmailIfPossible_(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    if (text.indexOf('@') === -1) return '';
    return Utils.normalizeEmail(text);
  }

  function normalizePhone_(value) {
    var digits = String(value || '').replace(/[^\d]/g, '');
    if (!digits) return '';
    if (digits.length === 10) return '52' + digits;
    return digits;
  }

  function buildStableSourceId_(value, rowNumber) {
    var normalized = normalizeKey_(value || '');
    if (!normalized) normalized = 'row' + String(rowNumber || '');
    return 'SRC_' + normalized.slice(0, 60);
  }

  function normalizeKey_(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  function pickRowValue_(row, aliases) {
    if (!row) return '';
    var entries = [];
    Object.keys(row).forEach(function (key) {
      entries.push({
        rawKey: key,
        normalizedKey: normalizeKey_(key),
        value: row[key]
      });
    });
    var normalizedAliases = (aliases || []).map(normalizeKey_);

    for (var i = 0; i < normalizedAliases.length; i += 1) {
      var alias = normalizedAliases[i];
      for (var e = 0; e < entries.length; e += 1) {
        if (entries[e].normalizedKey === alias && entries[e].value !== '' && entries[e].value !== null && entries[e].value !== undefined) {
          return entries[e].value;
        }
      }
    }
    for (var j = 0; j < normalizedAliases.length; j += 1) {
      var partialAlias = normalizedAliases[j];
      for (var x = 0; x < entries.length; x += 1) {
        if (entries[x].normalizedKey.indexOf(partialAlias) > -1 && entries[x].value !== '' && entries[x].value !== null && entries[x].value !== undefined) {
          return entries[x].value;
        }
      }
    }
    return '';
  }

  function clamp_(value, min, max) {
    return Math.min(max, Math.max(min, Number(value || 0)));
  }

  return {
    listProjects: listProjects,
    saveProject: saveProject,
    getProjectDetail: getProjectDetail,
    saveTask: saveTask,
    saveAdvance: saveAdvance,
    getPortfolioSummary: getPortfolioSummary
  };
})();
