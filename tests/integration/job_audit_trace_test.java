import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.jobs.JobExecutionCommand;
import com.billu.foundation.application.jobs.JobExecutionService;
import com.billu.foundation.application.jobs.JsonSchedulerExecutor;
import com.billu.foundation.application.jobs.SchedulerCatalogLoader;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.domain.AuditEvent;
import com.billu.foundation.domain.EnvironmentProfile;
import com.billu.foundation.domain.JobExecution;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class JobAuditTraceTest {
  @Test
  void recordsAuditEvidenceForManualJobExecution() {
    AuditEventRepository repository = new AuditEventRepository();
    AuditTrailService auditTrailService = new AuditTrailService(
        repository,
        new com.billu.foundation.application.observability.AuditPublisher());
    JobExecutionService service = new JobExecutionService(
        new EnvironmentProfile("local-mock", "local-mock", true, false, true, "local", "local",
            "ACTIVE"),
        new JsonSchedulerExecutor(new SchedulerCatalogLoader(),
            "backend/config/schedulers/local-schedulers.json"),
        auditTrailService,
        new StaticAccessContextService());

    JobExecution execution = service.execute(new JobExecutionCommand(
        "platform-smoke",
        "MOCK",
        "tester@billu",
        false,
        "corr-job-1"));
    List<AuditEvent> events = repository.findRecent();

    assertEquals("SUCCEEDED", execution.getOutcome());
    assertEquals("corr-job-1", execution.getCorrelationId());
    assertFalse(events.isEmpty());
    assertEquals("JOB_EXECUTED", events.get(0).getEventType());
  }

  private static class StaticAccessContextService implements AccessContextQueryUseCase {
    @Override
    public AccessContext getAccessContext() {
      return new AccessContext(
          "subject-1",
          "tester@billu",
          "LOCAL_MOCK",
          Collections.singletonList("PLATFORM_ADMIN"),
          Collections.singletonList("jobs:execute"),
          "local-mock",
          "LOCAL_MOCK",
          Instant.now());
    }
  }
}
