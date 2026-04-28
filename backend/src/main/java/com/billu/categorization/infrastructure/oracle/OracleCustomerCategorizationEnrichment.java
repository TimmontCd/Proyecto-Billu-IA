package com.billu.categorization.infrastructure.oracle;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class OracleCustomerCategorizationEnrichment {
  static final String CUENTA_N2 = "CUENTA_N2";
  static final String CUENTA_N4 = "CUENTA_N4";
  static final String AHORRO_PROGRAMADO = "AHORRO_PROGRAMADO";
  static final String INVERSION_DIARIA = "INVERSION_DIARIA";
  static final String TARJETA_CREDITO = "TARJETA_CREDITO";

  private static final String CUSTOMER_SQL =
      "SELECT ACCOUNT_STATUS, OPENING_DATE, STATE_NAME, GENDER_CODE, "
          + "CURRENT_AVG_BALANCE_AMOUNT "
          + "FROM DLK_CUSTOMER "
          + "WHERE REWARDS_ID = ?";
  private static final String PRODUCTS_SQL =
      "SELECT PRODUCT_CODE, PRODUCT_LABEL, PRODUCT_BALANCE_AMOUNT "
          + "FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT "
          + "WHERE REWARDS_ID = ? "
          + "  AND SNAPSHOT_DATE = ("
          + "    SELECT MAX(SNAPSHOT_DATE) "
          + "    FROM DLK_CUSTOMER_PRODUCT_SNAPSHOT "
          + "    WHERE REWARDS_ID = ?"
          + "  ) "
          + "  AND NVL(PRODUCT_ACTIVE_FLAG, 'Y') = 'Y'";
  private static final String SAVINGS_SQL =
      "SELECT CURRENT_BALANCE_AMOUNT, INVESTMENT_OPENING_DATE "
          + "FROM DLK_SAVINGS_GOAL "
          + "WHERE REWARDS_ID = ? "
          + "  AND SNAPSHOT_DATE = ("
          + "    SELECT MAX(SNAPSHOT_DATE) FROM DLK_SAVINGS_GOAL WHERE REWARDS_ID = ?"
          + "  )";
  private static final String TDC_SQL =
      "SELECT BILLU_ACCOUNT_STATUS, TDC_FLAG, TDC_PRODUCT_LABEL, TDC_STATUS "
          + "FROM DLK_CREDIT_CARD_ACCOUNT "
          + "WHERE REWARDS_ID = ? "
          + "  AND SNAPSHOT_DATE = ("
          + "    SELECT MAX(SNAPSHOT_DATE) FROM DLK_CREDIT_CARD_ACCOUNT WHERE REWARDS_ID = ?"
          + "  )";
  private static final String CARD_SQL =
      "SELECT HAS_PHYSICAL_CARD_FLAG, HAS_DIGITAL_CARD_FLAG, CARD_STATUS, "
          + "HAS_RECENT_PHYSICAL_USAGE_FLAG, HAS_RECENT_DIGITAL_USAGE_FLAG, "
          + "CARD_DESIGN_LABEL, CARD_REQUEST_DATE, CARD_EXPIRATION_DATE, "
          + "FIRST_CHARGE_DATE, DAYS_TO_FIRST_CHARGE, MONTHS_TO_FIRST_CHARGE "
          + "FROM DLK_CARD_STATUS "
          + "WHERE REWARDS_ID = ? "
          + "  AND CUT_DATE = ("
          + "    SELECT MAX(CUT_DATE) FROM DLK_CARD_STATUS WHERE REWARDS_ID = ?"
          + "  )";
  private static final String CAMPAIGNS_SQL =
      "SELECT CAMPAIGN_CODE "
          + "FROM DLK_CAMPAIGN_CUSTOMER "
          + "WHERE REWARDS_ID = ? "
          + "ORDER BY CAMPAIGN_CODE";

  private OracleCustomerCategorizationEnrichment() {
  }

  static Enrichment load(Connection connection, String rewardsId) throws SQLException {
    Enrichment enrichment = new Enrichment(rewardsId);
    loadCustomer(connection, enrichment);
    loadProducts(connection, enrichment);
    loadSavingsGoal(connection, enrichment);
    loadCreditCardAccount(connection, enrichment);
    loadCardStatus(connection, enrichment);
    loadCampaigns(connection, enrichment);
    enrichment.rebuildDerivedProducts();
    return enrichment;
  }

  private static void loadCustomer(Connection connection, Enrichment enrichment)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(CUSTOMER_SQL)) {
      statement.setString(1, enrichment.rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          enrichment.accountStatus = trimToEmpty(resultSet.getString("ACCOUNT_STATUS"));
          enrichment.openingDate = resultSet.getDate("OPENING_DATE");
          enrichment.stateName = trimToEmpty(resultSet.getString("STATE_NAME"));
          enrichment.genderCode = trimToEmpty(resultSet.getString("GENDER_CODE"));
          enrichment.currentAvgBalanceAmount = resultSet.getDouble("CURRENT_AVG_BALANCE_AMOUNT");
        }
      }
    }
  }

  private static void loadProducts(Connection connection, Enrichment enrichment)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(PRODUCTS_SQL)) {
      statement.setString(1, enrichment.rewardsId);
      statement.setString(2, enrichment.rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          String code = trimToEmpty(resultSet.getString("PRODUCT_CODE"));
          String label = trimToEmpty(resultSet.getString("PRODUCT_LABEL"));
          String effectiveLabel = label.isEmpty() ? code : label;
          double balance = resultSet.getDouble("PRODUCT_BALANCE_AMOUNT");
          String productCode = classifyProduct(code, effectiveLabel);
          if (!productCode.isEmpty()) {
            enrichment.productFlags.put(productCode, Boolean.TRUE);
            enrichment.productBalances.put(productCode, Double.valueOf(
                getBalance(enrichment, productCode) + balance));
          }
          enrichment.addProductLabel(effectiveLabel);
        }
      }
    }
  }

  private static void loadSavingsGoal(Connection connection, Enrichment enrichment)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(SAVINGS_SQL)) {
      statement.setString(1, enrichment.rewardsId);
      statement.setString(2, enrichment.rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          enrichment.savingsGoalBalance = resultSet.getDouble("CURRENT_BALANCE_AMOUNT");
          enrichment.investmentOpeningDate = resultSet.getDate("INVESTMENT_OPENING_DATE");
          if (enrichment.savingsGoalBalance > 0 || enrichment.investmentOpeningDate != null) {
            enrichment.productFlags.put(INVERSION_DIARIA, Boolean.TRUE);
            enrichment.productBalances.put(INVERSION_DIARIA,
                Double.valueOf(enrichment.savingsGoalBalance));
            enrichment.addProductLabel(productLabel(INVERSION_DIARIA));
          }
        }
      }
    }
  }

  private static void loadCreditCardAccount(Connection connection, Enrichment enrichment)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(TDC_SQL)) {
      statement.setString(1, enrichment.rewardsId);
      statement.setString(2, enrichment.rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          enrichment.billuAccountStatus = trimToEmpty(resultSet.getString("BILLU_ACCOUNT_STATUS"));
          enrichment.tdcFlag = trimToEmpty(resultSet.getString("TDC_FLAG"));
          enrichment.tdcProductLabel = trimToEmpty(resultSet.getString("TDC_PRODUCT_LABEL"));
          enrichment.tdcStatus = trimToEmpty(resultSet.getString("TDC_STATUS"));
          if (isAffirmative(enrichment.tdcFlag) || isActiveStatus(enrichment.tdcStatus)
              || !enrichment.tdcProductLabel.isEmpty()) {
            enrichment.productFlags.put(TARJETA_CREDITO, Boolean.TRUE);
            enrichment.addProductLabel(enrichment.tdcProductLabel.isEmpty()
                ? productLabel(TARJETA_CREDITO)
                : enrichment.tdcProductLabel);
          }
        }
      }
    }
  }

  private static void loadCardStatus(Connection connection, Enrichment enrichment)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(CARD_SQL)) {
      statement.setString(1, enrichment.rewardsId);
      statement.setString(2, enrichment.rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          enrichment.physicalCardFlag = trimToEmpty(resultSet.getString("HAS_PHYSICAL_CARD_FLAG"));
          enrichment.digitalCardFlag = trimToEmpty(resultSet.getString("HAS_DIGITAL_CARD_FLAG"));
          enrichment.cardStatus = trimToEmpty(resultSet.getString("CARD_STATUS"));
          enrichment.recentPhysicalUsageFlag =
              trimToEmpty(resultSet.getString("HAS_RECENT_PHYSICAL_USAGE_FLAG"));
          enrichment.recentDigitalUsageFlag =
              trimToEmpty(resultSet.getString("HAS_RECENT_DIGITAL_USAGE_FLAG"));
          enrichment.cardDesignLabel = trimToEmpty(resultSet.getString("CARD_DESIGN_LABEL"));
          enrichment.cardRequestDate = resultSet.getDate("CARD_REQUEST_DATE");
          enrichment.cardExpirationDate = resultSet.getDate("CARD_EXPIRATION_DATE");
          enrichment.firstChargeDate = resultSet.getDate("FIRST_CHARGE_DATE");
          enrichment.daysToFirstCharge = resultSet.getString("DAYS_TO_FIRST_CHARGE");
          enrichment.monthsToFirstCharge = resultSet.getString("MONTHS_TO_FIRST_CHARGE");
        }
      }
    }
  }

  private static void loadCampaigns(Connection connection, Enrichment enrichment)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(CAMPAIGNS_SQL)) {
      statement.setString(1, enrichment.rewardsId);
      try (ResultSet resultSet = statement.executeQuery()) {
        while (resultSet.next()) {
          String campaignCode = trimToEmpty(resultSet.getString("CAMPAIGN_CODE"));
          if (!campaignCode.isEmpty()) {
            enrichment.assignedCampaigns.add(campaignCode);
          }
        }
      }
    }
  }

  static String buildCampaign(String segmentLabel, String recommendedCard,
      Enrichment enrichment) {
    String base;
    if (!enrichment.hasProduct(TARJETA_CREDITO)) {
      base = "Oferta " + trimToDefault(recommendedCard, "Tarjeta Billu");
    } else if (!enrichment.missingProductLabels.isEmpty()) {
      base = "Cross-sell " + join(enrichment.missingProductLabels, " + ");
    } else {
      base = "Fidelizacion " + trimToDefault(segmentLabel, "cliente");
    }
    if (!enrichment.assignedCampaigns.isEmpty()) {
      return base + " / Campana asignada: " + join(enrichment.assignedCampaigns, ", ");
    }
    return base;
  }

  private static String classifyProduct(String rawCode, String rawLabel) {
    String value = normalize(rawCode + " " + rawLabel);
    if (value.contains("N4")) {
      return CUENTA_N4;
    }
    if (value.contains("AHORRO_PROGRAMADO")) {
      return AHORRO_PROGRAMADO;
    }
    if (value.contains("INVERSION") || value.contains("INVESTMENT")) {
      return INVERSION_DIARIA;
    }
    if (value.contains("CREDIT") || value.contains("TDC") || value.contains("TARJETA")) {
      return TARJETA_CREDITO;
    }
    if (value.contains("N2") || value.contains("SAVINGS") || value.contains("BASIC")
        || value.contains("AHORRO") || value.contains("CUENTA")) {
      return CUENTA_N2;
    }
    return "";
  }

  private static boolean isAffirmative(String value) {
    String normalized = normalize(value);
    return "SI".equals(normalized) || "S".equals(normalized) || "Y".equals(normalized)
        || "YES".equals(normalized) || "TRUE".equals(normalized) || "1".equals(normalized);
  }

  private static boolean isActiveStatus(String value) {
    String normalized = normalize(value);
    return "ACTIVE".equals(normalized) || "ACTIVA".equals(normalized)
        || "A_ACTIVA".equals(normalized);
  }

  private static String normalize(String value) {
    String normalized = trimToEmpty(value);
    if (normalized.isEmpty()) {
      return "";
    }
    String ascii = Normalizer.normalize(normalized, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "");
    return ascii.toUpperCase(Locale.US).replaceAll("[^A-Z0-9]+", "_")
        .replaceAll("^_+", "").replaceAll("_+$", "");
  }

  private static double getBalance(Enrichment enrichment, String productCode) {
    Double value = enrichment.productBalances.get(productCode);
    return value == null ? 0.0d : value.doubleValue();
  }

  static String productLabel(String productCode) {
    if (CUENTA_N2.equals(productCode)) {
      return "Cuenta nivel 2";
    }
    if (CUENTA_N4.equals(productCode)) {
      return "Cuenta nivel 4";
    }
    if (AHORRO_PROGRAMADO.equals(productCode)) {
      return "Ahorro programado";
    }
    if (INVERSION_DIARIA.equals(productCode)) {
      return "Inversion diaria";
    }
    if (TARJETA_CREDITO.equals(productCode)) {
      return "Tarjeta de credito";
    }
    return productCode;
  }

  private static String trimToDefault(String value, String fallback) {
    String trimmed = trimToEmpty(value);
    return trimmed.isEmpty() ? fallback : trimmed;
  }

  static String join(List<String> values, String separator) {
    StringBuilder builder = new StringBuilder();
    for (String value : values) {
      if (builder.length() > 0) {
        builder.append(separator);
      }
      builder.append(value);
    }
    return builder.toString();
  }

  private static String trimToEmpty(String value) {
    return value == null ? "" : value.trim();
  }

  private static String yesNo(boolean value) {
    return value ? "SI" : "NO";
  }

  private static String dateText(Date value) {
    return value == null ? "" : value.toString();
  }

  static final class Enrichment {
    private final String rewardsId;
    private String accountStatus = "";
    private Date openingDate;
    private String stateName = "";
    private String genderCode = "";
    private double currentAvgBalanceAmount;
    private double savingsGoalBalance;
    private Date investmentOpeningDate;
    private String billuAccountStatus = "";
    private String tdcFlag = "";
    private String tdcProductLabel = "";
    private String tdcStatus = "";
    private String physicalCardFlag = "";
    private String digitalCardFlag = "";
    private String cardStatus = "";
    private String recentPhysicalUsageFlag = "";
    private String recentDigitalUsageFlag = "";
    private String cardDesignLabel = "";
    private Date cardRequestDate;
    private Date cardExpirationDate;
    private Date firstChargeDate;
    private String daysToFirstCharge = "";
    private String monthsToFirstCharge = "";
    private final Map<String, Boolean> productFlags = new LinkedHashMap<String, Boolean>();
    private final Map<String, Double> productBalances = new LinkedHashMap<String, Double>();
    private final List<String> productLabels = new ArrayList<String>();
    private final List<String> missingProductLabels = new ArrayList<String>();
    private final List<String> assignedCampaigns = new ArrayList<String>();

    private Enrichment(String rewardsId) {
      this.rewardsId = rewardsId;
      productFlags.put(CUENTA_N2, Boolean.FALSE);
      productFlags.put(CUENTA_N4, Boolean.FALSE);
      productFlags.put(AHORRO_PROGRAMADO, Boolean.FALSE);
      productFlags.put(INVERSION_DIARIA, Boolean.FALSE);
      productFlags.put(TARJETA_CREDITO, Boolean.FALSE);
      productBalances.put(CUENTA_N2, Double.valueOf(0));
      productBalances.put(CUENTA_N4, Double.valueOf(0));
      productBalances.put(AHORRO_PROGRAMADO, Double.valueOf(0));
      productBalances.put(INVERSION_DIARIA, Double.valueOf(0));
      productBalances.put(TARJETA_CREDITO, Double.valueOf(0));
    }

    private void addProductLabel(String label) {
      String value = trimToEmpty(label);
      if (!value.isEmpty() && !productLabels.contains(value)) {
        productLabels.add(value);
      }
    }

    private void rebuildDerivedProducts() {
      missingProductLabels.clear();
      addMissingIfAbsent(CUENTA_N2);
      addMissingIfAbsent(CUENTA_N4);
      addMissingIfAbsent(AHORRO_PROGRAMADO);
      addMissingIfAbsent(INVERSION_DIARIA);
      addMissingIfAbsent(TARJETA_CREDITO);
    }

    private void addMissingIfAbsent(String productCode) {
      if (!hasProduct(productCode)) {
        missingProductLabels.add(productLabel(productCode));
      }
    }

    boolean hasProduct(String productCode) {
      return Boolean.TRUE.equals(productFlags.get(productCode));
    }

    String productLabelsText() {
      return join(productLabels, ", ");
    }

    String missingProductLabelsText() {
      return join(missingProductLabels, ", ");
    }

    String assignedCampaignsText() {
      return join(assignedCampaigns, ", ");
    }

    String genderCode() {
      return genderCode;
    }

    String stateName() {
      return stateName;
    }

    double productBalance(String productCode) {
      return getBalance(this, productCode);
    }

    Map<String, Object> toDetailMap(String segmentId, String segmentLabel, String segmentRule,
        String recommendedCard, String recommendedCardBenefits, double currentBalanceAmount,
        double balanceAvg3m, int totalTransactions, int abonosCount30d, int cargosCount30d,
        String transactionProfile, int tenureDays, String campaign) {
      Map<String, Object> detail = new LinkedHashMap<String, Object>();
      detail.put("ID_RECOMPENSAS", rewardsId);
      detail.put("ESTATUS_DE_LA_CUENTA", accountStatus);
      detail.put("FECHA_APERTURA_CUENTA", dateText(openingDate));
      detail.put("ANTIGUEDAD_DIAS", Integer.valueOf(tenureDays));
      detail.put("ESTADO", stateName);
      detail.put("GENERO", genderCode);
      detail.put("SALDO_PROMEDIO_HOY", Double.valueOf(currentBalanceAmount));
      detail.put("SALDO_PROMEDIO_CATALOGO", Double.valueOf(currentAvgBalanceAmount));
      detail.put("SALDO_PROMEDIO_3_MESES", Double.valueOf(balanceAvg3m));
      detail.put("NIVEL_CLIENTE_ID", segmentId);
      detail.put("NIVEL_CLIENTE", segmentLabel);
      detail.put("NIVEL_CLIENTE_REGLA", segmentRule);
      detail.put("REGLA_NIVEL", segmentRule);
      detail.put("TARJETA_RECOMENDADA", recommendedCard);
      detail.put("TARJETA_BENEFICIOS", recommendedCardBenefits);
      detail.put("TRANSACCIONES_TOTALES", Integer.valueOf(totalTransactions));
      detail.put("PERFIL_TRANSACCIONAL", transactionProfile);
      detail.put("ABONOS_30D", Integer.valueOf(abonosCount30d));
      detail.put("CARGOS_30D", Integer.valueOf(cargosCount30d));
      detail.put("SALDO_CUENTA_N2", Double.valueOf(productBalance(CUENTA_N2)));
      detail.put("SALDO_CUENTA_N4", Double.valueOf(productBalance(CUENTA_N4)));
      detail.put("SALDO_AHORRO_PROGRAMADO", Double.valueOf(productBalance(AHORRO_PROGRAMADO)));
      detail.put("SALDO_INVERSION_DIARIA", Double.valueOf(productBalance(INVERSION_DIARIA)));
      detail.put("SALDO_TARJETA_CREDITO", Double.valueOf(productBalance(TARJETA_CREDITO)));
      detail.put("PRODUCTOS_ACTIVOS", productLabelsText());
      detail.put("PRODUCTOS_FALTANTES", missingProductLabelsText());
      detail.put("TIENE_CUENTA_N2", yesNo(hasProduct(CUENTA_N2)));
      detail.put("TIENE_CUENTA_N4", yesNo(hasProduct(CUENTA_N4)));
      detail.put("TIENE_AHORRO_PROGRAMADO", yesNo(hasProduct(AHORRO_PROGRAMADO)));
      detail.put("TIENE_INVERSION_DIARIA", yesNo(hasProduct(INVERSION_DIARIA)));
      detail.put("TIENE_TARJETA_CREDITO", yesNo(hasProduct(TARJETA_CREDITO)));
      detail.put("ESTATUS_CUENTA_BILLU", billuAccountStatus);
      detail.put("TDC", tdcFlag);
      detail.put("PRODUCTO_TDC", tdcProductLabel);
      detail.put("ESTATUS_TDC", tdcStatus);
      detail.put("TARJETA_FISICA", physicalCardFlag);
      detail.put("TARJETA_DIGITAL", digitalCardFlag);
      detail.put("ESTATUS_TARJETA", cardStatus);
      detail.put("TD_RECIENTE_FISICA", recentPhysicalUsageFlag);
      detail.put("TD_RECIENTE_DIGITAL", recentDigitalUsageFlag);
      detail.put("DISENO_TARJETA", cardDesignLabel);
      detail.put("FECHA_SOLICITUD_TARJETA", dateText(cardRequestDate));
      detail.put("FECHA_VENCIMIENTO_TARJETA", dateText(cardExpirationDate));
      detail.put("FECHA_1ER_CARGO", dateText(firstChargeDate));
      detail.put("DIAS_1ER_CARGO", daysToFirstCharge);
      detail.put("MESES_1ER_CARGO", monthsToFirstCharge);
      detail.put("SALDO_META_AHORRO", Double.valueOf(savingsGoalBalance));
      detail.put("FECHA_APERTURA_INVERSION", dateText(investmentOpeningDate));
      detail.put("CAMPANAS_ASIGNADAS", assignedCampaignsText());
      detail.put("CAMPANA_SUGERIDA", campaign);
      return detail;
    }
  }
}
