package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationExportRequest;
import com.billu.categorization.domain.CustomerCategorizationExportResult;

public interface CustomerCategorizationExportGateway {
  CustomerCategorizationExportResult exportData(CustomerCategorizationExportRequest request);
}
