package com.billu.accounts.infrastructure.mock;

import com.billu.accounts.domain.CardCoverageSnapshot;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;

public class MockAccountsCardCoverageRepository {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public CardCoverageSnapshot loadCoverage() throws IOException {
    InputStream inputStream = getClass().getClassLoader()
        .getResourceAsStream("mock-datasets/customer-summary-card-coverage.json");
    if (inputStream == null) {
      throw new IOException("Missing mock dataset: customer-summary-card-coverage.json");
    }
    return objectMapper.readValue(inputStream, CardCoverageSnapshot.class);
  }
}
