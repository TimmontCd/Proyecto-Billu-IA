package com.billu.categorization.infrastructure.mock;

import com.billu.categorization.domain.CustomerCategorizationDashboard;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;

public class MockCustomerCategorizationDashboardRepository {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public CustomerCategorizationDashboard loadDashboard() throws IOException {
    InputStream inputStream = getClass().getClassLoader()
        .getResourceAsStream("mock-datasets/customer-categorization-dashboard.json");
    if (inputStream == null) {
      throw new IOException("Missing mock dataset: customer-categorization-dashboard.json");
    }
    return objectMapper.readValue(inputStream, CustomerCategorizationDashboard.class);
  }
}
