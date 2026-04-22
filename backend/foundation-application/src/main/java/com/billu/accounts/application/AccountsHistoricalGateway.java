package com.billu.accounts.application;

import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;

public interface AccountsHistoricalGateway {
  CustomerSummaryHistoricalView getHistorical(String startDate, String endDate);
  CustomerSummaryFirst30View getFirst30();
}
