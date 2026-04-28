package com.billu.foundation.infrastructure.secrets;

public class SecretResolutionService {
  private final SecretProvider localSecretProvider;
  private final SecretProvider cyberArkSecretProvider;
  private final String configuredProvider;
  private volatile String effectiveProvider;

  public SecretResolutionService(SecretProvider localSecretProvider,
      SecretProvider cyberArkSecretProvider, String configuredProvider) {
    this.localSecretProvider = localSecretProvider;
    this.cyberArkSecretProvider = cyberArkSecretProvider;
    this.configuredProvider = configuredProvider;
    this.effectiveProvider = normalizeProvider(configuredProvider);
  }

  public String resolve(String secretKey) {
    String normalizedProvider = normalizeProvider(configuredProvider);
    if ("CYBERARK".equals(normalizedProvider)) {
      String value = cyberArkSecretProvider.resolve(secretKey);
      if (isBlank(value)) {
        effectiveProvider = "LOCAL_FALLBACK";
        return localSecretProvider.resolve(secretKey);
      }
      effectiveProvider = "CYBERARK";
      return value;
    }
    effectiveProvider = "LOCAL";
    return localSecretProvider.resolve(secretKey);
  }

  public String getEffectiveProvider() {
    return effectiveProvider;
  }

  private String normalizeProvider(String provider) {
    return isBlank(provider) ? "LOCAL" : provider.trim().toUpperCase();
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }
}
