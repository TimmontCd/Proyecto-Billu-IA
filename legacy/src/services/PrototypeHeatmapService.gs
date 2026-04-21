var PrototypeHeatmapService = (function () {
  var PILOT_CONFIG = {
    prototypeId: 'enrolamiento_n2_flujo_3pantallas_v1',
    title: 'Piloto de mapa de calor - Flujo N2',
    variantId: 'a',
    device: 'mobile',
    frame: {
      width: 360,
      height: 812
    },
    successDefinition: 'Completar las tres pantallas del flujo: aviso de privacidad, datos de contacto y código correo.',
    screens: [
      {
        id: 'aviso_privacidad',
        label: 'Aviso de privacidad',
        step: 1,
        successDefinition: 'Seleccionar SI en ambos consentimientos y tocar Siguiente.',
        zones: [
          { id: 'zone_back', label: 'Regresar', category: 'navigation' },
          { id: 'zone_stepper', label: 'Indicador de pasos', category: 'orientation' },
          { id: 'zone_privacy_yes', label: 'Consentimiento datos personales - Sí', category: 'selection' },
          { id: 'zone_privacy_no', label: 'Consentimiento datos personales - No', category: 'selection' },
          { id: 'zone_geo_yes', label: 'Consentimiento geolocalización - Sí', category: 'selection' },
          { id: 'zone_geo_no', label: 'Consentimiento geolocalización - No', category: 'selection' },
          { id: 'zone_cancel_cta', label: 'Cancelar', category: 'cta' },
          { id: 'zone_next_cta', label: 'Siguiente', category: 'cta' },
          { id: 'zone_blank_area', label: 'Area sin accion', category: 'background' }
        ]
      },
      {
        id: 'contacto_datos',
        label: 'Datos de contacto',
        step: 2,
        successDefinition: 'Completar teléfono y correo y tocar Siguiente.',
        zones: [
          { id: 'zone_back', label: 'Regresar', category: 'navigation' },
          { id: 'zone_stepper', label: 'Indicador de pasos', category: 'orientation' },
          { id: 'zone_rewards_input', label: 'ID de recompensas', category: 'field' },
          { id: 'zone_rewards_help', label: 'Ayuda ID de recompensas', category: 'help' },
          { id: 'zone_phone_input', label: 'Telefono', category: 'field' },
          { id: 'zone_phone_help', label: 'Ayuda telefono', category: 'help' },
          { id: 'zone_email_input', label: 'Correo electronico', category: 'field' },
          { id: 'zone_next_cta', label: 'Siguiente', category: 'cta' },
          { id: 'zone_blank_area', label: 'Area sin accion', category: 'background' }
        ]
      },
      {
        id: 'codigo_correo',
        label: 'Codigo correo',
        step: 3,
        successDefinition: 'Capturar un código de 6 dígitos y tocar Confirmar código.',
        zones: [
          { id: 'zone_back', label: 'Regresar', category: 'navigation' },
          { id: 'zone_stepper', label: 'Indicador de pasos', category: 'orientation' },
          { id: 'zone_code_input', label: 'Código correo', category: 'field' },
          { id: 'zone_resend_code', label: 'Reenviar código', category: 'help' },
          { id: 'zone_confirm_cta', label: 'Confirmar código', category: 'cta' },
          { id: 'zone_blank_area', label: 'Area sin accion', category: 'background' }
        ]
      }
    ]
  };
  var POINT_EVENTS = {
    zone_click: true,
    input_focus: true,
    help_open: true,
    next_click: true,
    next_blocked_click: true,
    validation_error: true,
    back_click: true,
    select_option: true
  };
  var FIRST_ACTION_EVENTS = {
    zone_click: true,
    input_focus: true,
    help_open: true,
    next_click: true,
    next_blocked_click: true,
    back_click: true,
    select_option: true
  };

  function saveEvent(payload, userContext) {
    Utils.requireFields(payload, ['prototypeId', 'screenId', 'variantId', 'sessionId', 'eventType']);
    var repo = new BaseRepository(APP_CONSTANTS.SHEETS.PROTOTYPE_HEATMAP_EVENTS);
    var normalized = normalizePayload_(payload);
    var saved = repo.insert(normalized);
    AuditLogger.log('PrototypeHeatmapEvent', saved.id, 'CREATE', saved, userContext && userContext.email);
    return {
      id: saved.id,
      prototypeId: saved.prototypeId,
      screenId: saved.screenId,
      variantId: saved.variantId,
      eventType: saved.eventType,
      sessionId: saved.sessionId
    };
  }

  function getDashboard(filters) {
    var effectiveFilters = buildFilters_(filters);
    var rows = readRows_(effectiveFilters);
    var sessionMap = buildSessionMap_(rows);
    var screenSummary = buildScreenSummary_(rows, sessionMap);
    return {
      config: Utils.deepClone(PILOT_CONFIG),
      filters: effectiveFilters,
      summary: buildSummary_(rows, sessionMap),
      screenSummary: screenSummary,
      zoneSummaryByScreen: buildZoneSummaryByScreen_(rows, sessionMap),
      points: buildPoints_(rows),
      sessions: buildSessionSummary_(sessionMap),
      insights: buildInsights_(rows, screenSummary)
    };
  }

  function resetPilotData() {
    var repo = new BaseRepository(APP_CONSTANTS.SHEETS.PROTOTYPE_HEATMAP_EVENTS);
    var sheet = repo.sheet;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    return {
      ok: true,
      clearedRows: Math.max(0, lastRow - 1),
      prototypeId: PILOT_CONFIG.prototypeId,
      clearedAt: Utils.formatDate(new Date())
    };
  }

  function buildFilters_(filters) {
    var safe = filters || {};
    return {
      prototypeId: String(safe.prototypeId || PILOT_CONFIG.prototypeId),
      variantId: String(safe.variantId || PILOT_CONFIG.variantId),
      screenId: String(safe.screenId || '').trim()
    };
  }

  function normalizePayload_(payload) {
    return {
      prototypeId: String(payload.prototypeId || '').trim(),
      screenId: String(payload.screenId || '').trim(),
      variantId: String(payload.variantId || '').trim(),
      sessionId: String(payload.sessionId || '').trim(),
      eventType: String(payload.eventType || '').trim(),
      zoneId: String(payload.zoneId || '').trim(),
      xNorm: normalizeCoordinate_(payload.x),
      yNorm: normalizeCoordinate_(payload.y),
      fieldName: String(payload.fieldName || '').trim(),
      buttonState: String(payload.buttonState || '').trim(),
      outcome: String(payload.outcome || '').trim(),
      metaJson: Utils.stringifyJson(payload.meta || {})
    };
  }

  function normalizeCoordinate_(value) {
    if (value === '' || value === null || value === undefined) return '';
    var numberValue = Number(value);
    if (!isFinite(numberValue)) return '';
    if (numberValue < 0) numberValue = 0;
    if (numberValue > 1) numberValue = 1;
    return Math.round(numberValue * 10000) / 10000;
  }

  function readRows_(filters) {
    return new BaseRepository(APP_CONSTANTS.SHEETS.PROTOTYPE_HEATMAP_EVENTS).getAll()
      .filter(function (row) {
        if (filters.prototypeId && row.prototypeId !== filters.prototypeId) return false;
        if (filters.variantId && row.variantId !== filters.variantId) return false;
        if (filters.screenId && row.screenId !== filters.screenId) return false;
        return true;
      })
      .sort(function (left, right) {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      });
  }

  function buildSummary_(rows, sessionMap) {
    var sessionIds = Object.keys(sessionMap);
    var successSessions = sessionIds.filter(function (sessionId) {
      return sessionMap[sessionId].hasSuccess;
    });
    return {
      totalEvents: rows.length,
      totalSessions: sessionIds.length,
      successSessions: successSessions.length,
      successRatePct: sessionIds.length ? roundPercent_(successSessions.length / sessionIds.length) : 0,
      blockedNextClicks: rows.filter(function (row) { return row.eventType === 'next_blocked_click'; }).length,
      helpOpenCount: rows.filter(function (row) { return row.eventType === 'help_open'; }).length,
      averageTimeToSuccessSeconds: calculateAverageTimeToSuccess_(sessionMap)
    };
  }

  function buildScreenSummary_(rows, sessionMap) {
    return PILOT_CONFIG.screens.map(function (screen) {
      var screenRows = rows.filter(function (row) { return row.screenId === screen.id; });
      var sessionIds = uniqueValues_(screenRows, 'sessionId');
      var completedSessions = sessionIds.filter(function (sessionId) {
        return hasScreenSuccess_(sessionMap[sessionId], screen.id);
      });
      return {
        screenId: screen.id,
        label: screen.label,
        step: screen.step,
        totalEvents: screenRows.length,
        totalSessions: sessionIds.length,
        completedSessions: completedSessions.length,
        completionRatePct: sessionIds.length ? roundPercent_(completedSessions.length / sessionIds.length) : 0,
        blockedNextClicks: screenRows.filter(function (row) { return row.eventType === 'next_blocked_click'; }).length,
        averageCompletionSeconds: calculateAverageScreenTime_(sessionMap, screen.id)
      };
    });
  }

  function buildZoneSummaryByScreen_(rows, sessionMap) {
    var result = {};
    PILOT_CONFIG.screens.forEach(function (screen) {
      var screenRows = rows.filter(function (row) { return row.screenId === screen.id; });
      var firstZoneBySession = {};
      uniqueValues_(screenRows, 'sessionId').forEach(function (sessionId) {
        var first = screenRows.filter(function (row) {
          return row.sessionId === sessionId && FIRST_ACTION_EVENTS[row.eventType] && row.zoneId;
        })[0];
        if (first) firstZoneBySession[sessionId] = first.zoneId;
      });
      result[screen.id] = screen.zones.map(function (zone) {
        var zoneRows = screenRows.filter(function (row) {
          return row.zoneId === zone.id && row.eventType !== 'screen_view';
        });
        var uniqueSessions = uniqueValues_(zoneRows, 'sessionId');
        var successSessions = uniqueSessions.filter(function (sessionId) {
          return hasScreenSuccess_(sessionMap[sessionId], screen.id);
        });
        return {
          zoneId: zone.id,
          label: zone.label,
          category: zone.category,
          interactions: zoneRows.length,
          uniqueSessions: uniqueSessions.length,
          firstClicks: Object.keys(firstZoneBySession).filter(function (sessionId) {
            return firstZoneBySession[sessionId] === zone.id;
          }).length,
          successSessions: successSessions.length
        };
      }).sort(function (left, right) {
        return right.interactions - left.interactions;
      });
    });
    return result;
  }

  function buildPoints_(rows) {
    return rows.filter(function (row) {
      return POINT_EVENTS[row.eventType] && row.xNorm !== '' && row.yNorm !== '';
    }).slice(-600).map(function (row) {
      return {
        screenId: row.screenId || '',
        x: Number(row.xNorm || 0),
        y: Number(row.yNorm || 0),
        zoneId: row.zoneId || '',
        eventType: row.eventType || '',
        createdAt: row.createdAt || ''
      };
    });
  }

  function buildSessionSummary_(sessionMap) {
    return Object.keys(sessionMap).map(function (sessionId) {
      var item = sessionMap[sessionId];
      return {
        sessionId: sessionId,
        startedAt: item.startedAt ? Utils.formatDate(item.startedAt) : '',
        hasSuccess: item.hasSuccess,
        durationSeconds: item.durationSeconds,
        eventCount: item.rows.length,
        screenDurations: buildScreenDurationSummary_(item.screenDurationsById)
      };
    }).sort(function (left, right) {
      return new Date(right.startedAt || 0).getTime() - new Date(left.startedAt || 0).getTime();
    }).slice(0, 12);
  }

  function buildInsights_(rows, screenSummary) {
    var insights = [];
    if (!rows.length) {
      insights.push('El piloto aun no tiene eventos. Inicia una sesion y recorre el flujo para comenzar a pintar el heatmap.');
      return insights;
    }
    var blockedScreen = screenSummary.slice().sort(function (left, right) {
      return Number(right.blockedNextClicks || 0) - Number(left.blockedNextClicks || 0);
    })[0];
    if (blockedScreen && Number(blockedScreen.blockedNextClicks || 0) > 0) {
      insights.push('La mayor friccion actual aparece en ' + blockedScreen.label + ' con ' + blockedScreen.blockedNextClicks + ' intento(s) bloqueados.');
    }
    var weakestScreen = screenSummary.slice().sort(function (left, right) {
      return Number(left.completionRatePct || 0) - Number(right.completionRatePct || 0);
    })[0];
    if (weakestScreen && Number(weakestScreen.totalSessions || 0) > 0) {
      insights.push('La pantalla con menor tasa de completado es ' + weakestScreen.label + ' con ' + weakestScreen.completionRatePct + '%.');
    }
    var slowestScreen = screenSummary.filter(function (item) {
      return Number(item.averageCompletionSeconds || 0) > 0;
    }).sort(function (left, right) {
      return Number(right.averageCompletionSeconds || 0) - Number(left.averageCompletionSeconds || 0);
    })[0];
    if (slowestScreen) {
      insights.push('La pantalla que hoy toma más tiempo en completarse es ' + slowestScreen.label + ' con ' + slowestScreen.averageCompletionSeconds + 's en promedio.');
    }
    if (!insights.length) {
      insights.push('El flujo ya tiene eventos suficientes para comenzar a comparar pantallas. Sigue sumando sesiones para estabilizar el patrón.');
    }
    return insights;
  }

  function buildSessionMap_(rows) {
    var sessionMap = rows.reduce(function (acc, row) {
      var sessionId = row.sessionId || 'UNKNOWN';
      if (!acc[sessionId]) {
        acc[sessionId] = {
          rows: [],
          hasSuccess: false,
          startedAt: null,
          durationSeconds: 0,
          screenDurationsById: {}
        };
      }
      acc[sessionId].rows.push(row);
      var createdAt = new Date(row.createdAt);
      if (!acc[sessionId].startedAt || createdAt < acc[sessionId].startedAt) {
        acc[sessionId].startedAt = createdAt;
      }
      if (row.eventType === 'task_success') {
        acc[sessionId].hasSuccess = true;
        acc[sessionId].durationSeconds = computeSessionDuration_(acc[sessionId].rows);
      }
      return acc;
    }, {});

    Object.keys(sessionMap).forEach(function (sessionId) {
      sessionMap[sessionId].screenDurationsById = computeScreenDurations_(sessionMap[sessionId].rows);
      if (sessionMap[sessionId].hasSuccess && !sessionMap[sessionId].durationSeconds) {
        sessionMap[sessionId].durationSeconds = computeSessionDuration_(sessionMap[sessionId].rows);
      }
    });

    return sessionMap;
  }

  function hasScreenSuccess_(sessionItem, screenId) {
    if (!sessionItem || !sessionItem.rows) return false;
    return sessionItem.rows.some(function (row) {
      return row.screenId === screenId && (row.eventType === 'screen_success' || row.eventType === 'task_success');
    });
  }

  function computeSessionDuration_(rows) {
    if (!rows.length) return 0;
    var first = new Date(rows[0].createdAt).getTime();
    var last = new Date(rows[rows.length - 1].createdAt).getTime();
    if (!first || !last || last < first) return 0;
    return Math.round((last - first) / 1000);
  }

  function computeScreenDurations_(rows) {
    var durations = {};
    PILOT_CONFIG.screens.forEach(function (screen) {
      var screenRows = (rows || []).filter(function (row) {
        return row.screenId === screen.id;
      });
      if (!screenRows.length) return;
      var startRow = screenRows.filter(function (row) {
        return row.eventType === 'screen_view';
      })[0] || screenRows[0];
      var endRow = screenRows.filter(function (row) {
        return row.eventType === 'screen_success' || row.eventType === 'task_success';
      })[0];
      if (!startRow || !endRow) return;
      var start = new Date(startRow.createdAt).getTime();
      var end = new Date(endRow.createdAt).getTime();
      if (!start || !end || end < start) return;
      durations[screen.id] = Math.round((end - start) / 1000);
    });
    return durations;
  }

  function calculateAverageTimeToSuccess_(sessionMap) {
    var durations = Object.keys(sessionMap).map(function (sessionId) {
      return sessionMap[sessionId].hasSuccess ? sessionMap[sessionId].durationSeconds : null;
    }).filter(function (value) {
      return value !== null;
    });
    if (!durations.length) return 0;
    return Math.round(Utils.average(durations, function (value) { return value; }));
  }

  function calculateAverageScreenTime_(sessionMap, screenId) {
    var durations = Object.keys(sessionMap).map(function (sessionId) {
      var item = sessionMap[sessionId];
      if (!item || !item.screenDurationsById) return null;
      var value = item.screenDurationsById[screenId];
      return value === undefined || value === null ? null : Number(value);
    }).filter(function (value) {
      return value !== null && isFinite(value);
    });
    if (!durations.length) return 0;
    return Math.round(Utils.average(durations, function (value) { return value; }));
  }

  function buildScreenDurationSummary_(screenDurationsById) {
    return PILOT_CONFIG.screens.map(function (screen) {
      return {
        screenId: screen.id,
        label: screen.label,
        seconds: screenDurationsById && screenDurationsById[screen.id] !== undefined ? Number(screenDurationsById[screen.id] || 0) : null
      };
    });
  }

  function uniqueValues_(rows, key) {
    var map = {};
    (rows || []).forEach(function (row) {
      var value = row[key];
      if (value) map[value] = true;
    });
    return Object.keys(map);
  }

  function roundPercent_(value) {
    return Math.round(Number(value || 0) * 10000) / 100;
  }

  return {
    getDashboard: getDashboard,
    resetPilotData: resetPilotData,
    saveEvent: saveEvent
  };
})();
