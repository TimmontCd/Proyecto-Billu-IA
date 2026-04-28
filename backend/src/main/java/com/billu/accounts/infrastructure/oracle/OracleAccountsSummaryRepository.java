package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsSummaryGateway;
import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.accounts.domain.ProductSummaryItem;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OracleAccountsSummaryRepository extends OracleRepositorySupport
    implements AccountsSummaryGateway {
  private static final String SOURCE_MODE = "ORACLE";
  private static final String OVERVIEW_SQL =
      "SELECT "
          + "(SELECT COUNT(*) FROM DLK_CUSTOMER) AS total_accounts, "
          + "(SELECT COUNT(*) FROM DLK_CUSTOMER "
          + "  WHERE UPPER(NVL(ACCOUNT_STATUS, 'ACTIVE')) = 'ACTIVE') AS active_accounts, "
          + "(SELECT COUNT(*) FROM DLK_CUSTOMER "
          + "  WHERE UPPER(NVL(ACCOUNT_STATUS, 'ACTIVE')) <> 'ACTIVE') AS inactive_accounts, "
          + "(SELECT NVL(SUM(PRODUCT_BALANCE_AMOUNT), 0) "
          + "  FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT "
          + "  WHERE SNAPSHOT_DATE = (SELECT MAX(SNAPSHOT_DATE) FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT) "
          + "    AND NVL(PRODUCT_ACTIVE_FLAG, 'Y') = 'Y') AS total_balance, "
          + "(SELECT MAX(CAST(SNAPSHOT_DATE AS TIMESTAMP)) "
          + "  FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT) AS generated_at "
          + "FROM DUAL";
  private static final String PRODUCT_SUMMARY_SQL =
      "SELECT PRODUCT_CODE, "
          + "MAX(NVL(PRODUCT_LABEL, PRODUCT_CODE)) AS product_label, "
          + "COUNT(DISTINCT REWARDS_ID) AS accounts, "
          + "NVL(SUM(PRODUCT_BALANCE_AMOUNT), 0) AS total_balance, "
          + "CASE "
          + "  WHEN SUM(CASE WHEN UPPER(NVL(ACCOUNT_STATUS, 'ACTIVE')) = 'ACTIVE' "
          + "       THEN 1 ELSE 0 END) > 0 THEN 'ACTIVE' "
          + "  ELSE 'INACTIVE' "
          + "END AS status "
          + "FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT "
          + "WHERE SNAPSHOT_DATE = (SELECT MAX(SNAPSHOT_DATE) FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT) "
          + "  AND NVL(PRODUCT_ACTIVE_FLAG, 'Y') = 'Y' "
          + "GROUP BY PRODUCT_CODE "
          + "ORDER BY accounts DESC, total_balance DESC, PRODUCT_CODE";

  public OracleAccountsSummaryRepository(String environment, String url, String user,
      String password) {
    super(environment, url, user, password);
  }

  OracleAccountsSummaryRepository(String environment, String url, String user, String password,
      OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public CustomerAccountSummary getOverview() {
    try (Connection connection = openConnection()) {
      OverviewAggregate aggregate = loadAggregate(connection);
      List<ProductSummaryItem> productSummary = loadProductSummary(connection, aggregate.totalAccounts);
      return new CustomerAccountSummary(
          "customer-summary-overview-oracle",
          getEnvironment(),
          aggregate.totalAccounts,
          aggregate.totalBalance,
          aggregate.activeAccounts,
          aggregate.inactiveAccounts,
          buildExecutiveSummary(aggregate),
          SOURCE_MODE,
          aggregate.generatedAt,
          buildKpis(aggregate),
          productSummary);
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer summary overview", exception);
    }
  }

  private OverviewAggregate loadAggregate(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(OVERVIEW_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      if (!resultSet.next()) {
        return new OverviewAggregate(0, 0, 0, 0, Instant.now());
      }
      Timestamp generatedAt = resultSet.getTimestamp("generated_at");
      return new OverviewAggregate(
          resultSet.getInt("total_accounts"),
          resultSet.getInt("active_accounts"),
          resultSet.getInt("inactive_accounts"),
          resultSet.getDouble("total_balance"),
          toInstant(generatedAt, Instant.now()));
    }
  }

  private List<ProductSummaryItem> loadProductSummary(Connection connection, int totalAccounts)
      throws SQLException {
    List<ProductSummaryItem> productSummary = new ArrayList<ProductSummaryItem>();
    try (PreparedStatement statement = connection.prepareStatement(PRODUCT_SUMMARY_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      while (resultSet.next()) {
        int accounts = resultSet.getInt("accounts");
        productSummary.add(new ProductSummaryItem(
            resultSet.getString("PRODUCT_CODE"),
            resultSet.getString("product_label"),
            accounts,
            pct(accounts, totalAccounts),
            round2(resultSet.getDouble("total_balance")),
            resultSet.getString("status")));
      }
    }
    return productSummary;
  }

  private Map<String, Double> buildKpis(OverviewAggregate aggregate) {
    Map<String, Double> kpis = new LinkedHashMap<String, Double>();
    kpis.put("total_accounts", Double.valueOf(aggregate.totalAccounts));
    kpis.put("total_balance", Double.valueOf(round2(aggregate.totalBalance)));
    kpis.put("active_accounts", Double.valueOf(aggregate.activeAccounts));
    kpis.put("inactive_accounts", Double.valueOf(aggregate.inactiveAccounts));
    return kpis;
  }

  private String buildExecutiveSummary(OverviewAggregate aggregate) {
    if (aggregate.totalAccounts <= 0) {
      return "Oracle no devolvio cuentas para el overview institucional.";
    }
    return "Oracle consolido " + aggregate.totalAccounts + " cuentas, de las cuales "
        + aggregate.activeAccounts + " permanecen activas, con saldo agregado de "
        + round2(aggregate.totalBalance) + ".";
  }

  private static final class OverviewAggregate {
    private final int totalAccounts;
    private final int activeAccounts;
    private final int inactiveAccounts;
    private final double totalBalance;
    private final Instant generatedAt;

    private OverviewAggregate(int totalAccounts, int activeAccounts, int inactiveAccounts,
        double totalBalance, Instant generatedAt) {
      this.totalAccounts = totalAccounts;
      this.activeAccounts = activeAccounts;
      this.inactiveAccounts = inactiveAccounts;
      this.totalBalance = totalBalance;
      this.generatedAt = generatedAt;
    }
  }
}
