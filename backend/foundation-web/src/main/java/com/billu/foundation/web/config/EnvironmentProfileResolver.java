package com.billu.foundation.web.config;

import com.billu.foundation.domain.EnvironmentProfile;

public class EnvironmentProfileResolver {
  public EnvironmentProfile resolve(String environmentKey) {
    return resolve(environmentKey, "local-mock".equals(environmentKey) ? "local" : "cyberark",
        environmentKey != null && environmentKey.startsWith("local") ? "local" : "was9");
  }

  public EnvironmentProfile resolve(String environmentKey, String secretSource, String deploymentTarget) {
    boolean mockEnabled = "local-mock".equals(environmentKey);
    boolean oracleEnabled = "local-oracle".equals(environmentKey) || "dev".equals(environmentKey)
        || "qa".equals(environmentKey);
    boolean legacyBridgeEnabled = environmentKey != null && environmentKey.startsWith("local");
    return resolve(environmentKey, mockEnabled, oracleEnabled, legacyBridgeEnabled, secretSource,
        deploymentTarget);
  }

  public EnvironmentProfile resolve(String environmentKey, boolean mockEnabled,
      boolean oracleEnabled, boolean legacyBridgeEnabled, String secretSource,
      String deploymentTarget) {
    return new EnvironmentProfile(
        environmentKey,
        environmentKey,
        mockEnabled,
        oracleEnabled,
        legacyBridgeEnabled,
        secretSource,
        deploymentTarget,
        "ACTIVE");
  }
}
