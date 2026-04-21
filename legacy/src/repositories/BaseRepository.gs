var BaseRepository = (function () {
  function BaseRepository(sheetName, spreadsheetId) {
    this.sheetName = sheetName;
    this.spreadsheetId = spreadsheetId || AppConfig.getSpreadsheetId();
    this.headers = AppSchema.getHeaders(sheetName);
    var spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
    this.sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    if (this.sheet.getLastRow() === 0) {
      this.sheet.getRange(1, 1, 1, this.headers.length).setValues([this.headers]);
      this.sheet.setFrozenRows(1);
    } else {
      var currentHeaders = this.sheet.getRange(1, 1, 1, Math.max(this.sheet.getLastColumn(), this.headers.length)).getValues()[0];
      this.headers.forEach(function (header, index) {
        if (currentHeaders[index] !== header) {
          this.sheet.getRange(1, index + 1).setValue(header);
        }
      }, this);
      this.sheet.setFrozenRows(1);
    }
  }

  BaseRepository.prototype.getAll = function () {
    var lastRow = this.sheet.getLastRow();
    if (lastRow < 2) return [];
    var values = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
    return values.map(function (row) {
      return Utils.toObject(this.headers, row);
    }, this).filter(function (item) {
      return item.id;
    });
  };

  BaseRepository.prototype.findById = function (id) {
    return this.getAll().filter(function (item) { return item.id === id; })[0] || null;
  };

  BaseRepository.prototype.query = function (criteria) {
    var keys = Object.keys(criteria || {});
    return this.getAll().filter(function (item) {
      return keys.every(function (key) {
        if (criteria[key] === undefined || criteria[key] === null || criteria[key] === '') return true;
        return String(item[key]) === String(criteria[key]);
      });
    });
  };

  BaseRepository.prototype.insert = function (record) {
    var payload = this.normalizeRecord_(record);
    this.sheet.appendRow(this.headers.map(function (header) { return payload[header]; }));
    return payload;
  };

  BaseRepository.prototype.bulkInsert = function (records) {
    if (!records || !records.length) return [];
    var rows = records.map(function (record) {
      var normalized = this.normalizeRecord_(record);
      return this.headers.map(function (header) { return normalized[header]; });
    }, this);
    this.sheet.getRange(this.sheet.getLastRow() + 1, 1, rows.length, this.headers.length).setValues(rows);
    return records;
  };

  BaseRepository.prototype.update = function (id, patch) {
    var lastRow = this.sheet.getLastRow();
    if (lastRow < 2) throw new Error('No records found for update');
    var ids = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function (row) { return row[0]; });
    var rowIndex = ids.indexOf(id);
    if (rowIndex === -1) throw new Error('Record not found: ' + id);

    var current = this.findById(id);
    var updated = this.normalizeRecord_(Object.assign({}, current, patch, { id: id, updatedAt: Utils.formatDate(new Date()) }));
    this.sheet.getRange(rowIndex + 2, 1, 1, this.headers.length).setValues([this.headers.map(function (header) { return updated[header]; })]);
    return updated;
  };

  BaseRepository.prototype.upsert = function (record) {
    if (record.id && this.findById(record.id)) {
      return this.update(record.id, record);
    }
    return this.insert(record);
  };

  BaseRepository.prototype.normalizeRecord_ = function (record) {
    var clone = Object.assign({}, record);
    clone.id = clone.id || Utils.generateId(this.sheetName.toUpperCase().slice(0, 3));
    clone.createdAt = clone.createdAt || Utils.formatDate(new Date());
    clone.updatedAt = Utils.formatDate(new Date());
    clone.createdBy = clone.createdBy || AuthService.getCurrentEmail() || 'system';
    clone.status = clone.status || APP_CONSTANTS.STATUS.ACTIVE;
    return this.headers.reduce(function (acc, header) {
      acc[header] = Utils.safeValue(clone[header]);
      return acc;
    }, {});
  };

  return BaseRepository;
})();
