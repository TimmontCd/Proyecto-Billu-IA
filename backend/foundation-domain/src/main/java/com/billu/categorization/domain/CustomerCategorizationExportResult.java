package com.billu.categorization.domain;

public class CustomerCategorizationExportResult {
  private String exportType;
  private String segmentId;
  private String segmentLabel;
  private String outcome;
  private String fileName;
  private int rowCount;
  private String correlationId;
  private String summary;

  public CustomerCategorizationExportResult() {
  }

  public CustomerCategorizationExportResult(String exportType, String segmentId,
      String segmentLabel, String outcome, String fileName, int rowCount,
      String correlationId, String summary) {
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
  public void setExportType(String exportType) { this.exportType = exportType; }
  public String getSegmentId() { return segmentId; }
  public void setSegmentId(String segmentId) { this.segmentId = segmentId; }
  public String getSegmentLabel() { return segmentLabel; }
  public void setSegmentLabel(String segmentLabel) { this.segmentLabel = segmentLabel; }
  public String getOutcome() { return outcome; }
  public void setOutcome(String outcome) { this.outcome = outcome; }
  public String getFileName() { return fileName; }
  public void setFileName(String fileName) { this.fileName = fileName; }
  public int getRowCount() { return rowCount; }
  public void setRowCount(int rowCount) { this.rowCount = rowCount; }
  public String getCorrelationId() { return correlationId; }
  public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
  public String getSummary() { return summary; }
  public void setSummary(String summary) { this.summary = summary; }
}
