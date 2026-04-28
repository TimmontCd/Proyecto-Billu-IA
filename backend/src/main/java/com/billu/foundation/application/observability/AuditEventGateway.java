package com.billu.foundation.application.observability;

import com.billu.foundation.domain.AuditEvent;
import java.util.List;

public interface AuditEventGateway {
  void save(AuditEvent event);
  List<AuditEvent> findRecent();
}
