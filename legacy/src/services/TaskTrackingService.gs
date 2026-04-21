var TaskTrackingService = (function () {
  var TASK_ENTITY = 'SeguimientoTarea';

  function getTaskRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.TEAM_TASKS, AppConfig.getTaskTrackingSpreadsheetId());
  }

  function getUserRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.USERS);
  }

  function getAuditRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.AUDIT_LOG);
  }

  function getAlertRepo_() {
    return new BaseRepository(APP_CONSTANTS.SHEETS.ALERTS);
  }

  function normalizeTaskStatus_(status) {
    var normalized = String(status || '').trim().toUpperCase();
    if (normalized === APP_CONSTANTS.TASK_STATUS.IN_PROGRESS) return APP_CONSTANTS.TASK_STATUS.IN_PROGRESS;
    if (normalized === APP_CONSTANTS.TASK_STATUS.COMPLETED) return APP_CONSTANTS.TASK_STATUS.COMPLETED;
    return APP_CONSTANTS.TASK_STATUS.PENDING;
  }

  function normalizeFilterTaskStatus_(status) {
    var normalized = String(status || '').trim().toUpperCase();
    if (!normalized) return '';
    return normalizeTaskStatus_(normalized);
  }

  function normalizePriority_(priority) {
    var normalized = String(priority || '').trim().toUpperCase();
    return APP_CONSTANTS.PRIORITY[normalized] ? normalized : APP_CONSTANTS.PRIORITY.MEDIUM;
  }

  function normalizeDate_(value, fallback) {
    if (!value) return fallback || '';
    return Utils.formatDate(new Date(value), APP_CONSTANTS.DATE_FORMAT);
  }

  function getAssignableUsers_() {
    return getUserRepo_().getAll()
      .filter(function (user) {
        return user.status === APP_CONSTANTS.STATUS.ACTIVE && String(user.activo) !== 'false';
      })
      .map(function (user) {
        return {
          email: Utils.normalizeEmail(user.email),
          nombre: user.nombre || user.email,
          area: user.area || '',
          rolId: user.rolId || APP_CONSTANTS.ROLES.OPERATOR
        };
      })
      .sort(function (a, b) {
        return String(a.nombre || a.email).localeCompare(String(b.nombre || b.email));
      });
  }

  function findAssignableUser_(email) {
    var normalizedEmail = Utils.normalizeEmail(email);
    return getAssignableUsers_().filter(function (user) {
      return user.email === normalizedEmail;
    })[0] || null;
  }

  function ensureAssignableUser_(email) {
    var user = findAssignableUser_(email);
    if (!user) throw new Error('El responsable debe ser un usuario activo del equipo.');
    return user;
  }

  function canManageTask_(task, userContext) {
    if (AuthService.hasRole(userContext, APP_CONSTANTS.ROLES.ADMIN)) return true;
    var email = Utils.normalizeEmail(userContext.email);
    return Utils.normalizeEmail(task.responsableEmail) === email ||
      Utils.normalizeEmail(task.createdBy) === email ||
      Utils.normalizeEmail(task.asignadoPor) === email;
  }

  function canViewTask_(task, userContext) {
    return canManageTask_(task, userContext);
  }

  function getDaysToDue_(task) {
    if (!task.fechaLimite) return '';
    return Math.floor((Utils.startOfDay(new Date(task.fechaLimite)) - Utils.startOfDay(new Date())) / (1000 * 60 * 60 * 24));
  }

  function buildTaskView_(task, userContext) {
    var daysToDue = getDaysToDue_(task);
    var overdue = task.estadoTarea !== APP_CONSTANTS.TASK_STATUS.COMPLETED && daysToDue !== '' && daysToDue < 0;
    var dueSoon = task.estadoTarea !== APP_CONSTANTS.TASK_STATUS.COMPLETED && daysToDue !== '' && daysToDue >= 0 && daysToDue <= 2;

    return {
      id: task.id,
      titulo: task.titulo || '',
      descripcion: task.descripcion || '',
      responsableEmail: Utils.normalizeEmail(task.responsableEmail),
      responsableNombre: task.responsableNombre || task.responsableEmail || '',
      area: task.area || '',
      prioridad: task.prioridad || APP_CONSTANTS.PRIORITY.MEDIUM,
      estadoTarea: normalizeTaskStatus_(task.estadoTarea),
      fechaInicio: task.fechaInicio || '',
      fechaLimite: task.fechaLimite || '',
      fechaCompletado: task.fechaCompletado || '',
      avancePct: Number(task.avancePct || 0),
      proyectoId: task.proyectoId || '',
      asignadoPor: task.asignadoPor || task.createdBy || '',
      asignadoPorNombre: task.asignadoPorNombre || task.asignadoPor || task.createdBy || '',
      comentarios: task.comentarios || '',
      createdAt: task.createdAt || '',
      updatedAt: task.updatedAt || '',
      overdue: overdue,
      dueSoon: dueSoon,
      daysToDue: daysToDue,
      canManage: canManageTask_(task, userContext)
    };
  }

  function sortTasks_(tasks) {
    return tasks.slice().sort(function (a, b) {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.dueSoon !== b.dueSoon) return a.dueSoon ? -1 : 1;
      if (a.fechaLimite && b.fechaLimite) return new Date(a.fechaLimite) - new Date(b.fechaLimite);
      if (a.fechaLimite) return -1;
      if (b.fechaLimite) return 1;
      return String(a.titulo || '').localeCompare(String(b.titulo || ''));
    });
  }

  function applyTaskFilters_(tasks, filters) {
    filters = filters || {};
    return tasks.filter(function (task) {
      if (filters.responsableEmail && Utils.normalizeEmail(task.responsableEmail) !== Utils.normalizeEmail(filters.responsableEmail)) return false;
      if (filters.estadoTarea && normalizeTaskStatus_(task.estadoTarea) !== normalizeTaskStatus_(filters.estadoTarea)) return false;
      if (filters.search) {
        var search = String(filters.search).trim().toLowerCase();
        var haystack = [
          task.titulo,
          task.descripcion,
          task.responsableNombre,
          task.responsableEmail,
          task.proyectoId,
          task.comentarios
        ].join(' ').toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });
  }

  function buildSummary_(tasks) {
    var total = tasks.length;
    var completed = tasks.filter(function (task) { return task.estadoTarea === APP_CONSTANTS.TASK_STATUS.COMPLETED; }).length;
    var inProgress = tasks.filter(function (task) { return task.estadoTarea === APP_CONSTANTS.TASK_STATUS.IN_PROGRESS; }).length;
    var pending = tasks.filter(function (task) { return task.estadoTarea === APP_CONSTANTS.TASK_STATUS.PENDING; }).length;
    var overdue = tasks.filter(function (task) { return task.overdue; }).length;
    var dueSoon = tasks.filter(function (task) { return task.dueSoon; }).length;
    return {
      total: total,
      completed: completed,
      inProgress: inProgress,
      pending: pending,
      overdue: overdue,
      dueSoon: dueSoon,
      completionPct: total ? Math.round((completed / total) * 100) : 0
    };
  }

  function buildByUserSummary_(tasks, users) {
    return users.map(function (user) {
      var userTasks = tasks.filter(function (task) {
        return Utils.normalizeEmail(task.responsableEmail) === Utils.normalizeEmail(user.email);
      });
      var summary = buildSummary_(userTasks);
      return {
        usuario: user.nombre,
        email: user.email,
        area: user.area || '',
        total: summary.total,
        completadas: summary.completed,
        enProgreso: summary.inProgress,
        pendientes: summary.pending,
        vencidas: summary.overdue,
        progreso: summary.completionPct + '%'
      };
    }).filter(function (row) {
      return row.total > 0;
    }).sort(function (a, b) {
      return b.total - a.total || String(a.usuario).localeCompare(String(b.usuario));
    });
  }

  function buildRecentActivity_(tasks, userContext) {
    var allowedIds = tasks.reduce(function (acc, task) {
      acc[task.id] = true;
      return acc;
    }, {});

    return getAuditRepo_().getAll()
      .filter(function (row) {
        return row.entidad === TASK_ENTITY && allowedIds[row.entidadId];
      })
      .slice(-25)
      .reverse()
      .map(function (row) {
        var payload = Utils.parseJson(row.payloadJson, {});
        return {
          fecha: row.createdAt,
          accion: row.accion,
          tarea: payload.titulo || row.entidadId,
          responsable: payload.responsableNombre || payload.responsableEmail || '',
          estado: payload.estadoTarea || '',
          usuario: row.usuario || userContext.email
        };
      });
  }

  function getDashboard(filters, userContext) {
    var allTasks = getTaskRepo_().getAll().filter(function (task) {
      return canViewTask_(task, userContext);
    }).map(function (task) {
      return buildTaskView_(task, userContext);
    });

    var filteredTasks = sortTasks_(applyTaskFilters_(allTasks, filters));
    var users = getAssignableUsers_();

    return {
      filters: {
        responsableEmail: Utils.normalizeEmail((filters && filters.responsableEmail) || ''),
        estadoTarea: normalizeFilterTaskStatus_((filters && filters.estadoTarea) || ''),
        search: (filters && filters.search) || ''
      },
      users: users,
      summary: buildSummary_(filteredTasks),
      byUser: buildByUserSummary_(allTasks, users),
      tasks: filteredTasks,
      recentActivity: buildRecentActivity_(allTasks, userContext)
    };
  }

  function saveTask(payload, userContext) {
    Utils.requireFields(payload, ['titulo', 'responsableEmail', 'fechaLimite']);
    var repo = getTaskRepo_();
    var current = payload.id ? repo.findById(payload.id) : null;
    if (current && !canManageTask_(current, userContext)) {
      throw new Error('No tienes permisos para editar esta actividad.');
    }

    var responsibleUser = ensureAssignableUser_(payload.responsableEmail);
    var status = normalizeTaskStatus_(payload.estadoTarea || (current && current.estadoTarea));
    var progress = Number(payload.avancePct || (current && current.avancePct) || 0);

    if (status === APP_CONSTANTS.TASK_STATUS.COMPLETED) progress = 100;
    if (status === APP_CONSTANTS.TASK_STATUS.PENDING && payload.avancePct === '') progress = 0;
    if (status === APP_CONSTANTS.TASK_STATUS.IN_PROGRESS && progress <= 0) progress = 50;

    var patch = {
      titulo: payload.titulo,
      descripcion: payload.descripcion || '',
      responsableEmail: responsibleUser.email,
      responsableNombre: responsibleUser.nombre,
      area: payload.area || responsibleUser.area || '',
      prioridad: normalizePriority_(payload.prioridad || (current && current.prioridad)),
      estadoTarea: status,
      fechaInicio: normalizeDate_(payload.fechaInicio || (current && current.fechaInicio), Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT)),
      fechaLimite: normalizeDate_(payload.fechaLimite),
      fechaCompletado: status === APP_CONSTANTS.TASK_STATUS.COMPLETED
        ? normalizeDate_(payload.fechaCompletado || (current && current.fechaCompletado), Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT))
        : '',
      avancePct: progress,
      proyectoId: payload.proyectoId || (current && current.proyectoId) || '',
      comentarios: payload.comentarios || ''
    };

    var saved = current
      ? repo.update(current.id, patch)
      : repo.insert(Object.assign({}, patch, {
        asignadoPor: userContext.email,
        asignadoPorNombre: userContext.name
      }));

    AuditLogger.log(TASK_ENTITY, saved.id, current ? 'UPDATE' : 'CREATE', saved, userContext.email);
    return buildTaskView_(saved, userContext);
  }

  function updateTaskStatus(payload, userContext) {
    Utils.requireFields(payload, ['taskId', 'estadoTarea']);
    var repo = getTaskRepo_();
    var current = repo.findById(payload.taskId);
    if (!current) throw new Error('La actividad no existe.');
    if (!canManageTask_(current, userContext)) throw new Error('No tienes permisos para actualizar esta actividad.');

    var nextStatus = normalizeTaskStatus_(payload.estadoTarea);
    var nextProgress = Number(payload.avancePct || current.avancePct || 0);

    if (nextStatus === APP_CONSTANTS.TASK_STATUS.COMPLETED) nextProgress = 100;
    if (nextStatus === APP_CONSTANTS.TASK_STATUS.PENDING) nextProgress = 0;
    if (nextStatus === APP_CONSTANTS.TASK_STATUS.IN_PROGRESS && nextProgress <= 0) nextProgress = 50;

    var saved = repo.update(current.id, {
      estadoTarea: nextStatus,
      avancePct: nextProgress,
      fechaCompletado: nextStatus === APP_CONSTANTS.TASK_STATUS.COMPLETED
        ? Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT)
        : '',
      comentarios: payload.comentarios || current.comentarios || ''
    });

    AuditLogger.log(TASK_ENTITY, saved.id, 'STATUS_UPDATE', saved, userContext.email);
    return buildTaskView_(saved, userContext);
  }

  function shouldSendReminder_(task, reminderType) {
    var lastReminderDate = task.ultimoRecordatorioAt ? Utils.formatDate(new Date(task.ultimoRecordatorioAt), APP_CONSTANTS.DATE_FORMAT) : '';
    var today = Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT);
    return !(lastReminderDate === today && task.ultimoRecordatorioTipo === reminderType);
  }

  function registerReminderAlert_(task, reminderType, message) {
    getAlertRepo_().insert({
      tipo: reminderType,
      modulo: 'SeguimientoActividades',
      severidad: reminderType === 'TASK_OVERDUE' ? APP_CONSTANTS.ALERT_SEVERITY.CRITICAL : APP_CONSTANTS.ALERT_SEVERITY.WARNING,
      mensaje: message,
      destinatarios: task.responsableEmail,
      fechaEnvio: Utils.formatDate(new Date()),
      entidadId: task.id,
      metadataJson: Utils.stringifyJson({
        titulo: task.titulo,
        fechaLimite: task.fechaLimite,
        responsableEmail: task.responsableEmail
      })
    });
  }

  function sendDueSoonReminders() {
    var repo = getTaskRepo_();
    var now = new Date();
    var today = Utils.startOfDay(now);
    var sent = [];
    var skipped = 0;

    repo.getAll().forEach(function (task) {
      if (normalizeTaskStatus_(task.estadoTarea) === APP_CONSTANTS.TASK_STATUS.COMPLETED) return;
      if (!task.fechaLimite || !task.responsableEmail) return;

      var dueDate = Utils.startOfDay(new Date(task.fechaLimite));
      var daysToDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      var reminderType = '';

      if (daysToDue < 0) reminderType = 'TASK_OVERDUE';
      else if (daysToDue <= 2) reminderType = 'TASK_DUE_SOON';
      else return;

      if (!shouldSendReminder_(task, reminderType)) {
        skipped += 1;
        return;
      }

      var view = buildTaskView_(task, { email: task.responsableEmail, role: APP_CONSTANTS.ROLES.ADMIN });
      var message = MailService.sendTeamTaskReminder(view, reminderType);
      repo.update(task.id, {
        ultimoRecordatorioAt: Utils.formatDate(now),
        ultimoRecordatorioTipo: reminderType
      });
      registerReminderAlert_(task, reminderType, message);
      sent.push({
        id: task.id,
        titulo: task.titulo,
        responsableEmail: task.responsableEmail,
        tipo: reminderType,
        fechaLimite: task.fechaLimite
      });
    });

    return {
      sent: sent.length,
      skipped: skipped,
      tasks: sent
    };
  }

  function ensureSheetReady() {
    var repo = getTaskRepo_();
    return {
      sheetName: APP_CONSTANTS.SHEETS.TEAM_TASKS,
      spreadsheetId: AppConfig.getTaskTrackingSpreadsheetId(),
      rows: Math.max(repo.sheet.getLastRow() - 1, 0),
      users: getAssignableUsers_().length
    };
  }

  return {
    getDashboard: getDashboard,
    saveTask: saveTask,
    updateTaskStatus: updateTaskStatus,
    sendDueSoonReminders: sendDueSoonReminders,
    ensureSheetReady: ensureSheetReady
  };
})();
