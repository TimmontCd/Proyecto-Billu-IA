var AuditLogger = (function () {
  function log(entity, entityId, action, payload, userEmail) {
    try {
      var repository = new BaseRepository(APP_CONSTANTS.SHEETS.AUDIT_LOG);
      repository.insert({
        id: Utils.generateId('AUD'),
        entidad: entity,
        entidadId: entityId,
        accion: action,
        payloadJson: Utils.stringifyJson(payload || {}),
        usuario: userEmail || AuthService.getCurrentEmail(),
        createdAt: Utils.formatDate(new Date()),
        updatedAt: Utils.formatDate(new Date()),
        createdBy: userEmail || AuthService.getCurrentEmail(),
        status: APP_CONSTANTS.STATUS.ACTIVE
      });
    } catch (error) {
      Logger.log('Audit log failed: ' + error.message);
    }
  }

  return {
    log: log
  };
})();
