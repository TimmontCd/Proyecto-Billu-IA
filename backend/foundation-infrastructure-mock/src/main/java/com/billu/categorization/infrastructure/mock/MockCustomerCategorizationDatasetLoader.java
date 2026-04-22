package com.billu.categorization.infrastructure.mock;

import com.billu.categorization.application.CustomerCategorizationDashboardGateway;
import com.billu.categorization.domain.CustomerCategorizationDashboard;
import java.io.IOException;

public class MockCustomerCategorizationDatasetLoader implements CustomerCategorizationDashboardGateway {
  private final MockCustomerCategorizationDashboardRepository dashboardRepository;

  public MockCustomerCategorizationDatasetLoader(
      MockCustomerCategorizationDashboardRepository dashboardRepository) {
    this.dashboardRepository = dashboardRepository;
  }

  @Override
  public CustomerCategorizationDashboard getDashboard() {
    try {
      return dashboardRepository.loadDashboard();
    } catch (IOException exception) {
      throw new IllegalStateException(
          "Unable to load customer categorization dashboard mock dataset", exception);
    }
  }
}
