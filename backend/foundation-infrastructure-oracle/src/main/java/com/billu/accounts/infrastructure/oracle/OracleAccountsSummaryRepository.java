package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsSummaryGateway;
import com.billu.accounts.domain.CustomerAccountSummary;

public class OracleAccountsSummaryRepository implements AccountsSummaryGateway {
  @Override
  public CustomerAccountSummary getOverview() {
    throw new IllegalStateException("Oracle customer summary projection is not implemented yet.");
  }
}
