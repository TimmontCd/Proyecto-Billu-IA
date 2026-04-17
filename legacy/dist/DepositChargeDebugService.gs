var DepositChargeDebugService = (function () {
  function inspectSheets() {
    var spreadsheet = SpreadsheetApp.openById(AppConfig.getSpreadsheetId());
    var names = spreadsheet.getSheets().map(function (sheet) {
      return sheet.getName();
    });

    function inspect(name) {
      var sheet = spreadsheet.getSheetByName(name);
      return {
        name: name,
        exists: !!sheet,
        rows: sheet ? sheet.getLastRow() : 0,
        columns: sheet ? sheet.getLastColumn() : 0
      };
    }

    return {
      spreadsheetId: spreadsheet.getId(),
      spreadsheetName: spreadsheet.getName(),
      sheets: names,
      expected: [
        inspect('Clientes'),
        inspect('Transacciones de febrero'),
        inspect('CorrelacionesKpiEjecutivo'),
        inspect('CorrelacionesResumenClientes'),
        inspect('CorrelacionesAperturaFirst30'),
        inspect(APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_MANUAL_RAW),
        inspect(APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_RAW),
        inspect(APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_SUMMARY),
        inspect(APP_CONSTANTS.SHEETS.DEPOSIT_CHARGE_KPI),
        inspect('DepositosCargosClientMonth'),
        inspect('DepositosCargosClientProfile'),
        inspect('DepositosCargosResultados'),
        inspect('DepositosCargosClientes')
      ]
    };
  }

  return {
    inspectSheets: inspectSheets
  };
})();
