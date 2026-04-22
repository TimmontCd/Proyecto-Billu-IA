import com.billu.categorization.application.CustomerCategorizationAuditService;
import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.application.FindCustomerCategorizationByRewardsIdUseCase;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import com.billu.categorization.web.api.CustomerCategorizationLookupController;
import com.billu.categorization.web.api.CustomerCategorizationLookupResponse;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerCategorizationRewardsContractTest {
  @Test
  void exposesRewardsLookupContract() {
    CustomerCategorizationLookupController controller =
        new CustomerCategorizationLookupController(
            new FindCustomerCategorizationByRewardsIdUseCase(
                new StaticLookupGateway(),
                new CustomerCategorizationAuditService(new AuditTrailService(
                    new AuditEventRepository(), new AuditPublisher())),
                new StaticAccessContextService()));

    CustomerCategorizationLookupResponse response = controller.findByRewardsId("ABC123", null);

    assertEquals("local-mock", response.getEnvironment());
    assertEquals("ABC123", response.getRewardsId());
    assertEquals(1, response.getRows().size());
  }

  private static class StaticLookupGateway implements CustomerCategorizationLookupGateway {
    @Override
    public CustomerCategorizationLookupResult findByRewardsId(String rewardsId) {
      Map<String, Object> row = new LinkedHashMap<String, Object>();
      row.put("idRecompensas", rewardsId);
      row.put("nivelCliente", "Constructores");
      return new CustomerCategorizationLookupResult(
          "local-mock", rewardsId, 1, "Mock lookup", Arrays.<Map<String, Object>>asList(row));
    }
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
