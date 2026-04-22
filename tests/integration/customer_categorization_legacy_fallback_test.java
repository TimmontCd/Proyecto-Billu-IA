import com.billu.categorization.infrastructure.legacy.LegacyCustomerCategorizationDashboardAdapter;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomerCategorizationLegacyFallbackTest {
  @Test
  void exposesReadOnlyLegacyDashboardForFallback() {
    com.billu.categorization.domain.CustomerCategorizationDashboard response =
        new LegacyCustomerCategorizationDashboardAdapter().getDashboard();

    assertEquals("LEGACY_READ_ONLY", response.getSourceMode());
    assertEquals("legacy-bridge", response.getEnvironment());
    assertEquals(3, response.getSegmentSummary().size());
  }
}
