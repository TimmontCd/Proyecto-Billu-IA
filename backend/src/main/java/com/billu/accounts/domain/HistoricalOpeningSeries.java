package com.billu.accounts.domain;

public class HistoricalOpeningSeries {
  private String rangeStart;
  private String rangeEnd;
  private int totalAccounts;
  private double averagePerDay;
  private String peakLabel;

  public HistoricalOpeningSeries() {
  }

  public HistoricalOpeningSeries(String rangeStart, String rangeEnd, int totalAccounts,
      double averagePerDay, String peakLabel) {
    this.rangeStart = rangeStart;
    this.rangeEnd = rangeEnd;
    this.totalAccounts = totalAccounts;
    this.averagePerDay = averagePerDay;
    this.peakLabel = peakLabel;
  }

  public String getRangeStart() { return rangeStart; }
  public void setRangeStart(String rangeStart) { this.rangeStart = rangeStart; }
  public String getRangeEnd() { return rangeEnd; }
  public void setRangeEnd(String rangeEnd) { this.rangeEnd = rangeEnd; }
  public int getTotalAccounts() { return totalAccounts; }
  public void setTotalAccounts(int totalAccounts) { this.totalAccounts = totalAccounts; }
  public double getAveragePerDay() { return averagePerDay; }
  public void setAveragePerDay(double averagePerDay) { this.averagePerDay = averagePerDay; }
  public String getPeakLabel() { return peakLabel; }
  public void setPeakLabel(String peakLabel) { this.peakLabel = peakLabel; }
}
