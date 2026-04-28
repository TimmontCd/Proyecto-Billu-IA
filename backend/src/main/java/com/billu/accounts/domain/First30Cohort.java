package com.billu.accounts.domain;

public class First30Cohort {
  private int cohortYear;
  private int cohortMonth;
  private int openingAccounts;
  private int qualifiedAccounts;
  private int transactionalAccounts;
  private double qualifiedPct;
  private String status;

  public First30Cohort() {
  }

  public First30Cohort(int cohortYear, int cohortMonth, int openingAccounts,
      int qualifiedAccounts, int transactionalAccounts, double qualifiedPct, String status) {
    this.cohortYear = cohortYear;
    this.cohortMonth = cohortMonth;
    this.openingAccounts = openingAccounts;
    this.qualifiedAccounts = qualifiedAccounts;
    this.transactionalAccounts = transactionalAccounts;
    this.qualifiedPct = qualifiedPct;
    this.status = status;
  }

  public int getCohortYear() { return cohortYear; }
  public void setCohortYear(int cohortYear) { this.cohortYear = cohortYear; }
  public int getCohortMonth() { return cohortMonth; }
  public void setCohortMonth(int cohortMonth) { this.cohortMonth = cohortMonth; }
  public int getOpeningAccounts() { return openingAccounts; }
  public void setOpeningAccounts(int openingAccounts) { this.openingAccounts = openingAccounts; }
  public int getQualifiedAccounts() { return qualifiedAccounts; }
  public void setQualifiedAccounts(int qualifiedAccounts) { this.qualifiedAccounts = qualifiedAccounts; }
  public int getTransactionalAccounts() { return transactionalAccounts; }
  public void setTransactionalAccounts(int transactionalAccounts) { this.transactionalAccounts = transactionalAccounts; }
  public double getQualifiedPct() { return qualifiedPct; }
  public void setQualifiedPct(double qualifiedPct) { this.qualifiedPct = qualifiedPct; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
