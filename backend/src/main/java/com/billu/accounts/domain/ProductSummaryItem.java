package com.billu.accounts.domain;

public class ProductSummaryItem {
  private String productKey;
  private String productLabel;
  private int accounts;
  private double sharePct;
  private double totalBalance;
  private String status;

  public ProductSummaryItem() {
  }

  public ProductSummaryItem(String productKey, String productLabel, int accounts, double sharePct,
      double totalBalance, String status) {
    this.productKey = productKey;
    this.productLabel = productLabel;
    this.accounts = accounts;
    this.sharePct = sharePct;
    this.totalBalance = totalBalance;
    this.status = status;
  }

  public String getProductKey() { return productKey; }
  public void setProductKey(String productKey) { this.productKey = productKey; }
  public String getProductLabel() { return productLabel; }
  public void setProductLabel(String productLabel) { this.productLabel = productLabel; }
  public int getAccounts() { return accounts; }
  public void setAccounts(int accounts) { this.accounts = accounts; }
  public double getSharePct() { return sharePct; }
  public void setSharePct(double sharePct) { this.sharePct = sharePct; }
  public double getTotalBalance() { return totalBalance; }
  public void setTotalBalance(double totalBalance) { this.totalBalance = totalBalance; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
