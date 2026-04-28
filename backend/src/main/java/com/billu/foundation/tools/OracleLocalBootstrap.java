package com.billu.foundation.tools;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class OracleLocalBootstrap {
  private static final String DATALAKE_SCHEMA_SQL = "billu_datalake_mvp.sql";
  private static final String DATALAKE_MIGRATION_SQL = "billu_datalake_catalog_migration.sql";
  private static final List<String> SEED_SQL_FILES = Arrays.asList(
      "billu_data_catalog_seed.sql",
      "billu_datalake_seed_demo.sql");

  private OracleLocalBootstrap() {
  }

  public static void main(String[] args) throws Exception {
    Options options = Options.parse(args);
    Class.forName("oracle.jdbc.OracleDriver");

    try (Connection connection = DriverManager.getConnection(
        options.url, options.adminUser, options.adminPassword)) {
      connection.setAutoCommit(false);
      String adminSchema = currentSchema(connection);

      System.out.println("Oracle local bootstrap");
      System.out.println("  URL: " + options.url);
      System.out.println("  Admin schema: " + adminSchema);
      System.out.println("  App user: " + options.appUser);

      ensureAppUser(connection, options.appUser, options.appPassword);

      if (options.reset) {
        dropExistingDlkTables(connection);
      }

      if (options.reset || !tableExists(connection, "DLK_CUSTOMER")) {
        executeSqlFile(connection, options.sqlDir.resolve(DATALAKE_SCHEMA_SQL));
      } else {
        executeSqlFile(connection, options.sqlDir.resolve(DATALAKE_MIGRATION_SQL));
      }

      for (String fileName : SEED_SQL_FILES) {
        executeSqlFile(connection, options.sqlDir.resolve(fileName));
      }

      grantDlkTables(connection, adminSchema, options.appUser);
      printCounts(connection);
      connection.commit();
      System.out.println("Bootstrap completo.");
    }
  }

  private static String currentSchema(Connection connection) throws SQLException {
    try (Statement statement = connection.createStatement();
         ResultSet resultSet = statement.executeQuery("SELECT SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') FROM DUAL")) {
      if (resultSet.next()) {
        return validateIdentifier(resultSet.getString(1), "current schema");
      }
      throw new SQLException("No se pudo resolver el schema actual.");
    }
  }

  private static void ensureAppUser(Connection connection, String appUser, String appPassword)
      throws SQLException {
    if (userExists(connection, appUser)) {
      System.out.println("Usuario existente: " + appUser);
      execute(connection, "ALTER USER " + appUser + " IDENTIFIED BY " + quotePassword(appPassword));
    } else {
      System.out.println("Creando usuario: " + appUser);
      execute(connection, "CREATE USER " + appUser + " IDENTIFIED BY " + quotePassword(appPassword));
    }
    execute(connection, "GRANT CREATE SESSION TO " + appUser);
  }

  private static boolean userExists(Connection connection, String appUser) throws SQLException {
    try (PreparedStatement statement =
        connection.prepareStatement("SELECT COUNT(*) FROM ALL_USERS WHERE USERNAME = ?")) {
      statement.setString(1, appUser);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() && resultSet.getInt(1) > 0;
      }
    }
  }

  private static boolean tableExists(Connection connection, String tableName) throws SQLException {
    try (PreparedStatement statement =
        connection.prepareStatement("SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME = ?")) {
      statement.setString(1, validateIdentifier(tableName, "table"));
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() && resultSet.getInt(1) > 0;
      }
    }
  }

  private static void dropExistingDlkTables(Connection connection) throws SQLException {
    List<String> tables = new ArrayList<String>();
    try (PreparedStatement statement = connection.prepareStatement(
        "SELECT TABLE_NAME FROM USER_TABLES WHERE TABLE_NAME LIKE 'DLK\\_%' ESCAPE '\\' ORDER BY TABLE_NAME DESC");
         ResultSet resultSet = statement.executeQuery()) {
      while (resultSet.next()) {
        tables.add(validateIdentifier(resultSet.getString("TABLE_NAME"), "table"));
      }
    }
    if (tables.isEmpty()) {
      System.out.println("No hay tablas DLK_* previas.");
      return;
    }
    System.out.println("Eliminando tablas DLK_* previas: " + tables.size());
    for (String table : tables) {
      execute(connection, "DROP TABLE " + table + " CASCADE CONSTRAINTS PURGE");
    }
  }

  private static void executeSqlFile(Connection connection, Path sqlFile)
      throws IOException, SQLException {
    if (!Files.exists(sqlFile)) {
      throw new IOException("No existe el archivo SQL: " + sqlFile);
    }
    System.out.println("Ejecutando " + sqlFile.getFileName());
    List<String> statements = parseSqlFile(sqlFile);
    int count = 0;
    for (String sql : statements) {
      execute(connection, sql);
      count++;
    }
    System.out.println("  Sentencias ejecutadas: " + count);
  }

  private static List<String> parseSqlFile(Path sqlFile) throws IOException {
    List<String> statements = new ArrayList<String>();
    StringBuilder current = new StringBuilder();
    boolean inPlSql = false;

    try (BufferedReader reader = Files.newBufferedReader(sqlFile, StandardCharsets.UTF_8)) {
      String line;
      while ((line = reader.readLine()) != null) {
        String trimmed = line.trim();
        String upper = trimmed.toUpperCase(Locale.ROOT);
        if (trimmed.isEmpty() || trimmed.startsWith("--")) {
          continue;
        }
        if (current.length() == 0 && isSqlPlusDirective(upper)) {
          continue;
        }
        if ("/".equals(trimmed) && inPlSql) {
          addStatement(statements, current.toString(), false);
          current.setLength(0);
          inPlSql = false;
          continue;
        }
        if (current.length() == 0 && startsPlSqlBlock(upper)) {
          inPlSql = true;
        }

        current.append(line).append('\n');
        if (!inPlSql && endsWithStatementTerminator(trimmed)) {
          addStatement(statements, current.toString(), true);
          current.setLength(0);
        }
      }
    }

    if (current.length() > 0) {
      addStatement(statements, current.toString(), !inPlSql);
    }
    return statements;
  }

  private static boolean isSqlPlusDirective(String upper) {
    return upper.startsWith("WHENEVER ")
        || upper.startsWith("SET ")
        || upper.startsWith("EXIT")
        || upper.startsWith("PROMPT ")
        || upper.startsWith("SPOOL ");
  }

  private static boolean startsPlSqlBlock(String upper) {
    return upper.startsWith("DECLARE")
        || upper.startsWith("BEGIN")
        || upper.startsWith("CREATE OR REPLACE PROCEDURE")
        || upper.startsWith("CREATE OR REPLACE FUNCTION")
        || upper.startsWith("CREATE OR REPLACE PACKAGE")
        || upper.startsWith("CREATE OR REPLACE TRIGGER");
  }

  private static boolean endsWithStatementTerminator(String trimmed) {
    return trimmed.endsWith(";");
  }

  private static void addStatement(List<String> statements, String sql, boolean stripTerminator) {
    String normalized = sql.trim();
    if (stripTerminator && normalized.endsWith(";")) {
      normalized = normalized.substring(0, normalized.length() - 1).trim();
    }
    if (!normalized.isEmpty()) {
      statements.add(normalized);
    }
  }

  private static void grantDlkTables(Connection connection, String adminSchema, String appUser)
      throws SQLException {
    List<String> tables = new ArrayList<String>();
    try (PreparedStatement statement = connection.prepareStatement(
        "SELECT TABLE_NAME FROM USER_TABLES WHERE TABLE_NAME LIKE 'DLK\\_%' ESCAPE '\\' ORDER BY TABLE_NAME");
         ResultSet resultSet = statement.executeQuery()) {
      while (resultSet.next()) {
        tables.add(validateIdentifier(resultSet.getString("TABLE_NAME"), "table"));
      }
    }

    for (String table : tables) {
      execute(connection, "GRANT SELECT, INSERT, UPDATE, DELETE ON " + table + " TO " + appUser);
      execute(connection, "CREATE OR REPLACE SYNONYM " + appUser + "." + table
          + " FOR " + adminSchema + "." + table);
    }
    System.out.println("Grants y sinonimos creados para " + tables.size() + " tablas.");
  }

  private static void printCounts(Connection connection) throws SQLException {
    List<String> tableNames = Arrays.asList(
        "DLK_CUSTOMER",
        "DLK_CUSTOMER_SEGMENT_SNAPSHOT",
        "DLK_CUSTOMER_PRODUCT_SNAPSHOT",
        "DLK_TRANSACTION",
        "DLK_CARD_STATUS",
        "DLK_SAVINGS_GOAL",
        "DLK_CREDIT_CARD_ACCOUNT",
        "DLK_CAMPAIGN_CUSTOMER",
        "DLK_MARKETING_AD_PERFORMANCE",
        "DLK_MARKETING_DEMOGRAPHIC_PERFORMANCE",
        "DLK_DATA_CATALOG_FIELD");
    System.out.println("Conteos dummy:");
    for (String tableName : tableNames) {
      try (Statement statement = connection.createStatement();
           ResultSet resultSet = statement.executeQuery("SELECT COUNT(*) FROM " + tableName)) {
        if (resultSet.next()) {
          System.out.println("  " + tableName + ": " + resultSet.getInt(1));
        }
      }
    }
  }

  private static void execute(Connection connection, String sql) throws SQLException {
    try (Statement statement = connection.createStatement()) {
      statement.execute(sql);
    } catch (SQLException exception) {
      throw new SQLException("Error ejecutando SQL: " + compact(sql), exception);
    }
  }

  private static String compact(String sql) {
    String value = sql.replace('\n', ' ').replace('\r', ' ').trim();
    return value.length() <= 180 ? value : value.substring(0, 180) + "...";
  }

  private static String quotePassword(String value) {
    if (value == null) {
      return "\"\"";
    }
    return "\"" + value.replace("\"", "\"\"") + "\"";
  }

  private static String validateIdentifier(String value, String label) {
    if (value == null) {
      throw new IllegalArgumentException("Identificador nulo: " + label);
    }
    String normalized = value.trim().toUpperCase(Locale.ROOT);
    if (!normalized.matches("[A-Z][A-Z0-9_$#]*")) {
      throw new IllegalArgumentException("Identificador Oracle no soportado para " + label + ": " + value);
    }
    return normalized;
  }

  private static final class Options {
    private final String url;
    private final String adminUser;
    private final String adminPassword;
    private final String appUser;
    private final String appPassword;
    private final Path sqlDir;
    private final boolean reset;

    private Options(String url, String adminUser, String adminPassword, String appUser,
        String appPassword, Path sqlDir, boolean reset) {
      this.url = url;
      this.adminUser = validateIdentifier(adminUser, "admin user");
      this.adminPassword = adminPassword;
      this.appUser = validateIdentifier(appUser, "app user");
      this.appPassword = appPassword;
      this.sqlDir = sqlDir;
      this.reset = reset;
    }

    private static Options parse(String[] args) {
      Map<String, String> values = new HashMap<String, String>();
      for (int index = 0; index < args.length; index++) {
        String arg = args[index];
        if (!arg.startsWith("--")) {
          throw new IllegalArgumentException("Argumento no soportado: " + arg);
        }
        String key;
        String value;
        int separatorIndex = arg.indexOf('=');
        if (separatorIndex > 0) {
          key = arg.substring(2, separatorIndex);
          value = arg.substring(separatorIndex + 1);
        } else {
          key = arg.substring(2);
          if (index + 1 >= args.length) {
            throw new IllegalArgumentException("Falta valor para --" + key);
          }
          value = args[++index];
        }
        values.put(key, value);
      }

      return new Options(
          required(values, "url"),
          required(values, "admin-user"),
          required(values, "admin-password"),
          required(values, "app-user"),
          required(values, "app-password"),
          Paths.get(required(values, "sql-dir")).toAbsolutePath().normalize(),
          Boolean.parseBoolean(values.containsKey("reset") ? values.get("reset") : "true"));
    }

    private static String required(Map<String, String> values, String key) {
      String value = values.get(key);
      if (value == null || value.trim().isEmpty()) {
        throw new IllegalArgumentException("Falta argumento --" + key);
      }
      return value;
    }
  }
}
