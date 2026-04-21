package com.billu.foundation.infrastructure.mock;

import com.billu.foundation.domain.MockDataset;
import java.io.IOException;

public class MockDatasetLoader {
  private final MockDatasetRepository repository;

  public MockDatasetLoader(MockDatasetRepository repository) {
    this.repository = repository;
  }

  public MockDataset load(String datasetKey) throws IOException {
    return repository.findByDatasetKey(datasetKey);
  }
}
