package com.billu.accounts.infrastructure.mock;

import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;

public class MockAccountsHistoricalRepository {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public CustomerSummaryHistoricalView loadHistorical() throws IOException {
    return read("mock-datasets/customer-summary-historical.json", CustomerSummaryHistoricalView.class);
  }

  public CustomerSummaryFirst30View loadFirst30() throws IOException {
    return read("mock-datasets/customer-summary-first30.json", CustomerSummaryFirst30View.class);
  }

  private <T> T read(String path, Class<T> targetType) throws IOException {
    InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path);
    if (inputStream == null) {
      throw new IOException("Missing mock dataset: " + path);
    }
    return objectMapper.readValue(inputStream, targetType);
  }
}
