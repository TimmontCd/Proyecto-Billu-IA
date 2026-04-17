var Utils = (function () {
  function now() {
    return new Date();
  }

  function formatDate(date, pattern) {
    var safeDate = date instanceof Date ? date : new Date(date);
    return Utilities.formatDate(safeDate, Session.getScriptTimeZone() || APP_CONSTANTS.DEFAULT_TIMEZONE, pattern || APP_CONSTANTS.DATETIME_FORMAT);
  }

  function generateId(prefix) {
    return [prefix || 'ID', Utilities.getUuid().replace(/-/g, '').slice(0, 12), new Date().getTime()].join('_');
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === '') return [];
    return [value];
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function stringifyJson(value) {
    return JSON.stringify(value || {});
  }

  function safeValue(value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return formatDate(value);
    if (typeof value === 'object') return stringifyJson(value);
    return value;
  }

  function toObject(headers, row) {
    return headers.reduce(function (acc, header, index) {
      acc[header] = row[index];
      return acc;
    }, {});
  }

  function hash(value) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value));
    return bytes.map(function (byte) {
      var normalized = (byte < 0 ? byte + 256 : byte).toString(16);
      return normalized.length === 1 ? '0' + normalized : normalized;
    }).join('');
  }

  function requireFields(payload, fields) {
    fields.forEach(function (field) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
        throw new Error('Missing required field: ' + field);
      }
    });
  }

  function computeTrafficLight(project) {
    var progress = Number(project.avancePct || 0);
    var risk = String(project.riesgo || '').toUpperCase();
    var dueDate = project.fechaCompromiso ? new Date(project.fechaCompromiso) : null;
    var today = new Date();
    if (risk === APP_CONSTANTS.RISK.HIGH || project.estatus === APP_CONSTANTS.PROJECT_STATUS.BLOCKED) return 'RED';
    if (dueDate && dueDate < today && progress < 100) return 'RED';
    if (risk === APP_CONSTANTS.RISK.MEDIUM || progress < 50) return 'YELLOW';
    return 'GREEN';
  }

  function groupBy(list, key) {
    return (list || []).reduce(function (acc, item) {
      var groupKey = typeof key === 'function' ? key(item) : item[key];
      groupKey = groupKey || 'UNKNOWN';
      acc[groupKey] = acc[groupKey] || [];
      acc[groupKey].push(item);
      return acc;
    }, {});
  }

  function sum(list, key) {
    return (list || []).reduce(function (total, item) {
      return total + Number(typeof key === 'function' ? key(item) : item[key] || 0);
    }, 0);
  }

  function average(list, key) {
    if (!list || !list.length) return 0;
    return sum(list, key) / list.length;
  }

  function startOfDay(date) {
    var result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  return {
    now: now,
    formatDate: formatDate,
    generateId: generateId,
    deepClone: deepClone,
    ensureArray: ensureArray,
    normalizeEmail: normalizeEmail,
    parseJson: parseJson,
    stringifyJson: stringifyJson,
    safeValue: safeValue,
    toObject: toObject,
    hash: hash,
    requireFields: requireFields,
    computeTrafficLight: computeTrafficLight,
    groupBy: groupBy,
    sum: sum,
    average: average,
    startOfDay: startOfDay
  };
})();
