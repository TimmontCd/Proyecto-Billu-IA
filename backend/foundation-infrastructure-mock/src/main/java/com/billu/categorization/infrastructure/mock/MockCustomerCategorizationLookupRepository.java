package com.billu.categorization.infrastructure.mock;

import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;

public class MockCustomerCategorizationLookupRepository {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public CustomerCategorizationLookupResult loadLookupResult() throws IOException {
    InputStream inputStream = getClass().getClassLoader()
        .getResourceAsStream("mock-datasets/customer-categorization-rewards-detail.json");
    if (inputStream == null) {
      throw new IOException("Missing mock dataset: customer-categorization-rewards-detail.json");
    }
    return objectMapper.readValue(inputStream, CustomerCategorizationLookupResult.class);
  }
}
