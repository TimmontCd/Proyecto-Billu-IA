package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsCardCoverageGateway;
import com.billu.accounts.domain.CardCoverageSnapshot;

public class OracleAccountsCardCoverageRepository implements AccountsCardCoverageGateway {
  @Override
  public CardCoverageSnapshot getCoverage() {
    throw new IllegalStateException("Oracle customer summary card coverage projection is not implemented yet.");
  }
}
