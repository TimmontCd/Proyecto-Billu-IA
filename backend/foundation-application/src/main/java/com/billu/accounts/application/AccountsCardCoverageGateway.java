package com.billu.accounts.application;

import com.billu.accounts.domain.CardCoverageSnapshot;

public interface AccountsCardCoverageGateway {
  CardCoverageSnapshot getCoverage();
}
