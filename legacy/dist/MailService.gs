var MailService = (function () {
  function getProvider_() {
    return String(AppConfig.getMailProvider() || 'GMAIL').trim().toUpperCase();
  }

  function buildSender_() {
    return {
      email: String(AppConfig.getBrevoSenderEmail() || '').trim(),
      name: String(AppConfig.getBrevoSenderName() || APP_CONSTANTS.APP_NAME).trim() || APP_CONSTANTS.APP_NAME
    };
  }

  function buildReplyTo_(options) {
    var explicit = options && options.replyTo ? String(options.replyTo).trim() : '';
    var configuredEmail = String(AppConfig.getBrevoReplyToEmail() || '').trim();
    var email = explicit || configuredEmail;
    if (!email) return null;
    return {
      email: email,
      name: String(AppConfig.getBrevoReplyToName() || buildSender_().name).trim() || buildSender_().name
    };
  }

  function sendViaBrevo_(to, subject, body, options) {
    var apiKey = String(AppConfig.getBrevoApiKey() || '').trim();
    var sender = buildSender_();
    if (!apiKey) throw new Error('Brevo no está configurado: falta BREVO_API_KEY.');
    if (!sender.email) throw new Error('Brevo no está configurado: falta BREVO_SENDER_EMAIL.');

    var payload = {
      sender: sender,
      to: [{ email: String(to).trim() }],
      subject: String(subject || '').trim(),
      textContent: String(body || '').trim() || 'Mensaje Billú',
      htmlContent: options && options.htmlBody
        ? options.htmlBody
        : ('<html><body style="font-family:Arial,sans-serif;"><pre style="white-space:pre-wrap;">' + String(body || '') + '</pre></body></html>')
    };

    var replyTo = buildReplyTo_(options);
    if (replyTo) payload.replyTo = replyTo;

    var response = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'api-key': apiKey,
        accept: 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var status = response.getResponseCode();
    var text = response.getContentText() || '';
    if (status < 200 || status >= 300) {
      throw new Error('Brevo devolvió ' + status + ': ' + text);
    }
    return text;
  }

  function sendEmail(to, subject, body, options) {
    if (!to) return;
    if (getProvider_() === 'BREVO') {
      sendViaBrevo_(to, subject, body, options || {});
      return;
    }

    var hasRichContent = !!(options && (options.htmlBody || options.inlineImages));
    var payload = {
      name: APP_CONSTANTS.APP_NAME
    };
    if (options && options.htmlBody) payload.htmlBody = options.htmlBody;
    if (options && options.inlineImages) payload.inlineImages = options.inlineImages;
    if (options && options.replyTo) payload.replyTo = options.replyTo;

    if (hasRichContent) {
      GmailApp.sendEmail(to, subject, body, payload);
      return;
    }

    MailApp.sendEmail(to, subject, body, payload);
  }

  function sendAlert(alert) {
    sendEmail(alert.destinatarios, '[' + alert.severidad + '] ' + alert.modulo + ' - ' + alert.tipo, alert.mensaje);
  }

  function sendProjectDelayAlert(project) {
    var recipients = project.responsableEmail || AppConfig.get('ALERT_EMAILS', '');
    var body = [
      'Proyecto: ' + project.nombre,
      'Responsable: ' + project.responsableEmail,
      'Fecha compromiso: ' + project.fechaCompromiso,
      'Avance: ' + project.avancePct + '%',
      'Semaforo: ' + project.semaforo
    ].join('\n');
    sendEmail(recipients, '[Alerta] Proyecto atrasado - ' + project.nombre, body);
  }

  function sendTeamTaskReminder(task, reminderType) {
    if (!task || !task.responsableEmail) return '';
    var isOverdue = reminderType === 'TASK_OVERDUE';
    var subject = isOverdue
      ? '[Seguimiento] Actividad vencida - ' + task.titulo
      : '[Seguimiento] Actividad por vencer - ' + task.titulo;
    var body = [
      'Actividad: ' + task.titulo,
      'Responsable: ' + (task.responsableNombre || task.responsableEmail),
      'Estado: ' + task.estadoTarea,
      'Prioridad: ' + task.prioridad,
      'Fecha limite: ' + task.fechaLimite,
      task.proyectoId ? 'Proyecto relacionado: ' + task.proyectoId : 'Proyecto relacionado: Sin referencia',
      '',
      isOverdue
        ? 'La actividad ya vencio y sigue abierta. Favor de actualizar su estado cuanto antes.'
        : 'La actividad vence pronto. Te recomendamos revisarla y actualizar su estatus.'
    ].join('\n');
    sendEmail(task.responsableEmail, subject, body);
    return body;
  }

  return {
    sendEmail: sendEmail,
    sendAlert: sendAlert,
    sendProjectDelayAlert: sendProjectDelayAlert,
    sendTeamTaskReminder: sendTeamTaskReminder
  };
})();
