package com.billu.categorization.application;

public class CustomerCategorizationRequestValidator {
  public String validateRewardsId(String rewardsId) {
    String normalized = rewardsId == null ? "" : rewardsId.trim();
    if (normalized.isEmpty()) {
      throw new IllegalArgumentException("rewardsId is required");
    }
    return normalized;
  }
}
