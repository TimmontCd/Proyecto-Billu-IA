package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationLookupResult;

public interface CustomerCategorizationLookupGateway {
  CustomerCategorizationLookupResult findByRewardsId(String rewardsId);
}
