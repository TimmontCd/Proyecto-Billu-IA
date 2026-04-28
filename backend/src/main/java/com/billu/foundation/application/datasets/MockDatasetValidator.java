package com.billu.foundation.application.datasets;

import com.billu.foundation.domain.MockDataset;
import java.util.List;

public class MockDatasetValidator {
  public void validate(MockDataset mockDataset) {
    if (mockDataset == null) {
      throw new IllegalArgumentException("Mock dataset is required");
    }
    if (isBlank(mockDataset.getDatasetKey())) {
      throw new IllegalArgumentException("Mock dataset key is required");
    }
    if (isBlank(mockDataset.getVersion())) {
      throw new IllegalArgumentException("Mock dataset version is required");
    }
    if (isBlank(mockDataset.getSourceFormat())) {
      throw new IllegalArgumentException("Mock dataset source format is required");
    }
    if (isBlank(mockDataset.getOwner())) {
      throw new IllegalArgumentException("Mock dataset owner is required");
    }
    if (isBlank(mockDataset.getConsistencyLevel())) {
      throw new IllegalArgumentException("Mock dataset consistency level is required");
    }
    if (isBlank(mockDataset.getStatus())) {
      throw new IllegalArgumentException("Mock dataset status is required");
    }
    List<String> contracts = mockDataset.getSupportedContracts();
    if (contracts == null || contracts.isEmpty()) {
      throw new IllegalArgumentException("Mock dataset must expose at least one supported contract");
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }
}
