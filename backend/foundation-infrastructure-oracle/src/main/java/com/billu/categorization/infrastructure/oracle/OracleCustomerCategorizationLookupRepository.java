package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OracleCustomerCategorizationLookupRepository
    extends OracleRepositorySupport implements CustomerCategorizationLookupGateway {
  private static final String LOOKUP_SQL =
      "SELECT REWARDS_ID, SEGMENT_ID, SEGMENT_LABEL, SEGMENT_RULE_TEXT, RECOMMENDED_CARD, "
          + "CURRENT_BALANCE_AMOUNT, BALANCE_AVG_3M, TOTAL_TRANSACTIONS, "
          + "TRANSACTION_PROFILE, TENURE_DAYS, MISSING_PRODUCTS_TEXT, SUGGESTED_CAMPAIGN "
          + "FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "WHERE REWARDS_ID = ? "
          + "  AND SNAPSHOT_DATE = ("
          + "    SELECT MAX(SNAPSHOT_DATE) "
          + "    FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "    WHERE REWARDS_ID = ?"
          + "  )";
  private static final String ACTIVE_PRODUCTS_SQL =
      "SELECT NVL(PRODUCT_LABEL, PRODUCT_CODE) AS product_label "
          + "FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT "
          + "WHERE REWARDS_ID = ? "
          + "  AND SNAPSHOT_DATE = ("
          + "    SELECT MAX(SNAPSHOT_DATE) "
          + "    FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT "
          + "    WHERE REWARDS_ID = ?"
          + "  ) "
          + "  AND NVL(PRODUCT_ACTIVE_FLAG, 'Y') = 'Y' "
          + "ORDER BY NVL(PRODUCT_LABEL, PRODUCT_CODE)";

  public OracleCustomerCategorizationLookupRepository(String environment, String url, String user,
      String password) {
    super(environment, url, user, password);
  }

  OracleCustomerCategorizationLookupRepository(String environment, String url, String user,
      String password, OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public CustomerCategorizationLookupResult findByRewardsId(String rewardsId) {
    try (Connection connection = openConnection()) {
      LookupRow row = loadLookupRow(connection, rewardsId);
      if (row == null) {
        return new CustomerCategorizationLookupResult(
            getEnvironment(),
            rewardsId,
            0,
            "No se encontraron registros Oracle para el ID RECOMPENSAS consultado.",
            Collections.<Map<String, Object>>emptyList());
      }
      return new CustomerCategorizationLookupResult(
          getEnvironment(),
          rewardsId,
          1,
          "Se encontro 1 registro Oracle para el ID RECOMPENSAS consultado.",
          Collections.<Map<String, Object>>singletonList(buildLookupRow(row)));
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer categorization rewards lookup", exception);
    }
  }

  private LookupRow loadLookupRow(Connection connection, String rewardsId) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(LOOKUP_SQL)) {
      statement.setString(1, rewardsId);
      statement.setString(2, rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return null;
        }
        return new LookupRow(
            resultSet.getString("REWARDS_ID"),
            resultSet.getString("SEGMENT_ID"),
            hasText(resultSet.getString("SEGMENT_LABEL"))
                ? resultSet.getString("SEGMENT_LABEL")
                : normalizeSegmentLabel(resultSet.getString("SEGMENT_ID")),
            resultSet.getString("SEGMENT_RULE_TEXT"),
            resultSet.getString("RECOMMENDED_CARD"),
            round2(resultSet.getDouble("CURRENT_BALANCE_AMOUNT")),
            round2(resultSet.getDouble("BALANCE_AVG_3M")),
            resultSet.getInt("TOTAL_TRANSACTIONS"),
            resultSet.getString("TRANSACTION_PROFILE"),
            resultSet.getInt("TENURE_DAYS"),
            trimToEmpty(resultSet.getString("MISSING_PRODUCTS_TEXT")),
            trimToEmpty(resultSet.getString("SUGGESTED_CAMPAIGN")),
            loadActiveProducts(connection, rewardsId));
      }
    }
  }

  private String loadActiveProducts(Connection connection, String rewardsId) throws SQLException {
    List<String> products = new ArrayList<String>();
    try (PreparedStatement statement = connection.prepareStatement(ACTIVE_PRODUCTS_SQL)) {
      statement.setString(1, rewardsId);
      statement.setString(2, rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          products.add(resultSet.getString("product_label"));
        }
      }
    }
    if (products.isEmpty()) {
      return "";
    }
    StringBuilder builder = new StringBuilder();
    for (int index = 0; index < products.size(); index++) {
      if (index > 0) {
        builder.append(", ");
      }
      builder.append(products.get(index));
    }
    return builder.toString();
  }

  private Map<String, Object> buildLookupRow(LookupRow row) {
    Map<String, Object> value = new LinkedHashMap<String, Object>();
    value.put("idRecompensas", row.rewardsId);
    value.put("nivelClienteId", row.segmentId);
    value.put("nivelCliente", row.segmentLabel);
    value.put("reglaNivel", row.segmentRule);
    value.put("tarjetaSugerida", row.recommendedCard);
    value.put("saldoPromedioHoy", Double.valueOf(row.currentBalanceAmount));
    value.put("saldoPromedio3Meses", Double.valueOf(row.balanceAvg3m));
    value.put("transaccionesTotales", Integer.valueOf(row.totalTransactions));
    value.put("perfilTransaccional", row.transactionProfile);
    value.put("antiguedadDias", Integer.valueOf(row.tenureDays));
    value.put("productosActivos", row.activeProducts);
    value.put("productosFaltantes", row.missingProductsText);
    value.put("campanaSugerida", row.suggestedCampaign);
    return value;
  }

  private static final class LookupRow {
    private final String rewardsId;
    private final String segmentId;
    private final String segmentLabel;
    private final String segmentRule;
    private final String recommendedCard;
    private final double currentBalanceAmount;
    private final double balanceAvg3m;
    private final int totalTransactions;
    private final String transactionProfile;
    private final int tenureDays;
    private final String missingProductsText;
    private final String suggestedCampaign;
    private final String activeProducts;

    private LookupRow(String rewardsId, String segmentId, String segmentLabel, String segmentRule,
        String recommendedCard, double currentBalanceAmount, double balanceAvg3m,
        int totalTransactions, String transactionProfile, int tenureDays,
        String missingProductsText, String suggestedCampaign, String activeProducts) {
      this.rewardsId = rewardsId;
      this.segmentId = segmentId;
      this.segmentLabel = segmentLabel;
      this.segmentRule = segmentRule;
      this.recommendedCard = recommendedCard;
      this.currentBalanceAmount = currentBalanceAmount;
      this.balanceAvg3m = balanceAvg3m;
      this.totalTransactions = totalTransactions;
      this.transactionProfile = transactionProfile;
      this.tenureDays = tenureDays;
      this.missingProductsText = missingProductsText;
      this.suggestedCampaign = suggestedCampaign;
      this.activeProducts = activeProducts;
    }
  }
}
