package com.billu.accounts.web.api;

public class ProductSummaryResponse {
  private final String productKey;
  private final String productLabel;
  private final int accounts;
  private final double sharePct;
  private final double totalBalance;
  private final String status;

  public ProductSummaryResponse(String productKey, String productLabel, int accounts,
      double sharePct, double totalBalance, String status) {
    this.productKey = productKey;
    this.productLabel = productLabel;
    this.accounts = accounts;
    this.sharePct = sharePct;
    this.totalBalance = totalBalance;
    this.status = status;
  }

  public String getProductKey() { return productKey; }
  public String getProductLabel() { return productLabel; }
  public int getAccounts() { return accounts; }
  public double getSharePct() { return sharePct; }
  public double getTotalBalance() { return totalBalance; }
  public String getStatus() { return status; }
}
