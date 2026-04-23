package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationDashboardGateway;
import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.categorization.domain.CustomerSegmentSummary;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OracleCustomerCategorizationDashboardRepository
    extends OracleRepositorySupport implements CustomerCategorizationDashboardGateway {
  private static final String SOURCE_MODE = "ORACLE";
  private static final String LATEST_SNAPSHOT_SQL =
      "SELECT MAX(SNAPSHOT_DATE) AS snapshot_date FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT";
  private static final String GLOBAL_KPI_SQL =
      "SELECT COUNT(*) AS total_clients, "
          + "NVL(SUM(CURRENT_BALANCE_AMOUNT), 0) AS total_balance, "
          + "NVL(AVG(CURRENT_BALANCE_AMOUNT), 0) AS average_balance, "
          + "NVL(AVG(ABONOS_COUNT_30D), 0) AS average_abonos, "
          + "NVL(AVG(CARGOS_COUNT_30D), 0) AS average_cargos, "
          + "SUM(CASE WHEN UPPER(NVL(MISSING_PRODUCTS_TEXT, ' ')) LIKE '%TARJETA%' "
          + "    THEN 1 ELSE 0 END) AS credit_card_opportunity_clients, "
          + "SUM(CASE WHEN TRIM(NVL(MISSING_PRODUCTS_TEXT, '')) = '' "
          + "    THEN 1 ELSE 0 END) AS portfolio_complete_clients "
          + "FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "WHERE SNAPSHOT_DATE = ?";
  private static final String SEGMENT_SUMMARY_SQL =
      "SELECT SEGMENT_ID, "
          + "MAX(SEGMENT_LABEL) AS segment_label, "
          + "MAX(SEGMENT_RULE_TEXT) AS segment_rule_text, "
          + "MAX(RECOMMENDED_CARD) AS recommended_card, "
          + "MAX(RECOMMENDED_CARD_BENEFITS) AS recommended_card_benefits, "
          + "COUNT(*) AS clients, "
          + "NVL(SUM(CURRENT_BALANCE_AMOUNT), 0) AS total_balance, "
          + "NVL(AVG(CURRENT_BALANCE_AMOUNT), 0) AS average_balance, "
          + "NVL(AVG(TOTAL_TRANSACTIONS), 0) AS average_transactions, "
          + "NVL(AVG(TENURE_DAYS), 0) AS average_tenure_days, "
          + "SUM(CASE WHEN UPPER(NVL(MISSING_PRODUCTS_TEXT, ' ')) LIKE '%TARJETA%' "
          + "    THEN 1 ELSE 0 END) AS missing_credit_card_clients, "
          + "SUM(CASE WHEN TRIM(NVL(MISSING_PRODUCTS_TEXT, '')) = '' "
          + "    THEN 1 ELSE 0 END) AS portfolio_complete_clients "
          + "FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "WHERE SNAPSHOT_DATE = ? "
          + "GROUP BY SEGMENT_ID "
          + "ORDER BY clients DESC, total_balance DESC, SEGMENT_ID";
  private static final String TOP_STATES_SQL =
      "SELECT state_name, clients FROM ("
          + "  SELECT NVL(customer.STATE_NAME, 'Sin estado') AS state_name, "
          + "         COUNT(*) AS clients "
          + "  FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT snapshot "
          + "  JOIN DLK_CUSTOMER customer ON customer.REWARDS_ID = snapshot.REWARDS_ID "
          + "  WHERE snapshot.SNAPSHOT_DATE = ? AND snapshot.SEGMENT_ID = ? "
          + "  GROUP BY NVL(customer.STATE_NAME, 'Sin estado') "
          + "  ORDER BY COUNT(*) DESC, NVL(customer.STATE_NAME, 'Sin estado')"
          + ") WHERE ROWNUM <= 2";
  private static final String PRODUCT_ADOPTION_SQL =
      "SELECT product_code, clients FROM ("
          + "  SELECT product.PRODUCT_CODE AS product_code, "
          + "         COUNT(DISTINCT product.REWARDS_ID) AS clients "
          + "  FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT product "
          + "  WHERE product.SNAPSHOT_DATE = "
          + "      (SELECT MAX(SNAPSHOT_DATE) FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT) "
          + "    AND NVL(product.PRODUCT_ACTIVE_FLAG, 'Y') = 'Y' "
          + "    AND EXISTS ("
          + "      SELECT 1 "
          + "      FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT snapshot "
          + "      WHERE snapshot.SNAPSHOT_DATE = ? "
          + "        AND snapshot.SEGMENT_ID = ? "
          + "        AND snapshot.REWARDS_ID = product.REWARDS_ID"
          + "    ) "
          + "  GROUP BY product.PRODUCT_CODE "
          + "  ORDER BY COUNT(DISTINCT product.REWARDS_ID) DESC, product.PRODUCT_CODE"
          + ") WHERE ROWNUM <= 2";
  private static final String MISSING_PRODUCTS_SQL =
      "SELECT MISSING_PRODUCTS_TEXT "
          + "FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "WHERE SNAPSHOT_DATE = ? AND SEGMENT_ID = ?";

  public OracleCustomerCategorizationDashboardRepository(String environment, String url,
      String user, String password) {
    super(environment, url, user, password);
  }

  OracleCustomerCategorizationDashboardRepository(String environment, String url, String user,
      String password, OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public CustomerCategorizationDashboard getDashboard() {
    try (Connection connection = openConnection()) {
      Date latestSnapshotDate = resolveLatestSnapshotDate(connection);
      if (latestSnapshotDate == null) {
        return emptyDashboard();
      }
      DashboardAggregate aggregate = loadDashboardAggregate(connection, latestSnapshotDate);
      List<CustomerSegmentSummary> segmentSummary =
          loadSegmentSummary(connection, latestSnapshotDate, aggregate.totalClients);
      Map<String, Double> kpis = buildKpis(aggregate, segmentSummary);
      return new CustomerCategorizationDashboard(
          "customer-categorization-dashboard-oracle",
          getEnvironment(),
          SOURCE_MODE,
          buildExecutiveSummary(aggregate, segmentSummary),
          new Timestamp(latestSnapshotDate.getTime()).toInstant(),
          kpis,
          segmentSummary);
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer categorization dashboard", exception);
    }
  }

  private CustomerCategorizationDashboard emptyDashboard() {
    return new CustomerCategorizationDashboard(
        "customer-categorization-dashboard-oracle",
        getEnvironment(),
        SOURCE_MODE,
        "Oracle no devolvio clientes categorizados para el dashboard institucional.",
        Instant.now(),
        buildKpis(new DashboardAggregate(0, 0, 0, 0, 0, 0), Collections.<CustomerSegmentSummary>emptyList()),
        Collections.<CustomerSegmentSummary>emptyList());
  }

  private Date resolveLatestSnapshotDate(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(LATEST_SNAPSHOT_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      return resultSet.next() ? resultSet.getDate("snapshot_date") : null;
    }
  }

  private DashboardAggregate loadDashboardAggregate(Connection connection, Date snapshotDate)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(GLOBAL_KPI_SQL)) {
      statement.setDate(1, snapshotDate);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return new DashboardAggregate(0, 0, 0, 0, 0, 0);
        }
        return new DashboardAggregate(
            resultSet.getInt("total_clients"),
            resultSet.getDouble("total_balance"),
            resultSet.getDouble("average_balance"),
            resultSet.getDouble("average_abonos"),
            resultSet.getDouble("average_cargos"),
            resultSet.getInt("credit_card_opportunity_clients"),
            resultSet.getInt("portfolio_complete_clients"));
      }
    }
  }

  private List<CustomerSegmentSummary> loadSegmentSummary(Connection connection, Date snapshotDate,
      int totalClients) throws SQLException {
    List<CustomerSegmentSummary> segments = new ArrayList<CustomerSegmentSummary>();
    try (PreparedStatement statement = connection.prepareStatement(SEGMENT_SUMMARY_SQL)) {
      statement.setDate(1, snapshotDate);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          String segmentId = resultSet.getString("SEGMENT_ID");
          int clients = resultSet.getInt("clients");
          segments.add(new CustomerSegmentSummary(
              segmentId,
              hasText(resultSet.getString("segment_label"))
                  ? resultSet.getString("segment_label")
                  : normalizeSegmentLabel(segmentId),
              resultSet.getString("segment_rule_text"),
              resultSet.getString("recommended_card"),
              resultSet.getString("recommended_card_benefits"),
              clients,
              pct(clients, totalClients),
              round2(resultSet.getDouble("total_balance")),
              round2(resultSet.getDouble("average_balance")),
              round1(resultSet.getDouble("average_transactions")),
              round1(resultSet.getDouble("average_tenure_days")),
              resultSet.getInt("missing_credit_card_clients"),
              resultSet.getInt("portfolio_complete_clients"),
              loadTopStates(connection, snapshotDate, segmentId),
              loadProductAdoption(connection, snapshotDate, segmentId),
              loadMissingProducts(connection, snapshotDate, segmentId)));
        }
      }
    }
    return segments;
  }

  private List<Map<String, Object>> loadTopStates(Connection connection, Date snapshotDate,
      String segmentId) throws SQLException {
    List<Map<String, Object>> topStates = new ArrayList<Map<String, Object>>();
    try (PreparedStatement statement = connection.prepareStatement(TOP_STATES_SQL)) {
      statement.setDate(1, snapshotDate);
      statement.setString(2, segmentId);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          topStates.add(namedCount("stateName", resultSet.getString("state_name"),
              resultSet.getInt("clients")));
        }
      }
    }
    return topStates;
  }

  private List<Map<String, Object>> loadProductAdoption(Connection connection, Date snapshotDate,
      String segmentId) throws SQLException {
    List<Map<String, Object>> productAdoption = new ArrayList<Map<String, Object>>();
    try (PreparedStatement statement = connection.prepareStatement(PRODUCT_ADOPTION_SQL)) {
      statement.setDate(1, snapshotDate);
      statement.setString(2, segmentId);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          productAdoption.add(namedCount("code", resultSet.getString("product_code"),
              resultSet.getInt("clients")));
        }
      }
    }
    return productAdoption;
  }

  private List<Map<String, Object>> loadMissingProducts(Connection connection, Date snapshotDate,
      String segmentId) throws SQLException {
    Map<String, Integer> counters = new LinkedHashMap<String, Integer>();
    try (PreparedStatement statement = connection.prepareStatement(MISSING_PRODUCTS_SQL)) {
      statement.setDate(1, snapshotDate);
      statement.setString(2, segmentId);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          for (String missingProduct : splitCommaSeparatedValues(
              resultSet.getString("MISSING_PRODUCTS_TEXT"))) {
            String normalizedCode = normalizeProductCode(missingProduct);
            Integer currentValue = counters.get(normalizedCode);
            counters.put(normalizedCode, Integer.valueOf(
                currentValue == null ? 1 : currentValue.intValue() + 1));
          }
        }
      }
    }
    List<Map<String, Object>> missingProducts = new ArrayList<Map<String, Object>>();
    for (Map.Entry<String, Integer> entry : counters.entrySet()) {
      missingProducts.add(namedCount("code", entry.getKey(), entry.getValue().intValue()));
      if (missingProducts.size() == 2) {
        break;
      }
    }
    return missingProducts;
  }

  private Map<String, Double> buildKpis(DashboardAggregate aggregate,
      List<CustomerSegmentSummary> segmentSummary) {
    Map<String, Double> kpis = new LinkedHashMap<String, Double>();
    kpis.put("total_clients", Double.valueOf(aggregate.totalClients));
    kpis.put("total_balance", Double.valueOf(round2(aggregate.totalBalance)));
    kpis.put("average_balance", Double.valueOf(round2(aggregate.averageBalance)));
    kpis.put("average_abonos", Double.valueOf(round1(aggregate.averageAbonos)));
    kpis.put("average_cargos", Double.valueOf(round1(aggregate.averageCargos)));
    kpis.put("explorers_clients", Double.valueOf(resolveSegmentClients(segmentSummary, "Exploradores")));
    kpis.put("constructors_clients", Double.valueOf(resolveSegmentClients(segmentSummary, "Constructores")));
    kpis.put("premium_allies_clients", Double.valueOf(resolveSegmentClients(segmentSummary, "Aliados_Premium")));
    kpis.put("credit_card_opportunity_clients",
        Double.valueOf(aggregate.creditCardOpportunityClients));
    kpis.put("portfolio_complete_clients", Double.valueOf(aggregate.portfolioCompleteClients));
    return kpis;
  }

  private int resolveSegmentClients(List<CustomerSegmentSummary> segmentSummary, String segmentId) {
    for (CustomerSegmentSummary segment : segmentSummary) {
      if (segmentId.equals(segment.getSegmentId())) {
        return segment.getClients();
      }
    }
    return 0;
  }

  private String buildExecutiveSummary(DashboardAggregate aggregate,
      List<CustomerSegmentSummary> segmentSummary) {
    if (aggregate.totalClients <= 0 || segmentSummary.isEmpty()) {
      return "Oracle no devolvio clientes categorizados para el dashboard institucional.";
    }
    CustomerSegmentSummary dominantSegment = segmentSummary.get(0);
    return "Oracle analizo " + aggregate.totalClients + " clientes activos. "
        + dominantSegment.getSegmentLabel()
        + " es el segmento con mayor volumen y existen "
        + aggregate.creditCardOpportunityClients
        + " clientes con oportunidad clara de tarjeta de credito.";
  }

  private static final class DashboardAggregate {
    private final int totalClients;
    private final double totalBalance;
    private final double averageBalance;
    private final double averageAbonos;
    private final double averageCargos;
    private final int creditCardOpportunityClients;
    private final int portfolioCompleteClients;

    private DashboardAggregate(int totalClients, double totalBalance, double averageBalance,
        double averageAbonos, double averageCargos, int creditCardOpportunityClients) {
      this(totalClients, totalBalance, averageBalance, averageAbonos, averageCargos,
          creditCardOpportunityClients, 0);
    }

    private DashboardAggregate(int totalClients, double totalBalance, double averageBalance,
        double averageAbonos, double averageCargos, int creditCardOpportunityClients,
        int portfolioCompleteClients) {
      this.totalClients = totalClients;
      this.totalBalance = totalBalance;
      this.averageBalance = averageBalance;
      this.averageAbonos = averageAbonos;
      this.averageCargos = averageCargos;
      this.creditCardOpportunityClients = creditCardOpportunityClients;
      this.portfolioCompleteClients = portfolioCompleteClients;
    }
  }
}
