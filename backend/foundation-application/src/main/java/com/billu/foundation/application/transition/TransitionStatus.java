package com.billu.foundation.application.transition;

public class TransitionStatus {
  private final String status;
  private final String rollbackState;

  public TransitionStatus(String status, String rollbackState) {
    this.status = status;
    this.rollbackState = rollbackState;
  }

  public String getStatus() { return status; }
  public String getRollbackState() { return rollbackState; }
}
