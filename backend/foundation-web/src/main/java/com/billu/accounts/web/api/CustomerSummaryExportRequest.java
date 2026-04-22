package com.billu.accounts.web.api;

public class CustomerSummaryExportRequest {
  private Integer selectedYear;
  private Integer selectedMonth;

  public CustomerSummaryExportRequest() {
  }

  public CustomerSummaryExportRequest(Integer selectedYear, Integer selectedMonth) {
    this.selectedYear = selectedYear;
    this.selectedMonth = selectedMonth;
  }

  public Integer getSelectedYear() { return selectedYear; }
  public void setSelectedYear(Integer selectedYear) { this.selectedYear = selectedYear; }
  public Integer getSelectedMonth() { return selectedMonth; }
  public void setSelectedMonth(Integer selectedMonth) { this.selectedMonth = selectedMonth; }
}
