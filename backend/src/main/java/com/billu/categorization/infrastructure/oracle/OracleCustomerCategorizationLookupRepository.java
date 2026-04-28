package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import com.billu.foundation.domain.CsvContentBuilder;
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
          + "RECOMMENDED_CARD_BENEFITS, "
          + "CURRENT_BALANCE_AMOUNT, BALANCE_AVG_3M, TOTAL_TRANSACTIONS, "
          + "ABONOS_COUNT_30D, CARGOS_COUNT_30D, "
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
            buildFileName(rewardsId),
            buildCsv(Collections.<Map<String, Object>>emptyList()),
            Collections.<Map<String, Object>>emptyList());
      }
      List<Map<String, Object>> rows =
          Collections.<Map<String, Object>>singletonList(buildLookupRow(row));
      return new CustomerCategorizationLookupResult(
          getEnvironment(),
          rewardsId,
          1,
          "Se encontro 1 registro Oracle para el ID RECOMPENSAS consultado.",
          buildFileName(rewardsId),
          buildCsv(rows),
          rows);
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
        LookupRow row = new LookupRow(
            resultSet.getString("REWARDS_ID"),
            resultSet.getString("SEGMENT_ID"),
            hasText(resultSet.getString("SEGMENT_LABEL"))
                ? resultSet.getString("SEGMENT_LABEL")
                : normalizeSegmentLabel(resultSet.getString("SEGMENT_ID")),
            resultSet.getString("SEGMENT_RULE_TEXT"),
            resultSet.getString("RECOMMENDED_CARD"),
            trimToEmpty(resultSet.getString("RECOMMENDED_CARD_BENEFITS")),
            round2(resultSet.getDouble("CURRENT_BALANCE_AMOUNT")),
            round2(resultSet.getDouble("BALANCE_AVG_3M")),
            resultSet.getInt("TOTAL_TRANSACTIONS"),
            resultSet.getInt("ABONOS_COUNT_30D"),
            resultSet.getInt("CARGOS_COUNT_30D"),
            resultSet.getString("TRANSACTION_PROFILE"),
            resultSet.getInt("TENURE_DAYS"),
            trimToEmpty(resultSet.getString("MISSING_PRODUCTS_TEXT")),
            trimToEmpty(resultSet.getString("SUGGESTED_CAMPAIGN")),
            OracleCustomerCategorizationEnrichment.load(connection, rewardsId));
        row.campaign = OracleCustomerCategorizationEnrichment.buildCampaign(
            row.segmentLabel, row.recommendedCard, row.enrichment);
        return row;
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
    value.put("beneficiosTarjeta", row.recommendedCardBenefits);
    value.put("saldoPromedioHoy", Double.valueOf(row.currentBalanceAmount));
    value.put("saldoPromedio3Meses", Double.valueOf(row.balanceAvg3m));
    value.put("transaccionesTotales", Integer.valueOf(row.totalTransactions));
    value.put("abonos30d", Integer.valueOf(row.abonosCount30d));
    value.put("cargos30d", Integer.valueOf(row.cargosCount30d));
    value.put("perfilTransaccional", row.transactionProfile);
    value.put("antiguedadDias", Integer.valueOf(row.tenureDays));
    value.put("productosActivos", row.enrichment.productLabelsText());
    value.put("productosFaltantes", row.enrichment.missingProductLabelsText());
    value.put("campanaSugerida", row.campaign);
    value.put("genero", row.enrichment.genderCode());
    value.put("estado", row.enrichment.stateName());
    value.put("detalle", buildDetailRow(row));
    return value;
  }

  private Map<String, Object> buildDetailRow(LookupRow row) {
    return row.enrichment.toDetailMap(
        row.segmentId,
        row.segmentLabel,
        row.segmentRule,
        row.recommendedCard,
        row.recommendedCardBenefits,
        row.currentBalanceAmount,
        row.balanceAvg3m,
        row.totalTransactions,
        row.abonosCount30d,
        row.cargosCount30d,
        row.transactionProfile,
        row.tenureDays,
        row.campaign);
  }

  private String buildFileName(String rewardsId) {
    return "id_recompensas_" + trimToEmpty(rewardsId).toLowerCase() + ".csv";
  }

  private String buildCsv(List<Map<String, Object>> rows) {
    List<Map<String, Object>> detailRows = new ArrayList<Map<String, Object>>();
    for (Map<String, Object> row : rows) {
      Object detail = row.get("detalle");
      if (detail instanceof Map) {
        detailRows.add((Map<String, Object>) detail);
      }
    }
    String[] headers = new String[] {
        "ID_RECOMPENSAS",
        "NIVEL_CLIENTE_ID",
        "NIVEL_CLIENTE",
        "NIVEL_CLIENTE_REGLA",
        "TARJETA_RECOMENDADA",
        "TARJETA_BENEFICIOS",
        "SALDO_PROMEDIO_HOY",
        "SALDO_PROMEDIO_CATALOGO",
        "SALDO_PROMEDIO_3_MESES",
        "TRANSACCIONES_TOTALES",
        "ABONOS_30D",
        "CARGOS_30D",
        "PERFIL_TRANSACCIONAL",
        "ANTIGUEDAD_DIAS",
        "ESTATUS_DE_LA_CUENTA",
        "FECHA_APERTURA_CUENTA",
        "ESTADO",
        "GENERO",
        "PRODUCTOS_ACTIVOS",
        "PRODUCTOS_FALTANTES",
        "TIENE_CUENTA_N2",
        "TIENE_CUENTA_N4",
        "TIENE_AHORRO_PROGRAMADO",
        "TIENE_INVERSION_DIARIA",
        "TIENE_TARJETA_CREDITO",
        "SALDO_CUENTA_N2",
        "SALDO_CUENTA_N4",
        "SALDO_AHORRO_PROGRAMADO",
        "SALDO_INVERSION_DIARIA",
        "SALDO_TARJETA_CREDITO",
        "ESTATUS_CUENTA_BILLU",
        "TDC",
        "PRODUCTO_TDC",
        "ESTATUS_TDC",
        "TARJETA_FISICA",
        "TARJETA_DIGITAL",
        "ESTATUS_TARJETA",
        "TD_RECIENTE_FISICA",
        "TD_RECIENTE_DIGITAL",
        "DISENO_TARJETA",
        "FECHA_SOLICITUD_TARJETA",
        "FECHA_VENCIMIENTO_TARJETA",
        "FECHA_1ER_CARGO",
        "DIAS_1ER_CARGO",
        "MESES_1ER_CARGO",
        "SALDO_META_AHORRO",
        "FECHA_APERTURA_INVERSION",
        "CAMPANAS_ASIGNADAS",
        "CAMPANA_SUGERIDA"
    };
    return CsvContentBuilder.fromMaps(headers, detailRows);
  }

  private static final class LookupRow {
    private final String rewardsId;
    private final String segmentId;
    private final String segmentLabel;
    private final String segmentRule;
    private final String recommendedCard;
    private final String recommendedCardBenefits;
    private final double currentBalanceAmount;
    private final double balanceAvg3m;
    private final int totalTransactions;
    private final int abonosCount30d;
    private final int cargosCount30d;
    private final String transactionProfile;
    private final int tenureDays;
    private final String missingProductsText;
    private final String suggestedCampaign;
    private final OracleCustomerCategorizationEnrichment.Enrichment enrichment;
    private String campaign;

    private LookupRow(String rewardsId, String segmentId, String segmentLabel, String segmentRule,
        String recommendedCard, String recommendedCardBenefits, double currentBalanceAmount,
        double balanceAvg3m, int totalTransactions, int abonosCount30d, int cargosCount30d,
        String transactionProfile, int tenureDays, String missingProductsText,
        String suggestedCampaign, OracleCustomerCategorizationEnrichment.Enrichment enrichment) {
      this.rewardsId = rewardsId;
      this.segmentId = segmentId;
      this.segmentLabel = segmentLabel;
      this.segmentRule = segmentRule;
      this.recommendedCard = recommendedCard;
      this.recommendedCardBenefits = recommendedCardBenefits;
      this.currentBalanceAmount = currentBalanceAmount;
      this.balanceAvg3m = balanceAvg3m;
      this.totalTransactions = totalTransactions;
      this.abonosCount30d = abonosCount30d;
      this.cargosCount30d = cargosCount30d;
      this.transactionProfile = transactionProfile;
      this.tenureDays = tenureDays;
      this.missingProductsText = missingProductsText;
      this.suggestedCampaign = suggestedCampaign;
      this.enrichment = enrichment;
      this.campaign = suggestedCampaign;
    }
  }
}
