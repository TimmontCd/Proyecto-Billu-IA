package com.billu.categorization.web.api;

public class CustomerCategorizationExportResponse {
  private final String exportType;
  private final String segmentId;
  private final String segmentLabel;
  private final String outcome;
  private final String fileName;
  private final int rowCount;
  private final String correlationId;
  private final String summary;

  public CustomerCategorizationExportResponse(String exportType, String segmentId,
      String segmentLabel, String outcome, String fileName, int rowCount, String correlationId,
      String summary) {
    this.exportType = exportType;
    this.segmentId = segmentId;
    this.segmentLabel = segmentLabel;
    this.outcome = outcome;
    this.fileName = fileName;
    this.rowCount = rowCount;
    this.correlationId = correlationId;
    this.summary = summary;
  }

  public String getExportType() { return exportType; }
  public String getSegmentId() { return segmentId; }
  public String getSegmentLabel() { return segmentLabel; }
  public String getOutcome() { return outcome; }
  public String getFileName() { return fileName; }
  public int getRowCount() { return rowCount; }
  public String getCorrelationId() { return correlationId; }
  public String getSummary() { return summary; }
}
