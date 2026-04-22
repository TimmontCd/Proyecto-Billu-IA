package com.billu.foundation.application.observability;

import com.billu.foundation.domain.AuditEvent;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AuditTrailService {
  private final AuditEventGateway auditEventGateway;
  private final AuditPublisher auditPublisher;

  public AuditTrailService(AuditEventGateway auditEventGateway, AuditPublisher auditPublisher) {
    this.auditEventGateway = auditEventGateway;
    this.auditPublisher = auditPublisher;
  }

  public AuditEvent record(String eventType, String entityType, String entityId, String actor,
      String environmentKey, String correlationId, String payloadSummary) {
    AuditEvent event = new AuditEvent(
        UUID.randomUUID().toString(),
        eventType,
        entityType,
        entityId,
        actor,
        environmentKey,
        correlationId,
        payloadSummary,
        Instant.now());
    auditEventGateway.save(event);
    auditPublisher.publish(event);
    return event;
  }

  public List<AuditEvent> getRecentEvents() {
    return auditEventGateway.findRecent();
  }
}
