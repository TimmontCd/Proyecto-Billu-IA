package com.billu.foundation.application.datasets;

public class MockDatasetLoadCommand {
  private final String datasetKey;
  private final boolean resetBeforeLoad;

  public MockDatasetLoadCommand(String datasetKey, boolean resetBeforeLoad) {
    this.datasetKey = datasetKey;
    this.resetBeforeLoad = resetBeforeLoad;
  }

  public String getDatasetKey() { return datasetKey; }
  public boolean isResetBeforeLoad() { return resetBeforeLoad; }
}
