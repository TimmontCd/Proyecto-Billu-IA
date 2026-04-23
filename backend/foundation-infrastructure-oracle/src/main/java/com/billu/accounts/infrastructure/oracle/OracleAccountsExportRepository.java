package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsExportGateway;
import com.billu.accounts.application.ExportCustomerSummaryUseCase;
import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

public class OracleAccountsExportRepository extends OracleRepositorySupport
    implements AccountsExportGateway {
  private static final String HISTORICAL_MONTH_COUNT_SQL =
      "SELECT COUNT(*) AS row_count "
          + "FROM DLK_CUSTOMER "
          + "WHERE OPENING_DATE IS NOT NULL "
          + "  AND EXTRACT(YEAR FROM OPENING_DATE) = ? "
          + "  AND EXTRACT(MONTH FROM OPENING_DATE) = ?";
  private static final String CARD_COVERAGE_COUNT_SQL =
      "SELECT COUNT(*) AS row_count "
          + "FROM DLK_CARD_STATUS "
          + "WHERE CUT_DATE = (SELECT MAX(CUT_DATE) FROM DLK_CARD_STATUS)";

  public OracleAccountsExportRepository(String environment, String url, String user,
      String password) {
    super(environment, url, user, password);
  }

  OracleAccountsExportRepository(String environment, String url, String user, String password,
      OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public AccountsExportResult exportData(AccountsExportRequest request) {
    try (Connection connection = openConnection()) {
      int rowCount = loadRowCount(connection, request);
      return new AccountsExportResult(
          request.getExportType(),
          "SUCCEEDED",
          buildFileName(request),
          rowCount,
          request.getCorrelationId(),
          buildSummary(request.getExportType(), rowCount));
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer summary export projection", exception);
    }
  }

  private int loadRowCount(Connection connection, AccountsExportRequest request) throws SQLException {
    if (ExportCustomerSummaryUseCase.EXPORT_TYPE_CARD_COVERAGE.equals(request.getExportType())) {
      try (PreparedStatement statement = connection.prepareStatement(CARD_COVERAGE_COUNT_SQL);
           ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return 0;
        }
        return resultSet.getInt("row_count") > 0 ? 3 : 0;
      }
    }
    Map<String, Object> filters = request.getFilters();
    int selectedYear = ((Number) filters.get("selectedYear")).intValue();
    int selectedMonth = ((Number) filters.get("selectedMonth")).intValue();
    try (PreparedStatement statement = connection.prepareStatement(HISTORICAL_MONTH_COUNT_SQL)) {
      statement.setInt(1, selectedYear);
      statement.setInt(2, selectedMonth);
      try (ResultSet resultSet = statement.executeQuery()) {
        return resultSet.next() ? resultSet.getInt("row_count") : 0;
      }
    }
  }

  private String buildFileName(AccountsExportRequest request) {
    String suffix = request.getExportType().toLowerCase().replace('_', '-');
    if (ExportCustomerSummaryUseCase.EXPORT_TYPE_CARD_COVERAGE.equals(request.getExportType())) {
      return "customer-summary-" + suffix + ".csv";
    }
    Map<String, Object> filters = request.getFilters();
    return "customer-summary-" + suffix + "-"
        + filters.get("selectedYear") + "-"
        + padMonth(filters.get("selectedMonth")) + ".csv";
  }

  private String buildSummary(String exportType, int rowCount) {
    if (ExportCustomerSummaryUseCase.EXPORT_TYPE_CARD_COVERAGE.equals(exportType)) {
      return "Exporte Oracle de card coverage generado con " + rowCount + " renglones.";
    }
    if (ExportCustomerSummaryUseCase.EXPORT_TYPE_FIRST30_MONTH.equals(exportType)) {
      return "Exporte Oracle de First30 generado con " + rowCount + " renglones.";
    }
    return "Exporte Oracle historico generado con " + rowCount + " renglones.";
  }

  private String padMonth(Object value) {
    if (value == null) {
      return "00";
    }
    int month = ((Number) value).intValue();
    return month < 10 ? "0" + month : String.valueOf(month);
  }
}
