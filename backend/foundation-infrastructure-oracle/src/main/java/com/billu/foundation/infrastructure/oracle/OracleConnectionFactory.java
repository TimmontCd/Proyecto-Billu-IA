package com.billu.foundation.infrastructure.oracle;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class OracleConnectionFactory {
  public Connection getConnection(String url, String user, String password) throws SQLException {
    Properties properties = new Properties();
    properties.setProperty("user", user);
    properties.setProperty("password", password);
    return DriverManager.getConnection(url, properties);
  }
}
