package com.billu.foundation.web.config;

import com.billu.foundation.domain.EnvironmentProfile;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ProfileSwitchConfig {
  private final BootstrapConfig bootstrapConfig;
  private final EnvironmentProfileResolver environmentProfileResolver;
  private final Properties mergedProperties = new Properties();
  private final String activeEnvironment;

  public ProfileSwitchConfig() {
    this(new BootstrapConfig(), new EnvironmentProfileResolver());
  }

  public ProfileSwitchConfig(BootstrapConfig bootstrapConfig,
      EnvironmentProfileResolver environmentProfileResolver) {
    this.bootstrapConfig = bootstrapConfig;
    this.environmentProfileResolver = environmentProfileResolver;
    loadProperties("application.properties");
    this.activeEnvironment = resolveActiveEnvironment();
    loadProperties("application-" + activeEnvironment + ".properties");
  }

  public String getActiveEnvironment() {
    return activeEnvironment;
  }

  public EnvironmentProfile resolveEnvironmentProfile() {
    boolean defaultMockEnabled = "local-mock".equals(activeEnvironment);
    boolean defaultOracleEnabled = "local-oracle".equals(activeEnvironment)
        || "dev".equals(activeEnvironment) || "qa".equals(activeEnvironment);
    boolean defaultLegacyBridgeEnabled = activeEnvironment != null
        && activeEnvironment.startsWith("local");
    return environmentProfileResolver.resolve(
        activeEnvironment,
        getBooleanProperty("billu.mock.enabled", defaultMockEnabled),
        getBooleanProperty("billu.oracle.enabled", defaultOracleEnabled),
        getBooleanProperty("billu.legacy.bridge.enabled", defaultLegacyBridgeEnabled),
        getSecretProvider(),
        getDeploymentTarget());
  }

  public String getSchedulerCatalogPath() {
    return getProperty("billu.scheduler.catalog.path", "backend/config/schedulers/local-schedulers.json");
  }

  public String getSecretProvider() {
    return getProperty("billu.secrets.provider", "local");
  }

  public String getBootstrapDatasetKey() {
    return getProperty("billu.mock.dataset.bootstrap", "bootstrap");
  }

  public String getServiceName() {
    return getProperty("billu.service.name", "billu-backend-foundation");
  }

  public String getServiceVersion() {
    return getProperty("billu.service.version", "0.1.0-SNAPSHOT");
  }

  public String getOracleUrl() {
    return resolveExternal("BILLU_ORACLE_URL", "billu.oracle.url");
  }

  public String getOracleUser() {
    return resolveExternal("BILLU_ORACLE_USER", "billu.oracle.user");
  }

  public String getOraclePassword() {
    return resolveExternal("BILLU_ORACLE_PASSWORD", "billu.oracle.password");
  }

  public String getProperty(String key, String defaultValue) {
    String systemValue = System.getProperty(key);
    if (systemValue != null && !systemValue.trim().isEmpty()) {
      return systemValue;
    }
    String value = mergedProperties.getProperty(key);
    return value == null || value.trim().isEmpty() ? defaultValue : value;
  }

  public boolean getBooleanProperty(String key, boolean defaultValue) {
    String value = getProperty(key, String.valueOf(defaultValue));
    return "true".equalsIgnoreCase(value) || "1".equals(value)
        || "yes".equalsIgnoreCase(value);
  }

  private String resolveExternal(String envKey, String propertyKey) {
    String envValue = System.getenv(envKey);
    if (envValue != null && !envValue.trim().isEmpty()) {
      return envValue;
    }
    return getProperty(propertyKey, "");
  }

  private String resolveActiveEnvironment() {
    String systemEnvironment = System.getProperty("billu.environment");
    if (systemEnvironment != null && !systemEnvironment.trim().isEmpty()) {
      return systemEnvironment.trim();
    }
    String envEnvironment = System.getenv("BILLU_ENV");
    if (envEnvironment != null && !envEnvironment.trim().isEmpty()) {
      return envEnvironment.trim();
    }
    return bootstrapConfig.getDefaultEnvironment();
  }

  private String getDeploymentTarget() {
    return getProperty("billu.deployment.target",
        activeEnvironment.startsWith("local") ? "local" : "was9");
  }

  private void loadProperties(String resourcePath) {
    InputStream resourceStream = getClass().getClassLoader().getResourceAsStream(resourcePath);
    if (resourceStream == null) {
      return;
    }
    try (InputStream inputStream = resourceStream) {
      mergedProperties.load(inputStream);
    } catch (IOException ignored) {
      // Keep profile switching resilient while the foundation is being assembled.
    }
  }
}
