package com.billu.categorization.infrastructure.mock;

import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import java.io.IOException;

public class MockCustomerCategorizationLookupGateway implements CustomerCategorizationLookupGateway {
  private final MockCustomerCategorizationLookupRepository lookupRepository;

  public MockCustomerCategorizationLookupGateway(
      MockCustomerCategorizationLookupRepository lookupRepository) {
    this.lookupRepository = lookupRepository;
  }

  @Override
  public CustomerCategorizationLookupResult findByRewardsId(String rewardsId) {
    try {
      CustomerCategorizationLookupResult result = lookupRepository.loadLookupResult();
      if (rewardsId.equalsIgnoreCase(result.getRewardsId())) {
        return result;
      }
      throw new IllegalArgumentException(
          "No se encontro informacion para el ID RECOMPENSAS capturado.");
    } catch (IOException exception) {
      throw new IllegalStateException(
          "Unable to load customer categorization lookup mock dataset", exception);
    }
  }
}
