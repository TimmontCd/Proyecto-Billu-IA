package com.billu.categorization.web.api;

public class CustomerCategorizationExportRequest {
  private String segmentId;

  public CustomerCategorizationExportRequest() {
  }

  public CustomerCategorizationExportRequest(String segmentId) {
    this.segmentId = segmentId;
  }

  public String getSegmentId() { return segmentId; }
  public void setSegmentId(String segmentId) { this.segmentId = segmentId; }
}
