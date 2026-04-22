import com.billu.foundation.infrastructure.secrets.CyberArkSecretProvider;
import com.billu.foundation.infrastructure.secrets.LocalSecretProvider;
import com.billu.foundation.infrastructure.secrets.SecretProvider;
import com.billu.foundation.infrastructure.secrets.SecretResolutionService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class SecretsProviderFallbackTest {
  @Test
  void fallsBackToLocalProviderWhenCyberArkIsUnavailable() {
    SecretResolutionService service = new SecretResolutionService(
        new StaticLocalSecretProvider(),
        new CyberArkSecretProvider(),
        "cyberark");

    String secret = service.resolve("BILLU_ORACLE_PASSWORD");

    assertEquals("local-secret", secret);
    assertEquals("LOCAL_FALLBACK", service.getEffectiveProvider());
  }

  private static class StaticLocalSecretProvider extends LocalSecretProvider {
    @Override
    public String resolve(String secretKey) {
      return "local-secret";
    }
  }
}
