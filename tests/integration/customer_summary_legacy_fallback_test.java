import com.billu.accounts.infrastructure.legacy.LegacyAccountsSummaryAdapter;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerSummaryLegacyFallbackTest {
  @Test
  void exposesReadOnlyLegacyOverviewForFallback() {
    com.billu.accounts.domain.CustomerAccountSummary response =
        new LegacyAccountsSummaryAdapter().getOverview();

    assertEquals("LEGACY_READ_ONLY", response.getSourceMode());
    assertEquals("legacy-bridge", response.getEnvironment());
    assertEquals(1842, response.getTotalAccounts());
  }
}
