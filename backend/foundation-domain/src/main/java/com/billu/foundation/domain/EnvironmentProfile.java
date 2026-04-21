package com.billu.foundation.domain;

public class EnvironmentProfile {
  private String environmentKey;
  private String displayName;
  private boolean mockModeEnabled;
  private boolean oracleModeEnabled;
  private boolean legacyBridgeEnabled;
  private String secretSource;
  private String deploymentTarget;
  private String status;

  public EnvironmentProfile() {
  }

  public EnvironmentProfile(String environmentKey, String displayName, boolean mockModeEnabled,
      boolean oracleModeEnabled, boolean legacyBridgeEnabled, String secretSource,
      String deploymentTarget, String status) {
    this.environmentKey = environmentKey;
    this.displayName = displayName;
    this.mockModeEnabled = mockModeEnabled;
    this.oracleModeEnabled = oracleModeEnabled;
    this.legacyBridgeEnabled = legacyBridgeEnabled;
    this.secretSource = secretSource;
    this.deploymentTarget = deploymentTarget;
    this.status = status;
  }

  public String getEnvironmentKey() { return environmentKey; }
  public String getDisplayName() { return displayName; }
  public boolean isMockModeEnabled() { return mockModeEnabled; }
  public boolean isOracleModeEnabled() { return oracleModeEnabled; }
  public boolean isLegacyBridgeEnabled() { return legacyBridgeEnabled; }
  public String getSecretSource() { return secretSource; }
  public String getDeploymentTarget() { return deploymentTarget; }
  public String getStatus() { return status; }
}
