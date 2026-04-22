package com.billu.categorization.web.api;

import java.util.List;
import java.util.Map;

public class CustomerSegmentSummaryResponse {
  private final String segmentId;
  private final String segmentLabel;
  private final String rule;
  private final String recommendedCard;
  private final String recommendedCardBenefits;
  private final int clients;
  private final double sharePct;
  private final double totalBalance;
  private final double averageBalance;
  private final double averageTransactions;
  private final double averageTenureDays;
  private final int missingCreditCardClients;
  private final int portfolioCompleteClients;
  private final List<Map<String, Object>> topStates;
  private final List<Map<String, Object>> productAdoption;
  private final List<Map<String, Object>> missingProducts;

  public CustomerSegmentSummaryResponse(String segmentId, String segmentLabel, String rule,
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
  public String getSegmentLabel() { return segmentLabel; }
  public String getRule() { return rule; }
  public String getRecommendedCard() { return recommendedCard; }
  public String getRecommendedCardBenefits() { return recommendedCardBenefits; }
  public int getClients() { return clients; }
  public double getSharePct() { return sharePct; }
  public double getTotalBalance() { return totalBalance; }
  public double getAverageBalance() { return averageBalance; }
  public double getAverageTransactions() { return averageTransactions; }
  public double getAverageTenureDays() { return averageTenureDays; }
  public int getMissingCreditCardClients() { return missingCreditCardClients; }
  public int getPortfolioCompleteClients() { return portfolioCompleteClients; }
  public List<Map<String, Object>> getTopStates() { return topStates; }
  public List<Map<String, Object>> getProductAdoption() { return productAdoption; }
  public List<Map<String, Object>> getMissingProducts() { return missingProducts; }
}
