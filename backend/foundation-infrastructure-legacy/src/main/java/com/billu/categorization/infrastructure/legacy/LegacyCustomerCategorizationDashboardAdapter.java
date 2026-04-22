package com.billu.categorization.infrastructure.legacy;

import com.billu.categorization.application.CustomerCategorizationDashboardGateway;
import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.billu.categorization.domain.CustomerSegmentSummary;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class LegacyCustomerCategorizationDashboardAdapter
    implements CustomerCategorizationDashboardGateway {
  @Override
  public CustomerCategorizationDashboard getDashboard() {
    Map<String, Double> kpis = new LinkedHashMap<String, Double>();
    kpis.put("total_clients", Double.valueOf(1842));
    kpis.put("total_balance", Double.valueOf(28500432.55));
    kpis.put("average_balance", Double.valueOf(15472.55));
    kpis.put("average_abonos", Double.valueOf(3.6));
    kpis.put("average_cargos", Double.valueOf(4.1));
    kpis.put("explorers_clients", Double.valueOf(412));
    kpis.put("constructors_clients", Double.valueOf(978));
    kpis.put("premium_allies_clients", Double.valueOf(452));
    kpis.put("credit_card_opportunity_clients", Double.valueOf(621));
    kpis.put("portfolio_complete_clients", Double.valueOf(533));

    return new CustomerCategorizationDashboard(
        "legacy-customer-categorization-dashboard",
        "legacy-bridge",
        "LEGACY_READ_ONLY",
        "Segmentacion legado con saldo, transacciones y antiguedad para paridad inicial.",
        Instant.now(),
        kpis,
        Arrays.asList(
            buildSegment("Exploradores", "Exploradores",
                "saldo promedio 3 meses < 500, o hasta 2 transacciones, o antiguedad menor a 90 dias",
                "Tarjeta Billu Inicio", "Linea inicial y requisitos ligeros.", 412, 22.4,
                1542000.0, 3742.7, 1.4, 48.0, 355, 41),
            buildSegment("Constructores", "Constructores",
                "saldo promedio 3 meses entre 500 y 5000, con 3 a 9 transacciones y relacion activa estable",
                "Tarjeta Billu Crece", "Linea media y aceleradores por uso.", 978, 53.1,
                9543000.0, 9757.7, 5.8, 162.0, 221, 296),
            buildSegment("Aliados_Premium", "Aliados Premium",
                "saldo promedio 3 meses > 5000, o saldo >= 2000 con 10+ transacciones y antiguedad >= 180 dias",
                "Tarjeta Billu Aliados Premium", "Linea alta y recompensas superiores.", 452,
                24.5, 17416000.0, 38530.9, 12.7, 294.0, 45, 196)));
  }

  private CustomerSegmentSummary buildSegment(String segmentId, String segmentLabel, String rule,
      String recommendedCard, String recommendedCardBenefits, int clients, double sharePct,
      double totalBalance, double averageBalance, double averageTransactions,
      double averageTenureDays, int missingCreditCardClients, int portfolioCompleteClients) {
    return new CustomerSegmentSummary(
        segmentId,
        segmentLabel,
        rule,
        recommendedCard,
        recommendedCardBenefits,
        clients,
        sharePct,
        totalBalance,
        averageBalance,
        averageTransactions,
        averageTenureDays,
        missingCreditCardClients,
        portfolioCompleteClients,
        Arrays.<Map<String, Object>>asList(state("Nuevo Leon", clients / 4), state("CDMX", clients / 5)),
        Arrays.<Map<String, Object>>asList(product("CUENTA_N2", clients - 40), product("TARJETA_CREDITO", clients - missingCreditCardClients)),
        Arrays.<Map<String, Object>>asList(product("TARJETA_CREDITO", missingCreditCardClients), product("INVERSION_DIARIA", clients / 3)));
  }

  private Map<String, Object> state(String stateName, int clients) {
    Map<String, Object> row = new LinkedHashMap<String, Object>();
    row.put("stateName", stateName);
    row.put("clients", Integer.valueOf(clients));
    return row;
  }

  private Map<String, Object> product(String code, int clients) {
    Map<String, Object> row = new LinkedHashMap<String, Object>();
    row.put("code", code);
    row.put("clients", Integer.valueOf(clients));
    return row;
  }
}
