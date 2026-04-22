package com.billu.accounts.infrastructure.mock;

import com.billu.accounts.domain.CustomerAccountSummary;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;

public class MockAccountsSummaryRepository {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public CustomerAccountSummary loadOverview() throws IOException {
    InputStream inputStream = getClass().getClassLoader()
        .getResourceAsStream("mock-datasets/customer-summary-overview.json");
    if (inputStream == null) {
      throw new IOException("Missing mock dataset: customer-summary-overview.json");
    }
    return objectMapper.readValue(inputStream, CustomerAccountSummary.class);
  }
}
