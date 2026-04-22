(function () {
  var DEFAULT_BASE_URL = window.location.origin;
  var state = {
    apiBaseUrl: loadApiBaseUrl(),
    exports: []
  };

  var elements = {
    apiBaseUrl: document.getElementById("apiBaseUrl"),
    saveConfigBtn: document.getElementById("saveConfigBtn"),
    refreshAllBtn: document.getElementById("refreshAllBtn"),
    connectionBadge: document.getElementById("connectionBadge"),
    overviewMeta: document.getElementById("overviewMeta"),
    overviewKpis: document.getElementById("overviewKpis"),
    overviewSummary: document.getElementById("overviewSummary"),
    overviewSourceMode: document.getElementById("overviewSourceMode"),
    productSummaryList: document.getElementById("productSummaryList"),
    historicalFilters: document.getElementById("historicalFilters"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    historicalMeta: document.getElementById("historicalMeta"),
    historicalTrend: document.getElementById("historicalTrend"),
    historicalMonthlySummary: document.getElementById("historicalMonthlySummary"),
    first30Meta: document.getElementById("first30Meta"),
    first30Totals: document.getElementById("first30Totals"),
    first30MonthlySummary: document.getElementById("first30MonthlySummary"),
    coverageMeta: document.getElementById("coverageMeta"),
    coverageSummary: document.getElementById("coverageSummary"),
    coverageSegments: document.getElementById("coverageSegments"),
    exportYear: document.getElementById("exportYear"),
    exportMonth: document.getElementById("exportMonth"),
    exportLog: document.getElementById("exportLog"),
    toast: document.getElementById("toast")
  };

  wireEvents();
  boot();

  function boot() {
    elements.apiBaseUrl.value = state.apiBaseUrl;
    refreshAll();
  }

  function wireEvents() {
    elements.saveConfigBtn.addEventListener("click", function () {
      state.apiBaseUrl = normalizeBaseUrl(elements.apiBaseUrl.value);
      window.localStorage.setItem("customer-summary-api-base-url", state.apiBaseUrl);
      showToast("Configuracion guardada.");
      refreshAll();
    });

    elements.refreshAllBtn.addEventListener("click", function () {
      refreshAll();
    });

    elements.historicalFilters.addEventListener("submit", function (event) {
      event.preventDefault();
      refreshHistorical();
    });

    document.querySelectorAll("[data-export]").forEach(function (button) {
      button.addEventListener("click", function () {
        var exportType = button.getAttribute("data-export");
        triggerExport(exportType);
      });
    });
  }

  function refreshAll() {
    setConnection("neutral", "Cargando");
    Promise.all([
      refreshOverview(),
      refreshHistorical(),
      refreshFirst30(),
      refreshCoverage()
    ]).then(function () {
      setConnection("ok", "Backend conectado");
      showToast("Vista actualizada.");
    }).catch(function (error) {
      setConnection("error", "Backend no disponible");
      showToast(error.message || "No fue posible cargar el dashboard.", true);
    });
  }

  function refreshOverview() {
    return apiGet("/internal/customer-summary/overview").then(function (data) {
      elements.overviewMeta.textContent = buildMeta(data.environment, data.correlationId);
      elements.overviewSummary.textContent = data.executiveSummary || "Sin resumen disponible.";
      elements.overviewSourceMode.textContent = data.sourceMode || "UNKNOWN";
      renderKpis(elements.overviewKpis, [
        metric("Total cuentas", number(data.kpis && data.kpis.total_accounts)),
        metric("Saldo total", money(data.kpis && data.kpis.total_balance)),
        metric("Activas", number(data.kpis && data.kpis.active_accounts)),
        metric("Inactivas", number(data.kpis && data.kpis.inactive_accounts))
      ]);
      renderProducts(data.productSummary || []);
    });
  }

  function refreshHistorical() {
    var query = "?startDate=" + encodeURIComponent(elements.startDate.value || "")
      + "&endDate=" + encodeURIComponent(elements.endDate.value || "");
    return apiGet("/internal/customer-summary/historical" + query).then(function (data) {
      elements.historicalMeta.textContent = buildMeta(data.environment, data.correlationId);
      renderStats(elements.historicalTrend, [
        metric("Total aperturas", number(data.trend && data.trend.totalAccounts)),
        metric("Promedio diario", decimal(data.trend && data.trend.averagePerDay)),
        metric("Pico", String(data.trend && data.trend.peak || "-"))
      ]);
      renderKeyValueTable(elements.historicalMonthlySummary, data.monthlySummary || {});
    });
  }

  function refreshFirst30() {
    return apiGet("/internal/customer-summary/first30").then(function (data) {
      elements.first30Meta.textContent = "Corte " + String(data.referenceDate || "-");
      renderStats(elements.first30Totals, [
        metric("Aperturas", number(data.totalSummary && data.totalSummary.openingAccounts)),
        metric("Calificadas", number(data.totalSummary && data.totalSummary.qualifiedAccounts)),
        metric("Transaccionales", number(data.totalSummary && data.totalSummary.transactionalAccounts))
      ]);
      renderTable(
        elements.first30MonthlySummary,
        ["Anio", "Mes", "Aperturas", "Calificadas", "Transaccionales"],
        (data.monthlySummary || []).map(function (item) {
          return [
            number(item.year),
            number(item.month),
            number(item.openingAccounts),
            number(item.qualifiedAccounts),
            number(item.transactionalAccounts)
          ];
        })
      );
    });
  }

  function refreshCoverage() {
    return apiGet("/internal/customer-summary/cards/coverage").then(function (data) {
      elements.coverageMeta.textContent = buildMeta(data.environment, data.correlationId);
      renderKpis(elements.coverageSummary, [
        metric("Con plastico", number(data.summary && data.summary.coveredAccounts)),
        metric("Sin plastico", number(data.summary && data.summary.uncoveredAccounts)),
        metric("Transaccionales", number(data.summary && data.summary.transactionalAccounts)),
        metric("Transaccionales cubiertos",
          number(data.summary && data.summary.coveredTransactionalAccounts))
      ]);
      renderSegments(data.summary && data.summary.segments || []);
    });
  }

  function triggerExport(exportType) {
    var payload = {
      selectedYear: Number(elements.exportYear.value || 0),
      selectedMonth: Number(elements.exportMonth.value || 0)
    };
    var path = "/internal/customer-summary/exports/";
    if (exportType === "historical") {
      path += "historical-month";
    } else if (exportType === "first30") {
      path += "first30-month";
    } else {
      path += "card-coverage";
      payload = undefined;
    }
    apiPost(path, payload).then(function (data) {
      state.exports.unshift(data);
      state.exports = state.exports.slice(0, 6);
      renderExportLog();
      showToast("Exporte generado: " + (data.fileName || data.exportType));
    }).catch(function (error) {
      showToast(error.message || "No fue posible generar el exporte.", true);
    });
  }

  function renderKpis(node, items) {
    node.innerHTML = items.map(function (item) {
      return "<article class=\"kpi-card\">"
        + "<div class=\"kpi-label\">" + escapeHtml(item.label) + "</div>"
        + "<div class=\"kpi-value\">" + escapeHtml(item.value) + "</div>"
        + "</article>";
    }).join("");
  }

  function renderStats(node, items) {
    node.innerHTML = items.map(function (item) {
      return "<article class=\"stat-card\">"
        + "<div class=\"stat-label\">" + escapeHtml(item.label) + "</div>"
        + "<div class=\"stat-value\">" + escapeHtml(item.value) + "</div>"
        + "</article>";
    }).join("");
  }

  function renderProducts(items) {
    if (!items.length) {
      elements.productSummaryList.innerHTML = emptyState("No hay productos para mostrar.");
      return;
    }
    elements.productSummaryList.innerHTML = items.map(function (item) {
      return "<div class=\"product-row\">"
        + "<div class=\"product-head\">"
        + "<strong>" + escapeHtml(item.productLabel || item.productKey || "-") + "</strong>"
        + "<span class=\"chip\">" + escapeHtml(number(item.accounts)) + " cuentas</span>"
        + "</div>"
        + "<div class=\"metric-line\">"
        + "<span>Participacion " + escapeHtml(decimal(item.sharePct)) + "%</span>"
        + "<span>Saldo " + escapeHtml(money(item.totalBalance)) + "</span>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function renderSegments(items) {
    if (!items.length) {
      elements.coverageSegments.innerHTML = emptyState("No hay segmentos de cobertura.");
      return;
    }
    elements.coverageSegments.innerHTML = items.map(function (item) {
      return "<div class=\"segment-row\">"
        + "<div class=\"segment-head\">"
        + "<strong>" + escapeHtml(item.segment || "-") + "</strong>"
        + "<span class=\"chip\">" + escapeHtml(decimal(item.sharePct)) + "%</span>"
        + "</div>"
        + "<div class=\"metric-line\">"
        + "<span>" + escapeHtml(number(item.accounts)) + " cuentas</span>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function renderKeyValueTable(node, data) {
    var entries = Object.keys(data).map(function (key) {
      return [key, data[key]];
    });
    renderTable(node, ["Campo", "Valor"], entries.map(function (entry) {
      return [entry[0], String(entry[1])];
    }));
  }

  function renderTable(node, headers, rows) {
    if (!rows.length) {
      node.innerHTML = emptyState("No hay datos disponibles.");
      return;
    }
    node.innerHTML = "<div class=\"table-card\"><table><thead><tr>"
      + headers.map(function (header) { return "<th>" + escapeHtml(header) + "</th>"; }).join("")
      + "</tr></thead><tbody>"
      + rows.map(function (row) {
        return "<tr>" + row.map(function (cell) {
          return "<td>" + escapeHtml(String(cell == null ? "-" : cell)) + "</td>";
        }).join("") + "</tr>";
      }).join("")
      + "</tbody></table></div>";
  }

  function renderExportLog() {
    if (!state.exports.length) {
      elements.exportLog.innerHTML = emptyState("Todavia no se han lanzado exportes desde esta vista.");
      return;
    }
    elements.exportLog.innerHTML = state.exports.map(function (item) {
      return "<div class=\"export-row\">"
        + "<div class=\"export-row-head\">"
        + "<strong>" + escapeHtml(item.exportType || "-") + "</strong>"
        + "<span class=\"chip\">" + escapeHtml(item.outcome || "-") + "</span>"
        + "</div>"
        + "<div class=\"micro\">" + escapeHtml(item.fileName || "-") + "</div>"
        + "<div class=\"metric-line\">"
        + "<span>Filas " + escapeHtml(number(item.rowCount)) + "</span>"
        + "<span>Corr " + escapeHtml(item.correlationId || "-") + "</span>"
        + "</div>"
        + "</div>";
    }).join("");
  }

  function apiGet(path) {
    return fetch(state.apiBaseUrl + path, {
      headers: { "Accept": "application/json" }
    }).then(parseResponse);
  }

  function apiPost(path, payload) {
    return fetch(state.apiBaseUrl + path, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: payload ? JSON.stringify(payload) : null
    }).then(parseResponse);
  }

  function parseResponse(response) {
    return response.text().then(function (text) {
      var data = text ? safeJson(text) : {};
      if (!response.ok) {
        throw new Error(typeof data === "string" ? data : (data && data.message) || response.statusText);
      }
      return data;
    });
  }

  function safeJson(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }
  }

  function setConnection(kind, label) {
    elements.connectionBadge.className = "status-pill " + (kind === "neutral" ? "neutral" : kind);
    elements.connectionBadge.textContent = label;
  }

  function showToast(message, isError) {
    elements.toast.hidden = false;
    elements.toast.className = "toast" + (isError ? " error" : "");
    elements.toast.textContent = message;
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function () {
      elements.toast.hidden = true;
    }, 2600);
  }

  function loadApiBaseUrl() {
    return normalizeBaseUrl(window.localStorage.getItem("customer-summary-api-base-url") || DEFAULT_BASE_URL);
  }

  function normalizeBaseUrl(value) {
    var normalized = String(value || DEFAULT_BASE_URL).trim();
    return normalized.replace(/\/+$/, "");
  }

  function buildMeta(environment, correlationId) {
    return String(environment || "-") + " | " + String(correlationId || "-");
  }

  function metric(label, value) {
    return { label: label, value: value };
  }

  function number(value) {
    return Number(value || 0).toLocaleString("es-MX");
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

  function emptyState(message) {
    return "<div class=\"empty-state\">" + escapeHtml(message) + "</div>";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}());
