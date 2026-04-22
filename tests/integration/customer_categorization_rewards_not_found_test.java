import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.FindCustomerCategorizationByRewardsIdUseCase;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationLookupGateway;
import com.billu.categorization.infrastructure.mock.MockCustomerCategorizationLookupRepository;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CustomerCategorizationRewardsNotFoundTest {
  @Test
  void returnsControlledErrorWhenRewardsIdDoesNotExist() {
    FindCustomerCategorizationByRewardsIdUseCase useCase =
        new FindCustomerCategorizationByRewardsIdUseCase(
            new MockCustomerCategorizationLookupGateway(
                new MockCustomerCategorizationLookupRepository()),
            new CustomerCategorizationAuditService(new AuditTrailService(
                new AuditEventRepository(), new AuditPublisher())),
            new StaticAccessContextService());

    IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
        () -> useCase.execute("UNKNOWN", "corr-categorization-lookup-2"));

    assertEquals("No se encontro informacion para el ID RECOMPENSAS capturado.",
        exception.getMessage());
  }

  private static class StaticAccessContextService implements AccessContextQueryUseCase {
    @Override
    public AccessContext getAccessContext() {
      return new AccessContext(
          "subject-1",
          "tester@billu",
          "LOCAL_MOCK",
          Collections.singletonList("PLATFORM_ADMIN"),
          Collections.singletonList("foundation:read"),
          "local-mock",
          "LOCAL_MOCK",
          Instant.now());
    }
  }
}
