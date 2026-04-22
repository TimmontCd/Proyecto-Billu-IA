package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationDashboardGateway;
import com.billu.categorization.domain.CustomerCategorizationDashboard;

public class OracleCustomerCategorizationDashboardRepository
    implements CustomerCategorizationDashboardGateway {
  @Override
  public CustomerCategorizationDashboard getDashboard() {
    throw new IllegalStateException(
        "Oracle customer categorization dashboard projection is not implemented yet.");
  }
}
