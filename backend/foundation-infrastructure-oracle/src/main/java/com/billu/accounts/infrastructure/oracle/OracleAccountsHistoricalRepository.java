package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsHistoricalGateway;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;

public class OracleAccountsHistoricalRepository implements AccountsHistoricalGateway {
  @Override
  public CustomerSummaryHistoricalView getHistorical(String startDate, String endDate) {
    throw new IllegalStateException("Oracle customer summary historical projection is not implemented yet.");
  }

  @Override
  public CustomerSummaryFirst30View getFirst30() {
    throw new IllegalStateException("Oracle customer summary First30 projection is not implemented yet.");
  }
}
