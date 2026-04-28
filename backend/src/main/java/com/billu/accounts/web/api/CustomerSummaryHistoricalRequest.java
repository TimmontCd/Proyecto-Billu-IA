package com.billu.accounts.web.api;

public class CustomerSummaryHistoricalRequest {
  private String startDate;
  private String endDate;

  public CustomerSummaryHistoricalRequest() {
  }

  public String getStartDate() { return startDate; }
  public void setStartDate(String startDate) { this.startDate = startDate; }
  public String getEndDate() { return endDate; }
  public void setEndDate(String endDate) { this.endDate = endDate; }
}
