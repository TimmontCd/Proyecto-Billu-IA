import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.jobs.JobExecutionQueryUseCase;
import com.billu.foundation.application.jobs.JobExecutionUseCase;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.domain.JobExecution;
import com.billu.foundation.web.api.JobExecutionRequest;
import com.billu.foundation.web.api.JobExecutionResponse;
import com.billu.foundation.web.api.PlatformJobController;
import com.billu.foundation.web.metrics.PlatformMetricsPublisher;
import java.time.Instant;
import java.util.Collections;
import javax.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class PlatformJobsContractTest {
  @Test
  void exposesJobExecutionContracts() {
    InMemoryJobService jobService = new InMemoryJobService();
    PlatformJobController controller = new PlatformJobController(
        jobService,
        jobService,
        new PlatformMetricsPublisher());

    Response response = controller.execute("platform-smoke", new JobExecutionRequest(), null);
    JobExecutionResponse accepted = (JobExecutionResponse) response.getEntity();
    JobExecutionResponse fetched = controller.find("platform-smoke", accepted.getExecutionId());

    assertEquals(202, response.getStatus());
    assertEquals("platform-smoke", accepted.getJobKey());
    assertEquals(accepted.getExecutionId(), fetched.getExecutionId());
  }

  private static class InMemoryJobService implements JobExecutionUseCase, JobExecutionQueryUseCase,
      AccessContextQueryUseCase {
    private JobExecution lastExecution;

    @Override
    public JobExecution execute(com.billu.foundation.application.jobs.JobExecutionCommand command) {
      lastExecution = new JobExecution(
          "exec-1",
          command.getJobKey(),
          "tester@billu",
          "local-mock",
          "BOTH",
          Instant.now(),
          Instant.now(),
          "SUCCEEDED",
          "corr-1",
          "Platform Smoke Validation executed");
      return lastExecution;
    }

    @Override
    public JobExecution find(String jobKey, String executionId) {
      return lastExecution;
    }

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
