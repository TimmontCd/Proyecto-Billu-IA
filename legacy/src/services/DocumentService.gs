var DocumentService = (function () {
  function createMinuteDoc(payload, userContext) {
    var templateId = AppConfig.get('DOC_TEMPLATE_MINUTE_ID', '');
    var file = templateId
      ? DriveApp.getFileById(templateId).makeCopy('MIN_' + payload.nombreReunion + '_' + Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT), DriveService.getFolderByKey('MINUTES'))
      : DocumentApp.create('MIN_' + payload.nombreReunion);
    if (!templateId) {
      DriveService.moveFileToFolder(file.getId(), 'MINUTES');
    }

    var document = DocumentApp.openById(file.getId());
    var taskLines = (payload.tareas || []).map(function (task) {
      return '- ' + task.descripcion + ' | Responsable: ' + (task.responsable || 'Pendiente') + ' | Fecha: ' + (task.fechaCompromiso || 'Pendiente');
    }).join('\n');

    replaceInDocument_(document, {
      '{{NOMBRE_DE_LA_REUNION}}': payload.nombreReunion || '',
      '{{FECHA}}': payload.fechaReunion || Utils.formatDate(new Date(), APP_CONSTANTS.DATE_FORMAT),
      '{{PARTICIPANTES}}': (payload.participantes || []).join(', '),
      '{{RESUMEN}}': payload.resumen || '',
      '{{ACUERDOS}}': (payload.acuerdos || []).join('\n'),
      '{{TAREAS}}': taskLines || 'Sin tareas detectadas.',
      '{{RIESGOS_O_TEMAS_PENDIENTES}}': (payload.riesgos || []).join('\n')
    });
    document.saveAndClose();
    return {
      id: file.getId(),
      url: file.getUrl(),
      exportUrl: DriveService.getDownloadUrlAsDocx(file.getId()),
      name: file.getName()
    };
  }

  function replaceInDocument_(document, replacements) {
    var body = document.getBody();
    Object.keys(replacements).forEach(function (token) {
      body.replaceText(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replacements[token] || '');
    });
  }

  return {
    createMinuteDoc: createMinuteDoc
  };
})();
