package com.billu.foundation.domain;

import java.time.Instant;

public class AuditEvent {
  private String auditEventId;
  private String eventType;
  private String entityType;
  private String entityId;
  private String actor;
  private String environmentKey;
  private String correlationId;
  private String payloadSummary;
  private Instant createdAt;

  public AuditEvent() {
  }

  public AuditEvent(String auditEventId, String eventType, String entityType, String entityId,
      String actor, String environmentKey, String correlationId, String payloadSummary,
      Instant createdAt) {
    this.auditEventId = auditEventId;
    this.eventType = eventType;
    this.entityType = entityType;
    this.entityId = entityId;
    this.actor = actor;
    this.environmentKey = environmentKey;
    this.correlationId = correlationId;
    this.payloadSummary = payloadSummary;
    this.createdAt = createdAt;
  }

  public String getAuditEventId() { return auditEventId; }
  public String getEventType() { return eventType; }
  public String getEntityType() { return entityType; }
  public String getEntityId() { return entityId; }
  public String getActor() { return actor; }
  public String getEnvironmentKey() { return environmentKey; }
  public String getCorrelationId() { return correlationId; }
  public String getPayloadSummary() { return payloadSummary; }
  public Instant getCreatedAt() { return createdAt; }
}
