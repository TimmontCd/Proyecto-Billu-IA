package com.billu.accounts.web.api;

public class CustomerSummaryExportResponse {
  private final String exportType;
  private final String outcome;
  private final String fileName;
  private final int rowCount;
  private final String correlationId;
  private final String summary;

  public CustomerSummaryExportResponse(String exportType, String outcome, String fileName, int rowCount,
      String correlationId, String summary) {
    this.exportType = exportType;
    this.outcome = outcome;
    this.fileName = fileName;
    this.rowCount = rowCount;
    this.correlationId = correlationId;
    this.summary = summary;
  }

  public String getExportType() { return exportType; }
  public String getOutcome() { return outcome; }
  public String getFileName() { return fileName; }
  public int getRowCount() { return rowCount; }
  public String getCorrelationId() { return correlationId; }
  public String getSummary() { return summary; }
}
