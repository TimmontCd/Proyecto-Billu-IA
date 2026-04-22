package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;

public class OracleCustomerCategorizationLookupRepository
    implements CustomerCategorizationLookupGateway {
  @Override
  public CustomerCategorizationLookupResult findByRewardsId(String rewardsId) {
    throw new IllegalStateException(
        "Oracle customer categorization rewards lookup projection is not implemented yet.");
  }
}
