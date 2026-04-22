package com.billu.foundation.infrastructure.mock;

import com.billu.foundation.application.datasets.MockDatasetValidator;
import com.billu.foundation.domain.MockDataset;
import java.io.IOException;

public class MockDatasetLoader {
  private final MockDatasetRepository repository;
  private final MockDatasetValidator mockDatasetValidator;

  public MockDatasetLoader(MockDatasetRepository repository) {
    this(repository, new MockDatasetValidator());
  }

  public MockDatasetLoader(MockDatasetRepository repository, MockDatasetValidator mockDatasetValidator) {
    this.repository = repository;
    this.mockDatasetValidator = mockDatasetValidator;
  }

  public MockDataset load(String datasetKey) throws IOException {
    MockDataset dataset = repository.findByDatasetKey(datasetKey);
    if (dataset != null) {
      mockDatasetValidator.validate(dataset);
    }
    return dataset;
  }
}
