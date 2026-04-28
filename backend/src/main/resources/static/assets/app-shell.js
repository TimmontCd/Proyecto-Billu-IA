(function () {
  var DEFAULT_BASE_URL = window.location.protocol === "file:"
    ? "http://localhost:8080"
    : window.location.origin;

  var MODULES = [
    module("realtime", "Venta en tiempo real", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("conversion-agent", "Agente de Conversion", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("whatsapp-agent", "Agente de Whatsapp", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("funnel", "Agente de Campanas", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("accounts", "Resumen de Productos", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("customer-categorization", "Categorizacion de clientes", "Segmentacion automatica de clientes a partir de sus saldos y atributos operativos."),
    module("projects", "Proyectos", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("heatmaps", "Mapas de calor", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("audio", "Seguimiento de Actividades", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("tincho", "Pregunta a BeBot", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia."),
    module("admin", "Administracion", "Endpoint reservado. Este modulo esta mapeado, sin funcionalidad activa todavia.")
  ];

  window.BilluShell = {
    modules: MODULES.slice(),
    findModule: findModule,
    apiBaseUrl: apiBaseUrl,
    getJson: getJson,
    postJson: postJson,
    downloadText: downloadText,
    showToast: showToast
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    var activeModuleId = getActiveModuleId();
    renderSidebar(activeModuleId);
    renderPlaceholder(activeModuleId);
    updateDocumentTitle(activeModuleId);
  }

  function module(id, title, description) {
    return {
      id: id,
      title: title,
      description: description,
      route: "/" + id + "/"
    };
  }

  function getActiveModuleId() {
    var explicitModule = document.body
      ? document.body.getAttribute("data-module")
      : "";
    if (explicitModule) {
      return explicitModule;
    }
    var parts = window.location.pathname.split("/");
    for (var index = parts.length - 1; index >= 0; index -= 1) {
      if (parts[index]) {
        return parts[index];
      }
    }
    return MODULES[0].id;
  }

  function renderSidebar(activeModuleId) {
    var target = document.querySelector("[data-billu-sidebar]");
    if (!target) {
      return;
    }
    target.className = "sidebar";
    target.setAttribute("aria-label", "Navegacion principal");
    target.innerHTML = "<div>"
      + "<div class=\"brand\">IA Billu</div>"
      + "<div class=\"brand-sub\">Hecho por los Billuvers</div>"
      + "</div>"
      + "<nav class=\"menu\">"
      + MODULES.map(function (item) {
        var active = item.id === activeModuleId;
        return "<a class=\"menu-item" + (active ? " active" : "") + "\" href=\""
          + escapeHtml(active ? "./" : "../" + item.id + "/") + "\""
          + (active ? " aria-current=\"page\"" : "") + ">"
          + escapeHtml(item.title)
          + "</a>";
      }).join("")
      + "</nav>";
  }

  function renderPlaceholder(activeModuleId) {
    var target = document.querySelector("[data-billu-placeholder]");
    if (!target) {
      return;
    }
    var item = findModule(activeModuleId) || module(activeModuleId, activeModuleId, "Endpoint reservado.");
    target.innerHTML = "<section class=\"placeholder-panel\">"
      + "<h1>" + escapeHtml(item.title) + "</h1>"
      + "<p>" + escapeHtml(item.description) + "</p>"
      + "<code>" + escapeHtml(item.route) + "</code>"
      + "</section>";
  }

  function updateDocumentTitle(activeModuleId) {
    var item = findModule(activeModuleId);
    if (item) {
      document.title = "Billu | " + item.title;
    }
  }

  function findModule(moduleId) {
    for (var index = 0; index < MODULES.length; index += 1) {
      if (MODULES[index].id === moduleId) {
        return MODULES[index];
      }
    }
    return null;
  }

  function apiBaseUrl(storageKey) {
    var storedValue = "";
    try {
      storedValue = window.localStorage.getItem(storageKey || "") || "";
    } catch (error) {
      storedValue = "";
    }
    return normalizeBaseUrl(storedValue || DEFAULT_BASE_URL);
  }

  function getJson(baseUrl, path) {
    return fetch(normalizeBaseUrl(baseUrl) + path, {
      headers: { Accept: "application/json" }
    }).then(parseResponse);
  }

  function postJson(baseUrl, path, payload) {
    return fetch(normalizeBaseUrl(baseUrl) + path, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {})
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

  function normalizeBaseUrl(value) {
    return String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  }

  function downloadText(fileName, content, type) {
    var blob = new Blob([content || ""], { type: type || "text/csv;charset=utf-8" });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, fileName);
      return;
    }
    var url = window.URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  function showToast(message, isError, target) {
    var toast = target || document.getElementById("toast") || createToast();
    toast.hidden = false;
    toast.className = "toast" + (isError ? " error" : "");
    toast.textContent = message;
    window.clearTimeout(toast._billuTimer);
    toast._billuTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 2800);
  }

  function createToast() {
    var toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.hidden = true;
    document.body.appendChild(toast);
    return toast;
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
