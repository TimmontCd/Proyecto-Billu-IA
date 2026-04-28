package com.billu.categorization.domain;

import java.util.List;
import java.util.Map;

public class CustomerSegmentSummary {
  private String segmentId;
  private String segmentLabel;
  private String rule;
  private String recommendedCard;
  private String recommendedCardBenefits;
  private int clients;
  private double sharePct;
  private double totalBalance;
  private double averageBalance;
  private double averageTransactions;
  private double averageTenureDays;
  private int missingCreditCardClients;
  private int portfolioCompleteClients;
  private List<Map<String, Object>> topStates;
  private List<Map<String, Object>> productAdoption;
  private List<Map<String, Object>> missingProducts;

  public CustomerSegmentSummary() {
  }

  public CustomerSegmentSummary(String segmentId, String segmentLabel, String rule,
      String recommendedCard, String recommendedCardBenefits, int clients, double sharePct,
      double totalBalance, double averageBalance, double averageTransactions,
      double averageTenureDays, int missingCreditCardClients, int portfolioCompleteClients,
      List<Map<String, Object>> topStates, List<Map<String, Object>> productAdoption,
      List<Map<String, Object>> missingProducts) {
    this.segmentId = segmentId;
    this.segmentLabel = segmentLabel;
    this.rule = rule;
    this.recommendedCard = recommendedCard;
    this.recommendedCardBenefits = recommendedCardBenefits;
    this.clients = clients;
    this.sharePct = sharePct;
    this.totalBalance = totalBalance;
    this.averageBalance = averageBalance;
    this.averageTransactions = averageTransactions;
    this.averageTenureDays = averageTenureDays;
    this.missingCreditCardClients = missingCreditCardClients;
    this.portfolioCompleteClients = portfolioCompleteClients;
    this.topStates = topStates;
    this.productAdoption = productAdoption;
    this.missingProducts = missingProducts;
  }

  public String getSegmentId() { return segmentId; }
  public void setSegmentId(String segmentId) { this.segmentId = segmentId; }
  public String getSegmentLabel() { return segmentLabel; }
  public void setSegmentLabel(String segmentLabel) { this.segmentLabel = segmentLabel; }
  public String getRule() { return rule; }
  public void setRule(String rule) { this.rule = rule; }
  public String getRecommendedCard() { return recommendedCard; }
  public void setRecommendedCard(String recommendedCard) { this.recommendedCard = recommendedCard; }
  public String getRecommendedCardBenefits() { return recommendedCardBenefits; }
  public void setRecommendedCardBenefits(String recommendedCardBenefits) { this.recommendedCardBenefits = recommendedCardBenefits; }
  public int getClients() { return clients; }
  public void setClients(int clients) { this.clients = clients; }
  public double getSharePct() { return sharePct; }
  public void setSharePct(double sharePct) { this.sharePct = sharePct; }
  public double getTotalBalance() { return totalBalance; }
  public void setTotalBalance(double totalBalance) { this.totalBalance = totalBalance; }
  public double getAverageBalance() { return averageBalance; }
  public void setAverageBalance(double averageBalance) { this.averageBalance = averageBalance; }
  public double getAverageTransactions() { return averageTransactions; }
  public void setAverageTransactions(double averageTransactions) { this.averageTransactions = averageTransactions; }
  public double getAverageTenureDays() { return averageTenureDays; }
  public void setAverageTenureDays(double averageTenureDays) { this.averageTenureDays = averageTenureDays; }
  public int getMissingCreditCardClients() { return missingCreditCardClients; }
  public void setMissingCreditCardClients(int missingCreditCardClients) { this.missingCreditCardClients = missingCreditCardClients; }
  public int getPortfolioCompleteClients() { return portfolioCompleteClients; }
  public void setPortfolioCompleteClients(int portfolioCompleteClients) { this.portfolioCompleteClients = portfolioCompleteClients; }
  public List<Map<String, Object>> getTopStates() { return topStates; }
  public void setTopStates(List<Map<String, Object>> topStates) { this.topStates = topStates; }
  public List<Map<String, Object>> getProductAdoption() { return productAdoption; }
  public void setProductAdoption(List<Map<String, Object>> productAdoption) { this.productAdoption = productAdoption; }
  public List<Map<String, Object>> getMissingProducts() { return missingProducts; }
  public void setMissingProducts(List<Map<String, Object>> missingProducts) { this.missingProducts = missingProducts; }
}
