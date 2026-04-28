package com.billu.accounts.infrastructure.legacy;

import com.billu.accounts.application.AccountsSummaryGateway;
import com.billu.accounts.domain.CustomerAccountSummary;
import com.billu.accounts.domain.ProductSummaryItem;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class LegacyAccountsSummaryAdapter implements AccountsSummaryGateway {
  @Override
  public CustomerAccountSummary getOverview() {
    Map<String, Double> kpis = new LinkedHashMap<String, Double>();
    kpis.put("total_accounts", Double.valueOf(1842));
    kpis.put("total_balance", Double.valueOf(28500432.55));
    kpis.put("active_accounts", Double.valueOf(1530));
    kpis.put("inactive_accounts", Double.valueOf(312));
    return new CustomerAccountSummary(
        "legacy-accounts-overview",
        "legacy-bridge",
        1842,
        28500432.55,
        1530,
        312,
        "Resumen ejecutivo legado de cuentas y productos para paridad inicial.",
        "LEGACY_READ_ONLY",
        Instant.now(),
        kpis,
        Arrays.asList(
            new ProductSummaryItem("CUENTA_N2", "Cuenta Billu N2", 790, 42.9, 10450000.0, "ACTIVE"),
            new ProductSummaryItem("CUENTA_N4", "Cuenta Billu Premium N4", 410, 22.2, 9350000.0, "ACTIVE"),
            new ProductSummaryItem("TARJETA_CREDITO", "Tarjeta de credito", 280, 15.2, 0.0, "ACTIVE")));
  }
}
