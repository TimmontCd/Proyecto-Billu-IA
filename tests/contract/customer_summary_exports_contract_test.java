import com.billu.accounts.application.AccountsCardCoverageGateway;
import com.billu.accounts.application.AccountsExportGateway;
import com.billu.accounts.application.CustomerSummaryAuditService;
import com.billu.accounts.application.ExportCustomerSummaryUseCase;
import com.billu.accounts.application.GetCustomerSummaryCardCoverageUseCase;
import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;
import com.billu.accounts.domain.CardCoverageSnapshot;
import com.billu.accounts.web.CustomerSummaryMetricsPublisher;
import com.billu.accounts.web.api.CardCoverageResponse;
import com.billu.accounts.web.api.CustomerSummaryCardCoverageController;
import com.billu.accounts.web.api.CustomerSummaryExportController;
import com.billu.accounts.web.api.CustomerSummaryExportRequest;
import com.billu.accounts.web.api.CustomerSummaryExportResponse;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.application.observability.AuditPublisher;
import com.billu.foundation.application.observability.AuditTrailService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.infrastructure.oracle.AuditEventRepository;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryExportsContractTest {
  @Test
  void exposesCardCoverageAndExportContracts() {
    CustomerSummaryAuditService auditService = new CustomerSummaryAuditService(
        new AuditTrailService(new AuditEventRepository(), new AuditPublisher()));
    StaticAccessContextService accessContextService = new StaticAccessContextService();

    CustomerSummaryCardCoverageController cardCoverageController =
        new CustomerSummaryCardCoverageController(
            new GetCustomerSummaryCardCoverageUseCase(new StaticCardCoverageGateway(),
                auditService, accessContextService),
            new CustomerSummaryMetricsPublisher());
    CustomerSummaryExportController exportController =
        new CustomerSummaryExportController(
            new ExportCustomerSummaryUseCase(new StaticExportGateway(), auditService,
                accessContextService),
            new CustomerSummaryMetricsPublisher());

    CardCoverageResponse coverage = cardCoverageController.getCoverage(null);
    CustomerSummaryExportResponse exportResponse = (CustomerSummaryExportResponse) exportController
        .exportHistoricalMonth(new CustomerSummaryExportRequest(2026, 3), null)
        .getEntity();

    assertEquals("local-mock", coverage.getEnvironment());
    assertEquals(64, ((Number) coverage.getSummary().get("coveredAccounts")).intValue());
    assertEquals("HISTORICAL_MONTH", exportResponse.getExportType());
    assertEquals("SUCCEEDED", exportResponse.getOutcome());
  }

  private static class StaticCardCoverageGateway implements AccountsCardCoverageGateway {
    @Override
    public CardCoverageSnapshot getCoverage() {
      Map<String, Object> segment = new LinkedHashMap<String, Object>();
      segment.put("segment", "ACTIVE_CARD");
      segment.put("accounts", Integer.valueOf(64));
      return new CardCoverageSnapshot("local-mock", 64, 31, 40, 28,
          Collections.<Map<String, Object>>singletonList(segment), Instant.now());
    }
  }

  private static class StaticExportGateway implements AccountsExportGateway {
    @Override
    public AccountsExportResult exportData(AccountsExportRequest request) {
      return new AccountsExportResult(request.getExportType(), "SUCCEEDED",
          "customer-summary-historical-month-2026-03.csv", 34, request.getCorrelationId(),
          "Export generated");
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
