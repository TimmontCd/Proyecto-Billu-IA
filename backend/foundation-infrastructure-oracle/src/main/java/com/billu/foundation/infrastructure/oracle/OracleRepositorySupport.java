package com.billu.foundation.infrastructure.oracle;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public abstract class OracleRepositorySupport {
  private final String environment;
  private final String url;
  private final String user;
  private final String password;
  private final OracleConnectionFactory connectionFactory;

  protected OracleRepositorySupport(String environment, String url, String user, String password) {
    this(environment, url, user, password, new OracleConnectionFactory());
  }

  protected OracleRepositorySupport(String environment, String url, String user, String password,
      OracleConnectionFactory connectionFactory) {
    this.environment = environment;
    this.url = url;
    this.user = user;
    this.password = password;
    this.connectionFactory = connectionFactory;
  }

  protected Connection openConnection() {
    requireConnectionSettings();
    try {
      return connectionFactory.getConnection(url, user, password);
    } catch (SQLException exception) {
      throw queryFailure("Unable to open Oracle connection", exception);
    }
  }

  protected String getEnvironment() {
    return hasText(environment) ? environment : "local-oracle";
  }

  protected String trimToEmpty(String value) {
    return value == null ? "" : value.trim();
  }

  protected boolean hasText(String value) {
    return value != null && !value.trim().isEmpty();
  }

  protected Instant toInstant(Timestamp value, Instant fallback) {
    return value == null ? fallback : value.toInstant();
  }

  protected double round1(double value) {
    return Math.round(value * 10.0d) / 10.0d;
  }

  protected double round2(double value) {
    return Math.round(value * 100.0d) / 100.0d;
  }

  protected double pct(int part, int total) {
    if (part <= 0 || total <= 0) {
      return 0;
    }
    return round1((part * 100.0d) / total);
  }

  protected String normalizeSegmentLabel(String segmentId) {
    if ("Aliados_Premium".equals(segmentId)) {
      return "Aliados Premium";
    }
    return segmentId;
  }

  protected List<String> splitCommaSeparatedValues(String rawValue) {
    List<String> values = new ArrayList<String>();
    if (!hasText(rawValue)) {
      return values;
    }
    String[] tokens = rawValue.split(",");
    for (String token : tokens) {
      String normalized = trimToEmpty(token);
      if (!normalized.isEmpty()) {
        values.add(normalized);
      }
    }
    return values;
  }

  protected String normalizeProductCode(String rawValue) {
    String normalized = trimToEmpty(rawValue);
    if (normalized.isEmpty()) {
      return "SIN_PRODUCTO";
    }
    String ascii = Normalizer.normalize(normalized, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "");
    String upper = ascii.toUpperCase(Locale.US).replaceAll("[^A-Z0-9]+", "_");
    return upper.replaceAll("^_+", "").replaceAll("_+$", "");
  }

  protected Map<String, Object> namedCount(String key, String label, int count) {
    Map<String, Object> value = new LinkedHashMap<String, Object>();
    value.put(key, label);
    value.put("clients", Integer.valueOf(count));
    return value;
  }

  protected IllegalStateException queryFailure(String message, SQLException exception) {
    return new IllegalStateException(message + ": " + exception.getMessage(), exception);
  }

  private void requireConnectionSettings() {
    if (!hasText(url) || !hasText(user) || !hasText(password)) {
      throw new IllegalStateException(
          "Oracle connection settings are incomplete. Configure BILLU_ORACLE_URL, "
              + "BILLU_ORACLE_USER and BILLU_ORACLE_PASSWORD.");
    }
  }
}
