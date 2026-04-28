package com.billu.categorization.application;

public class CustomerCategorizationRequestValidator {
  public String validateRewardsId(String rewardsId) {
    String normalized = rewardsId == null ? "" : rewardsId.trim();
    if (normalized.isEmpty()) {
      throw new IllegalArgumentException("rewardsId is required");
    }
    return normalized;
  }

  public String validateSegmentId(String segmentId) {
    String normalized = segmentId == null ? "" : segmentId.trim();
    if (normalized.isEmpty()) {
      throw new IllegalArgumentException("segmentId is required");
    }
    if ("exploradores".equalsIgnoreCase(normalized)) {
      return "Exploradores";
    }
    if ("constructores".equalsIgnoreCase(normalized)) {
      return "Constructores";
    }
    if ("aliados premium".equalsIgnoreCase(normalized)
        || "aliados_premium".equalsIgnoreCase(normalized)) {
      return "Aliados_Premium";
    }
    throw new IllegalArgumentException("Nivel no soportado: " + normalized);
  }
}
