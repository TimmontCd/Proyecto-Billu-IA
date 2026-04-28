package com.billu.foundation.infrastructure.mock;

import com.billu.foundation.domain.MockDataset;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;

public class MockDatasetRepository {
  private final ObjectMapper objectMapper = new ObjectMapper();

  public MockDataset findByDatasetKey(String datasetKey) throws IOException {
    InputStream inputStream = getClass().getClassLoader()
        .getResourceAsStream("mock-datasets/" + datasetKey + ".json");
    if (inputStream == null) {
      return null;
    }
    return objectMapper.readValue(inputStream, MockDataset.class);
  }
}
