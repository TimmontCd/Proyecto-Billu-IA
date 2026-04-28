package com.billu.foundation.domain;

import java.util.List;

public class MockDataset {
  private String datasetKey;
  private String version;
  private List<String> supportedContracts;
  private String sourceFormat;
  private String owner;
  private String consistencyLevel;
  private String status;

  public MockDataset() {
  }

  public MockDataset(String datasetKey, String version, List<String> supportedContracts,
      String sourceFormat, String owner, String consistencyLevel, String status) {
    this.datasetKey = datasetKey;
    this.version = version;
    this.supportedContracts = supportedContracts;
    this.sourceFormat = sourceFormat;
    this.owner = owner;
    this.consistencyLevel = consistencyLevel;
    this.status = status;
  }

  public String getDatasetKey() { return datasetKey; }
  public String getVersion() { return version; }
  public List<String> getSupportedContracts() { return supportedContracts; }
  public String getSourceFormat() { return sourceFormat; }
  public String getOwner() { return owner; }
  public String getConsistencyLevel() { return consistencyLevel; }
  public String getStatus() { return status; }
}
