(function () {
  var ORDER_STORAGE_KEY = "billu-customer-categorization-order-latest";
  var LEGACY_LEVEL_RULES = {
    Exploradores: "saldo promedio 3 meses < 500, o hasta 2 transacciones, o antiguedad menor a 90 dias",
    Constructores: "saldo promedio 3 meses entre 500 y 5000, con 3 a 9 transacciones y relacion activa estable",
    Aliados_Premium: "saldo promedio 3 meses > 5000, o saldo >= 2000 con 10+ transacciones y antiguedad >= 180 dias"
  };
  var LOOKUP_DETAIL_HEADERS = [
    "ID_RECOMPENSAS",
    "NIVEL_CLIENTE_ID",
    "NIVEL_CLIENTE",
    "NIVEL_CLIENTE_REGLA",
    "TARJETA_RECOMENDADA",
    "TARJETA_BENEFICIOS",
    "SALDO_PROMEDIO_HOY",
    "SALDO_PROMEDIO_CATALOGO",
    "SALDO_PROMEDIO_3_MESES",
    "TRANSACCIONES_TOTALES",
    "ABONOS_30D",
    "CARGOS_30D",
    "PERFIL_TRANSACCIONAL",
    "ANTIGUEDAD_DIAS",
    "ESTATUS_DE_LA_CUENTA",
    "FECHA_APERTURA_CUENTA",
    "ESTADO",
    "GENERO",
    "PRODUCTOS_ACTIVOS",
    "PRODUCTOS_FALTANTES",
    "TIENE_CUENTA_N2",
    "TIENE_CUENTA_N4",
    "TIENE_AHORRO_PROGRAMADO",
    "TIENE_INVERSION_DIARIA",
    "TIENE_TARJETA_CREDITO",
    "SALDO_CUENTA_N2",
    "SALDO_CUENTA_N4",
    "SALDO_AHORRO_PROGRAMADO",
    "SALDO_INVERSION_DIARIA",
    "SALDO_TARJETA_CREDITO",
    "ESTATUS_CUENTA_BILLU",
    "TDC",
    "PRODUCTO_TDC",
    "ESTATUS_TDC",
    "TARJETA_FISICA",
    "TARJETA_DIGITAL",
    "ESTATUS_TARJETA",
    "TD_RECIENTE_FISICA",
    "TD_RECIENTE_DIGITAL",
    "DISENO_TARJETA",
    "FECHA_SOLICITUD_TARJETA",
    "FECHA_VENCIMIENTO_TARJETA",
    "FECHA_1ER_CARGO",
    "DIAS_1ER_CARGO",
    "MESES_1ER_CARGO",
    "SALDO_META_AHORRO",
    "FECHA_APERTURA_INVERSION",
    "CAMPANAS_ASIGNADAS",
    "CAMPANA_SUGERIDA"
  ];

  var state = {
    apiBaseUrl: loadApiBaseUrl(),
    dashboard: null,
    lastLookup: null,
    expandedSegmentId: "",
    draggedSegmentId: "",
    exports: []
  };

  var elements = {
    statusBanner: document.getElementById("statusBanner"),
    heroSummary: document.getElementById("heroSummary"),
    heroSource: document.getElementById("heroSource"),
    refreshSegmentsBtn: document.getElementById("refreshSegmentsBtn"),
    lookupForm: document.getElementById("lookupForm"),
    rewardsIdInput: document.getElementById("rewardsIdInput"),
    kpiGrid: document.getElementById("kpiGrid"),
    lookupPanel: document.getElementById("lookupPanel"),
    lookupSummary: document.getElementById("lookupSummary"),
    lookupResults: document.getElementById("lookupResults"),
    levelsSourceMeta: document.getElementById("levelsSourceMeta"),
    levelsBody: document.getElementById("levelsBody"),
    levelsTotal: document.getElementById("levelsTotal"),
    exportLog: document.getElementById("exportLog"),
    toast: document.getElementById("toast")
  };

  wireEvents();
  refreshDashboard();

  function wireEvents() {
    elements.refreshSegmentsBtn.addEventListener("click", function () {
      refreshDashboard(true);
    });

    elements.lookupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      lookupRewardsId();
    });

    elements.lookupResults.addEventListener("click", function (event) {
      var button = event.target.closest("[data-download-lookup]");
      if (button) {
        downloadLookupResult(button);
      }
    });

    elements.levelsBody.addEventListener("click", function (event) {
      var downloadButton = event.target.closest("[data-download-segment]");
      if (downloadButton) {
        downloadSegment(downloadButton.getAttribute("data-download-segment"), downloadButton);
        return;
      }

      var toggleButton = event.target.closest("[data-toggle-segment]");
      if (toggleButton) {
        toggleSegmentDetail(toggleButton.getAttribute("data-toggle-segment"));
      }
    });
  }

  function refreshDashboard(isManual) {
    setStatus("Segmentacion en actualizacion desde Clientes y Cuentas.", false);
    return apiGet("/internal/customer-categorization/dashboard").then(function (data) {
      state.dashboard = data;
      renderDashboard(data);
      setStatus("Segmentacion lista desde Clientes y Cuentas, disponible para consulta y descarga.", false);
      if (isManual) {
        showToast("Segmentos actualizados.");
      }
    }).catch(function (error) {
      setStatus(error.message || "No fue posible cargar la segmentacion.", true);
      renderEmptyDashboard();
      showToast(error.message || "No fue posible cargar la segmentacion.", true);
    });
  }

  function lookupRewardsId() {
    var rewardsId = String(elements.rewardsIdInput.value || "").trim();
    elements.lookupPanel.hidden = false;
    if (!rewardsId) {
      state.lastLookup = null;
      elements.lookupSummary.textContent = "Captura un ID RECOMPENSAS.";
      elements.lookupResults.innerHTML = "";
      showToast("Captura un ID RECOMPENSAS.", true);
      return;
    }

    elements.lookupSummary.textContent = "Consultando " + rewardsId + "...";
    elements.lookupResults.innerHTML = "";
    apiGet("/internal/customer-categorization/rewards/" + encodeURIComponent(rewardsId))
      .then(function (data) {
        renderLookup(data);
        showToast("Consulta lista para " + rewardsId + ".");
      }).catch(function (error) {
        state.lastLookup = null;
        elements.lookupSummary.textContent = error.message || "No fue posible consultar el ID RECOMPENSAS.";
        elements.lookupResults.innerHTML = "";
        showToast(elements.lookupSummary.textContent, true);
      });
  }

  function downloadSegment(segmentId, button) {
    if (!segmentId) {
      showToast("No hay nivel seleccionado para descargar.", true);
      return;
    }

    var originalText = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "Generando";
    }

    apiPost("/internal/customer-categorization/exports/cross-sell", {
      segmentId: segmentId
    }).then(function (data) {
      var segment = findSegment(segmentId);
      var fileName = data.fileName || buildFileName(segmentId);
      var csvContent = data.csvContent || buildFallbackCsv(data, segment);
      downloadText(fileName, csvContent);
      state.exports.unshift(data);
      state.exports = state.exports.slice(0, 3);
      renderExportLog();
      showToast("Base descargada: " + fileName + ".");
    }).catch(function (error) {
      showToast(error.message || "No fue posible descargar la base.", true);
    }).then(function () {
      if (button) {
        button.disabled = false;
        button.textContent = originalText || "Descargar";
      }
    });
  }

  function renderDashboard(data) {
    var segments = data.segmentSummary || [];
    var kpis = data.kpis || {};
    elements.heroSource.textContent = "Clientes + Cuentas";
    elements.heroSummary.textContent = buildLegacySummary(data, segments, kpis);
    elements.levelsSourceMeta.innerHTML = buildSourceMeta(data, kpis);

    renderKpis([
      kpi("Clientes", number(kpis.total_clients), "Registros clasificados"),
      kpi("Exploradores", number(kpis.explorers_clients), "Clientes nuevos o de bajo saldo / uso"),
      kpi("Constructores", number(kpis.constructors_clients), "Clientes con estabilidad y uso moderado"),
      kpi("Aliados Premium", number(kpis.premium_allies_clients), "Clientes de alto saldo y mayor fidelidad"),
      kpi("Promedio Abonos", decimal(kpis.average_abonos), "Abonos promedio por cliente activo"),
      kpi("Promedio Cargos", decimal(kpis.average_cargos), "Cargos promedio por cliente activo"),
      kpi("Oportunidad TC", number(kpis.credit_card_opportunity_clients), "Clientes sin tarjeta de credito"),
      kpi("Portafolio Completo", number(kpis.portfolio_complete_clients), "Clientes con los 5 productos objetivo")
    ]);
    renderSegments(segments);
  }

  function renderEmptyDashboard() {
    elements.heroSummary.textContent = "Sin datos cargados.";
    elements.kpiGrid.innerHTML = "";
    elements.levelsBody.innerHTML = "<tr><td colspan=\"5\">No hay niveles disponibles.</td></tr>";
    elements.levelsTotal.innerHTML = "";
  }

  function renderKpis(items) {
    elements.kpiGrid.innerHTML = items.map(function (item) {
      return "<article class=\"kpi-card\">"
        + "<div class=\"kpi-label\">" + escapeHtml(item.label) + "</div>"
        + "<div class=\"kpi-value\">" + escapeHtml(item.value) + "</div>"
        + "<div class=\"kpi-note\">" + escapeHtml(item.note) + "</div>"
        + "</article>";
    }).join("");
  }

  function renderSegments(rawSegments) {
    var segments = getOrderedSegments(rawSegments || []);
    if (!segments.length) {
      elements.levelsBody.innerHTML = "<tr><td colspan=\"5\">No hay niveles disponibles.</td></tr>";
      elements.levelsTotal.innerHTML = "";
      return;
    }

    elements.levelsBody.innerHTML = segments.map(function (segment) {
      var segmentId = segment.segmentId || "";
      var detailId = "segmentDetail_" + safeDomId(segmentId);
      var isOpen = state.expandedSegmentId === segmentId;
      return "<tr class=\"customer-categorization-main-row\" draggable=\"true\" data-segment-id=\""
        + escapeHtml(segmentId) + "\">"
        + "<td>"
        + "<div class=\"row-tools\">"
        + dragHandle(segment.segmentLabel || segmentId)
        + "<button class=\"download-button\" type=\"button\" data-download-segment=\""
        + escapeHtml(segmentId) + "\">Descargar</button>"
        + "</div>"
        + "</td>"
        + "<td>"
        + "<button class=\"segment-toggle\" type=\"button\" aria-expanded=\"" + (isOpen ? "true" : "false")
        + "\" aria-controls=\"" + escapeHtml(detailId) + "\" data-toggle-segment=\""
        + escapeHtml(segmentId) + "\">"
        + "<span class=\"segment-toggle-icon\">" + (isOpen ? "-" : "+") + "</span>"
        + "<span>" + escapeHtml(segment.segmentLabel || segmentId) + "</span>"
        + "</button>"
        + "</td>"
        + "<td>" + escapeHtml(legacyRule(segment)) + "</td>"
        + "<td>" + escapeHtml(number(segment.clients)) + "</td>"
        + "<td>" + escapeHtml(decimal(segment.sharePct)) + "%</td>"
        + "</tr>"
        + "<tr id=\"" + escapeHtml(detailId) + "\" class=\"segment-detail-row" + (isOpen ? " is-open" : "")
        + "\" aria-hidden=\"" + (isOpen ? "false" : "true") + "\">"
        + "<td colspan=\"5\">" + renderSegmentDetail(segment) + "</td>"
        + "</tr>";
    }).join("");

    var totals = segments.reduce(function (acc, segment) {
      acc.clients += Number(segment.clients || 0);
      acc.sharePct += Number(segment.sharePct || 0);
      return acc;
    }, { clients: 0, sharePct: 0 });

    elements.levelsTotal.innerHTML = "<tr class=\"table-total-row\">"
      + "<td colspan=\"3\">Total</td>"
      + "<td>" + escapeHtml(number(totals.clients)) + "</td>"
      + "<td>" + escapeHtml(decimal(totals.sharePct)) + "%</td>"
      + "</tr>";

    hydrateDragRows();
  }

  function renderSegmentDetail(segment) {
    var topStates = mapNamedCounts(segment.topStates, "stateName", "Estado", segment.clients);
    var productAdoption = mapNamedCounts(segment.productAdoption, "code", "Producto", segment.clients);
    var missingProducts = mapNamedCounts(segment.missingProducts, "code", "Producto", segment.clients);

    return "<div class=\"detail-shell\">"
      + "<div class=\"detail-grid\">"
      + "<article class=\"detail-card\">"
      + "<div class=\"detail-title\">Perfil ideal</div>"
      + "<div class=\"mini-stat-grid\">"
      + miniStat("Saldo promedio", money(segment.averageBalance))
      + miniStat("Transacciones", decimal(segment.averageTransactions))
      + miniStat("Antiguedad", number(segment.averageTenureDays) + " dias")
      + miniStat("Tarjeta", segment.recommendedCard || "-")
      + "</div>"
      + "</article>"
      + "<article class=\"detail-card\">"
      + "<div class=\"detail-title\">Geografia principal</div>"
      + "<div class=\"state-list\">" + renderStateItems(topStates) + "</div>"
      + "</article>"
      + "<article class=\"detail-card\">"
      + "<div class=\"detail-title\">Mix de productos y oportunidad</div>"
      + "<div class=\"detail-subtitle\">Productos activos</div>"
      + "<div class=\"progress-list\">" + renderProgressItems(productAdoption, false) + "</div>"
      + "<div class=\"detail-subtitle\">Oportunidad de venta cruzada</div>"
      + "<div class=\"opportunity-summary\">"
      + opportunityStat("Sin tarjeta de credito", number(segment.missingCreditCardClients))
      + opportunityStat("Portafolio completo", number(segment.portfolioCompleteClients))
      + "</div>"
      + "<div class=\"progress-list\">" + renderProgressItems(missingProducts, true) + "</div>"
      + "</article>"
      + "</div>"
      + "</div>";
  }

  function renderLookup(data) {
    var rows = data.rows || [];
    state.lastLookup = data;
    elements.lookupSummary.textContent = data.executiveSummary || "Consulta completada.";
    if (!rows.length) {
      elements.lookupResults.innerHTML = "<div class=\"empty-state\">Sin resultados para el ID RECOMPENSAS consultado.</div>";
      return;
    }

    var firstRow = rows[0] || {};
    var detailRows = buildLookupDetailRows(rows);
    var cards = [
      { label: "ID RECOMPENSAS", value: data.rewardsId || firstRow.idRecompensas || "" },
      { label: "Registros", value: number(data.totalMatches || rows.length) },
      { label: "Nivel", value: firstRow.nivelCliente || "N/D" },
      { label: "Tarjeta sugerida", value: firstRow.tarjetaSugerida || "N/D" },
      { label: "Saldo promedio 3 meses", value: money(firstRow.saldoPromedio3Meses) },
      { label: "Transacciones", value: number(firstRow.transaccionesTotales) }
    ];

    elements.lookupResults.innerHTML = "<div class=\"query-block\">"
      + "<div class=\"result-meta\">"
      + cards.map(function (item) {
        return "<div class=\"result-chip\">"
          + "<div class=\"result-chip-label\">" + escapeHtml(item.label) + "</div>"
          + "<div class=\"result-chip-value\">" + escapeHtml(item.value) + "</div>"
          + "</div>";
      }).join("")
      + "</div>"
      + "<div class=\"button-row\">"
      + "<button type=\"button\" class=\"download-button lookup-download-button\" data-download-lookup>"
      + "Descargar resultado consultado"
      + "</button>"
      + "</div>"
      + renderSimpleTable(detailRows)
      + "</div>";
  }

  function renderSimpleTable(rows) {
    if (!rows || !rows.length) {
      return "<div class=\"empty-state\">No hay detalle descargable para mostrar.</div>";
    }
    var headers = Object.keys(rows[0]);
    return "<div class=\"table-wrap lookup-table-wrap\">"
      + "<table class=\"state-table\"><thead><tr>"
      + headers.map(function (header) {
        return "<th>" + escapeHtml(prettifyCode(header)) + "</th>";
      }).join("")
      + "</tr></thead><tbody>"
      + rows.map(function (row) {
        return "<tr>" + headers.map(function (header) {
          return "<td>" + escapeHtml(formatLookupTableValue(header, row[header])) + "</td>";
        }).join("") + "</tr>";
      }).join("")
      + "</tbody></table></div>";
  }

  function downloadLookupResult(button) {
    var data = state.lastLookup;
    if (!data || !data.rows || !data.rows.length) {
      showToast("No hay resultado consultado para descargar.", true);
      return;
    }
    if (button) {
      button.disabled = true;
    }
    var fileName = data.fileName || ("id_recompensas_" + String(data.rewardsId || "consulta").toLowerCase() + ".csv");
    var csvContent = data.csvContent || toCsvFromObjects(buildLookupDetailRows(data.rows)) || "";
    downloadText(fileName, csvContent);
    showToast("Resultado descargado: " + fileName + ".");
    if (button) {
      button.disabled = false;
    }
  }

  function buildLookupDetailRows(rows) {
    return (rows || []).map(function (row) {
      return buildLookupDetailRow(row);
    });
  }

  function buildLookupDetailRow(row) {
    var detail = row.detalle || {};
    var fallback = {
      ID_RECOMPENSAS: row.idRecompensas || "",
      NIVEL_CLIENTE_ID: row.nivelClienteId || "",
      NIVEL_CLIENTE: row.nivelCliente || "",
      NIVEL_CLIENTE_REGLA: row.reglaNivel || "",
      TARJETA_RECOMENDADA: row.tarjetaSugerida || "",
      TARJETA_BENEFICIOS: row.beneficiosTarjeta || "",
      SALDO_PROMEDIO_HOY: row.saldoPromedioHoy || 0,
      SALDO_PROMEDIO_3_MESES: row.saldoPromedio3Meses || 0,
      TRANSACCIONES_TOTALES: row.transaccionesTotales || 0,
      ABONOS_30D: row.abonos30d || 0,
      CARGOS_30D: row.cargos30d || 0,
      PERFIL_TRANSACCIONAL: row.perfilTransaccional || "",
      ANTIGUEDAD_DIAS: row.antiguedadDias || 0,
      ESTADO: row.estado || "",
      GENERO: row.genero || "",
      PRODUCTOS_ACTIVOS: row.productosActivos || "",
      PRODUCTOS_FALTANTES: row.productosFaltantes || "",
      TIENE_CUENTA_N2: deriveProductFlag(row.productosActivos, "CUENTA_N2"),
      TIENE_CUENTA_N4: deriveProductFlag(row.productosActivos, "CUENTA_N4"),
      TIENE_AHORRO_PROGRAMADO: deriveProductFlag(row.productosActivos, "AHORRO_PROGRAMADO"),
      TIENE_INVERSION_DIARIA: deriveProductFlag(row.productosActivos, "INVERSION_DIARIA"),
      TIENE_TARJETA_CREDITO: deriveProductFlag(row.productosActivos, "TARJETA_CREDITO"),
      CAMPANA_SUGERIDA: row.campanaSugerida || ""
    };
    var value = {};
    LOOKUP_DETAIL_HEADERS.forEach(function (header) {
      value[header] = pickDetail(detail, header, Object.prototype.hasOwnProperty.call(fallback, header) ? fallback[header] : "");
    });
    Object.keys(detail).forEach(function (header) {
      if (!Object.prototype.hasOwnProperty.call(value, header) && header !== "REGLA_NIVEL") {
        value[header] = detail[header];
      }
    });
    return value;
  }

  function pickDetail(detail, key, fallback) {
    if (detail && Object.prototype.hasOwnProperty.call(detail, key)) {
      return detail[key];
    }
    return fallback;
  }

  function deriveProductFlag(productText, productCode) {
    var normalized = normalizeProductText(productText);
    if (!normalized) {
      return "NO";
    }
    if (productCode === "CUENTA_N4") {
      return normalized.indexOf("N4") !== -1 ? "SI" : "NO";
    }
    if (productCode === "CUENTA_N2") {
      return normalized.indexOf("N2") !== -1 ? "SI" : "NO";
    }
    if (productCode === "TARJETA_CREDITO") {
      return normalized.indexOf("TARJETA DE CREDITO") !== -1 || normalized.indexOf("TARJETA CREDITO") !== -1 ? "SI" : "NO";
    }
    if (productCode === "INVERSION_DIARIA") {
      return normalized.indexOf("INVERSION DIARIA") !== -1 ? "SI" : "NO";
    }
    if (productCode === "AHORRO_PROGRAMADO") {
      return normalized.indexOf("AHORRO PROGRAMADO") !== -1 ? "SI" : "NO";
    }
    return "NO";
  }

  function toCsvFromObjects(rows) {
    if (!rows || !rows.length) {
      return "";
    }
    var headers = Object.keys(rows[0]);
    return toCsv([headers].concat(rows.map(function (row) {
      return headers.map(function (header) {
        return row[header] == null ? "" : row[header];
      });
    })));
  }

  function renderExportLog() {
    if (!state.exports.length) {
      elements.exportLog.hidden = true;
      return;
    }
    elements.exportLog.hidden = false;
    elements.exportLog.innerHTML = state.exports.map(function (item) {
      return "<div><strong>" + escapeHtml(item.fileName || "-") + "</strong>"
        + " / " + escapeHtml(number(item.rowCount)) + " filas"
        + " / " + escapeHtml(item.summary || item.outcome || "") + "</div>";
    }).join("");
  }

  function hydrateDragRows() {
    Array.prototype.slice.call(
      elements.levelsBody.querySelectorAll(".customer-categorization-main-row")
    ).forEach(function (row) {
      row.addEventListener("dragstart", handleDragStart);
      row.addEventListener("dragend", handleDragEnd);
      row.addEventListener("dragover", handleDragOver);
      row.addEventListener("dragleave", handleDragLeave);
      row.addEventListener("drop", handleDrop);
    });
  }

  function handleDragStart(event) {
    if (!event.target || !event.target.closest(".drag-handle")) {
      event.preventDefault();
      return;
    }
    var row = event.currentTarget;
    state.draggedSegmentId = row.getAttribute("data-segment-id") || "";
    row.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", state.draggedSegmentId);
    }
  }

  function handleDragEnd() {
    state.draggedSegmentId = "";
    clearDropClasses();
  }

  function handleDragOver(event) {
    event.preventDefault();
    var targetRow = event.currentTarget;
    var draggedSegmentId = state.draggedSegmentId;
    if (!targetRow || !draggedSegmentId || targetRow.getAttribute("data-segment-id") === draggedSegmentId) {
      return;
    }
    var rect = targetRow.getBoundingClientRect();
    var before = event.clientY < rect.top + rect.height / 2;
    targetRow.classList.toggle("is-drop-before", before);
    targetRow.classList.toggle("is-drop-after", !before);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleDragLeave(event) {
    event.currentTarget.classList.remove("is-drop-before", "is-drop-after");
  }

  function handleDrop(event) {
    event.preventDefault();
    var targetRow = event.currentTarget;
    var draggedSegmentId = state.draggedSegmentId || (event.dataTransfer
      ? event.dataTransfer.getData("text/plain")
      : "");
    var targetSegmentId = targetRow ? targetRow.getAttribute("data-segment-id") : "";
    if (!draggedSegmentId || !targetSegmentId || draggedSegmentId === targetSegmentId) {
      return;
    }

    var rows = getOrderedSegments((state.dashboard && state.dashboard.segmentSummary) || []);
    var draggedIndex = findSegmentIndex(rows, draggedSegmentId);
    var targetIndex = findSegmentIndex(rows, targetSegmentId);
    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    var rect = targetRow.getBoundingClientRect();
    var insertBefore = event.clientY < rect.top + rect.height / 2;
    var nextRows = rows.slice();
    var moved = nextRows.splice(draggedIndex, 1)[0];
    var insertIndex = insertBefore
      ? (draggedIndex < targetIndex ? targetIndex - 1 : targetIndex)
      : (draggedIndex < targetIndex ? targetIndex : targetIndex + 1);
    nextRows.splice(Math.max(0, Math.min(nextRows.length, insertIndex)), 0, moved);
    saveOrder(nextRows.map(function (row) { return row.segmentId; }));
    clearDropClasses();
    renderSegments((state.dashboard && state.dashboard.segmentSummary) || []);
  }

  function getOrderedSegments(segments) {
    var rows = segments.slice();
    var order = loadOrder();
    if (!order.length) {
      return rows;
    }
    var orderMap = {};
    order.forEach(function (segmentId, index) {
      orderMap[String(segmentId || "")] = index;
    });
    return rows.sort(function (a, b) {
      var aId = String(a.segmentId || "");
      var bId = String(b.segmentId || "");
      var aIndex = Object.prototype.hasOwnProperty.call(orderMap, aId) ? orderMap[aId] : Number.MAX_SAFE_INTEGER;
      var bIndex = Object.prototype.hasOwnProperty.call(orderMap, bId) ? orderMap[bId] : Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return String(a.segmentLabel || aId).localeCompare(String(b.segmentLabel || bId));
    });
  }

  function loadOrder() {
    try {
      var raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveOrder(order) {
    try {
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order || []));
    } catch (error) {
      return;
    }
  }

  function clearDropClasses() {
    Array.prototype.slice.call(
      elements.levelsBody.querySelectorAll(".customer-categorization-main-row")
    ).forEach(function (row) {
      row.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    });
  }

  function toggleSegmentDetail(segmentId) {
    state.expandedSegmentId = state.expandedSegmentId === segmentId ? "" : segmentId;
    renderSegments((state.dashboard && state.dashboard.segmentSummary) || []);
  }

  function apiGet(path) {
    return window.BilluShell.getJson(state.apiBaseUrl, path);
  }

  function apiPost(path, payload) {
    return window.BilluShell.postJson(state.apiBaseUrl, path, payload);
  }

  function buildLegacySummary(data, segments, kpis) {
    var explorers = findSegment("Exploradores", segments);
    var constructors = findSegment("Constructores", segments);
    var premium = findSegment("Aliados_Premium", segments);
    var total = Number(kpis.total_clients || 0);
    var opportunity = Number(kpis.credit_card_opportunity_clients || 0);
    if (!total && data.executiveSummary) {
      return data.executiveSummary;
    }
    return "Se analizaron " + number(total)
      + " clientes activos a partir de la hoja Clientes y del historico de Cuentas. "
      + "La categorizacion ahora combina saldo promedio de 3 meses, transacciones y antiguedad. "
      + number(explorers.clients) + " clientes quedaron como Exploradores, "
      + number(constructors.clients) + " como Constructores y "
      + number(premium.clients) + " como Aliados Premium. "
      + number(opportunity) + " clientes siguen siendo oportunidad para tarjeta de credito y "
      + number(kpis.portfolio_complete_clients) + " ya tienen portafolio completo.";
  }

  function buildSourceMeta(data, kpis) {
    var total = Number(kpis.total_clients || 0);
    var generatedAt = data.generatedAt ? " / Corte: <strong>" + escapeHtml(formatDate(data.generatedAt)) + "</strong>" : "";
    return "Fuente: <strong>Clientes + Cuentas</strong> / <strong>DLK_CUSTOMER_SEGMENT_SNAPSHOT</strong>"
      + " / Filtro: <strong>A-ACTIVA</strong>"
      + " / Registros activos: <strong>" + escapeHtml(number(total)) + "</strong>"
      + generatedAt;
  }

  function findSegment(segmentId, rows) {
    var segments = rows || ((state.dashboard && state.dashboard.segmentSummary) || []);
    for (var index = 0; index < segments.length; index += 1) {
      if (segments[index].segmentId === segmentId) {
        return segments[index];
      }
    }
    return {};
  }

  function findSegmentIndex(rows, segmentId) {
    for (var index = 0; index < rows.length; index += 1) {
      if (rows[index].segmentId === segmentId) {
        return index;
      }
    }
    return -1;
  }

  function mapNamedCounts(items, key, fallbackLabel, total) {
    if (!items || !items.length) {
      return [];
    }
    return items.map(function (item) {
      var clients = Number(item.clients || 0);
      return {
        label: prettifyCode(item[key] || item.label || item.code || fallbackLabel),
        clients: clients,
        sharePct: total ? (clients * 100) / Number(total || 1) : Number(item.sharePct || 0)
      };
    });
  }

  function renderStateItems(items) {
    if (!items.length) {
      return "<div class=\"empty-state\">Sin estados dominantes.</div>";
    }
    return items.map(function (item) {
      return "<div class=\"state-item\">"
        + "<div><strong>" + escapeHtml(item.label) + "</strong>"
        + "<span class=\"progress-meta\">" + escapeHtml(number(item.clients)) + " clientes</span></div>"
        + "<span class=\"state-share\">" + escapeHtml(decimal(item.sharePct)) + "%</span>"
        + "</div>";
    }).join("");
  }

  function renderProgressItems(items, opportunity) {
    if (!items.length) {
      return "<div class=\"empty-state\">" + (opportunity
        ? "No hay faltantes relevantes en este segmento."
        : "Sin productos asociados.") + "</div>";
    }
    return items.map(function (item) {
      var width = Math.max(0, Math.min(100, Number(item.sharePct || 0)));
      return "<div class=\"progress-item\">"
        + "<div class=\"progress-head\"><strong>" + escapeHtml(item.label) + "</strong>"
        + "<span>" + escapeHtml(decimal(item.sharePct)) + "%</span></div>"
        + "<div class=\"progress-meta\">" + escapeHtml(number(item.clients)) + " clientes</div>"
        + "<div class=\"progress-bar\"><div class=\"progress-fill" + (opportunity ? " opportunity" : "")
        + "\" style=\"width:" + width + "%\"></div></div>"
        + "</div>";
    }).join("");
  }

  function miniStat(label, value) {
    return "<div class=\"mini-stat\"><span>" + escapeHtml(label) + "</span><strong>"
      + escapeHtml(value) + "</strong></div>";
  }

  function opportunityStat(label, value) {
    return "<div class=\"opportunity-stat\"><span>" + escapeHtml(label) + "</span><strong>"
      + escapeHtml(value) + "</strong></div>";
  }

  function dragHandle(label) {
    return "<span class=\"drag-handle\" role=\"button\" tabindex=\"0\" aria-label=\"Arrastrar "
      + escapeHtml(label) + "\">"
      + "<svg viewBox=\"0 0 20 20\" aria-hidden=\"true\">"
      + "<circle cx=\"6\" cy=\"5\" r=\"1.4\"></circle>"
      + "<circle cx=\"6\" cy=\"10\" r=\"1.4\"></circle>"
      + "<circle cx=\"6\" cy=\"15\" r=\"1.4\"></circle>"
      + "<circle cx=\"14\" cy=\"5\" r=\"1.4\"></circle>"
      + "<circle cx=\"14\" cy=\"10\" r=\"1.4\"></circle>"
      + "<circle cx=\"14\" cy=\"15\" r=\"1.4\"></circle>"
      + "</svg></span>";
  }

  function buildFallbackCsv(data, segment) {
    var rows = [
      [
        "TIPO_EXPORT",
        "SEGMENTO_ID",
        "NIVEL",
        "REGLA",
        "CLIENTES",
        "PORCENTAJE_UNIVERSO",
        "TARJETA_RECOMENDADA",
        "BENEFICIOS",
        "RESUMEN"
      ],
      [
        data.exportType || "CROSS_SELL_EXPORT",
        (segment && segment.segmentId) || data.segmentId || "",
        (segment && segment.segmentLabel) || data.segmentLabel || "",
        legacyRule(segment || {}),
        (segment && segment.clients) || data.rowCount || 0,
        (segment && segment.sharePct) || "",
        (segment && segment.recommendedCard) || "",
        (segment && segment.recommendedCardBenefits) || "",
        data.summary || ""
      ]
    ];
    return toCsv(rows);
  }

  function toCsv(rows) {
    return rows.map(function (row) {
      return row.map(csvValue).join(",");
    }).join("\r\n") + "\r\n";
  }

  function csvValue(value) {
    var text = value == null ? "" : String(value);
    var escaped = text.replace(/"/g, "\"\"");
    return "\"" + escaped + "\"";
  }

  function downloadText(fileName, content) {
    window.BilluShell.downloadText(fileName, content);
  }

  function buildFileName(segmentId) {
    return "venta_cruzada_" + String(segmentId || "segmento").toLowerCase() + ".csv";
  }

  function loadApiBaseUrl() {
    return window.BilluShell.apiBaseUrl("customer-categorization-api-base-url");
  }

  function setStatus(message, isError) {
    elements.statusBanner.textContent = message;
    elements.statusBanner.className = "status-banner" + (isError ? " error" : "");
  }

  function showToast(message, isError) {
    window.BilluShell.showToast(message, isError, elements.toast);
  }

  function kpi(label, value, note) {
    return { label: label, value: value, note: note };
  }

  function legacyRule(segment) {
    return LEGACY_LEVEL_RULES[segment.segmentId] || segment.rule || "-";
  }

  function number(value) {
    return Number(value || 0).toLocaleString("es-MX", {
      maximumFractionDigits: 0
    });
  }

  function decimal(value) {
    return Number(value || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  function money(value) {
    return Number(value || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2
    });
  }

  function prettifyCode(value) {
    return String(value || "-").replace(/_/g, " ");
  }

  function formatLookupTableValue(header, value) {
    var normalized = String(header || "").toUpperCase();
    if (normalized.indexOf("SALDO") !== -1) {
      return money(value);
    }
    if (normalized.indexOf("TRANSACCIONES") !== -1 || normalized.indexOf("ANTIGUEDAD") !== -1) {
      return number(value);
    }
    return value == null || value === "" ? "-" : value;
  }

  function normalizeProductText(value) {
    return String(value || "")
      .normalize ? String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
      : String(value || "").toUpperCase();
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString("es-MX");
    } catch (error) {
      return String(value || "-");
    }
  }

  function safeDomId(value) {
    return String(value || "").replace(/[^A-Za-z0-9_-]/g, "_");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}());
