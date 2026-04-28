package com.billu.foundation.infrastructure.oracle;

import com.billu.foundation.application.observability.AuditEventGateway;
import com.billu.foundation.domain.AuditEvent;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AuditEventRepository implements AuditEventGateway {
  private final List<AuditEvent> events = new ArrayList<AuditEvent>();

  @Override
  public synchronized void save(AuditEvent event) {
    events.add(event);
  }

  @Override
  public synchronized List<AuditEvent> findRecent() {
    return Collections.unmodifiableList(new ArrayList<AuditEvent>(events));
  }
}
