package com.billu.accounts.application;

import com.billu.accounts.domain.CustomerAccountSummary;

public interface AccountsSummaryGateway {
  CustomerAccountSummary getOverview();
}
