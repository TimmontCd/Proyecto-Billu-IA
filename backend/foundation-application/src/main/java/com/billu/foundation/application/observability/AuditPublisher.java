package com.billu.foundation.application.observability;

import com.billu.foundation.domain.AuditEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AuditPublisher {
  private static final Logger LOGGER = LoggerFactory.getLogger(AuditPublisher.class);

  public void publish(AuditEvent event) {
    LOGGER.info("auditEventId={} entityType={} entityId={} actor={} correlationId={}",
        event.getAuditEventId(), event.getEntityType(), event.getEntityId(),
        event.getActor(), event.getCorrelationId());
  }
}
