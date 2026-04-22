package com.billu.accounts.domain;

public class AccountsExportResult {
  private String exportType;
  private String outcome;
  private String fileName;
  private int rowCount;
  private String correlationId;
  private String summary;

  public AccountsExportResult() {
  }

  public AccountsExportResult(String exportType, String outcome, String fileName, int rowCount,
      String correlationId, String summary) {
    this.exportType = exportType;
    this.outcome = outcome;
    this.fileName = fileName;
    this.rowCount = rowCount;
    this.correlationId = correlationId;
    this.summary = summary;
  }

  public String getExportType() { return exportType; }
  public void setExportType(String exportType) { this.exportType = exportType; }
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
