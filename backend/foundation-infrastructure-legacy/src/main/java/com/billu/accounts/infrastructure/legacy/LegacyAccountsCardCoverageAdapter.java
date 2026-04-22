package com.billu.accounts.infrastructure.legacy;

import com.billu.accounts.application.AccountsCardCoverageGateway;
import com.billu.accounts.domain.CardCoverageSnapshot;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class LegacyAccountsCardCoverageAdapter implements AccountsCardCoverageGateway {
  @Override
  public CardCoverageSnapshot getCoverage() {
    return new CardCoverageSnapshot(
        "legacy-bridge",
        248,
        91,
        144,
        103,
        Arrays.<Map<String, Object>>asList(
            segment("ACTIVE_CARD", 188, 76.0),
            segment("DORMANT_CARD", 60, 24.0),
            segment("NO_CARD", 91, 100.0)),
        Instant.now());
  }

  private Map<String, Object> segment(String label, int accounts, double sharePct) {
    Map<String, Object> row = new LinkedHashMap<String, Object>();
    row.put("segment", label);
    row.put("accounts", Integer.valueOf(accounts));
    row.put("sharePct", Double.valueOf(sharePct));
    return row;
  }
}
