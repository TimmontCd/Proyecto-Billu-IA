package com.billu.foundation.web.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class BootstrapConfig {
  private final Properties properties = new Properties();

  public BootstrapConfig() {
    load("application.properties");
    if (!properties.containsKey("billu.environment.default")) {
      properties.setProperty("billu.environment.default", "local-mock");
    }
  }

  public String getDefaultEnvironment() {
    return properties.getProperty("billu.environment.default");
  }

  public String getProperty(String key) {
    return properties.getProperty(key);
  }

  private void load(String resourcePath) {
    InputStream resourceStream = getClass().getClassLoader().getResourceAsStream(resourcePath);
    if (resourceStream == null) {
      return;
    }
    try (InputStream inputStream = resourceStream) {
      properties.load(inputStream);
    } catch (IOException ignored) {
      // Keep bootstrap permissive for local development.
    }
  }
}
