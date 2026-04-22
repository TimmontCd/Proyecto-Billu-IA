package com.billu.accounts.domain;

public class AccountsDataSource {
  private String sourceKey;
  private String sourceType;
  private String accessMode;
  private String owner;
  private String retirementCriteria;
  private String status;

  public AccountsDataSource() {
  }

  public AccountsDataSource(String sourceKey, String sourceType, String accessMode, String owner,
      String retirementCriteria, String status) {
    this.sourceKey = sourceKey;
    this.sourceType = sourceType;
    this.accessMode = accessMode;
    this.owner = owner;
    this.retirementCriteria = retirementCriteria;
    this.status = status;
  }

  public String getSourceKey() { return sourceKey; }
  public void setSourceKey(String sourceKey) { this.sourceKey = sourceKey; }
  public String getSourceType() { return sourceType; }
  public void setSourceType(String sourceType) { this.sourceType = sourceType; }
  public String getAccessMode() { return accessMode; }
  public void setAccessMode(String accessMode) { this.accessMode = accessMode; }
  public String getOwner() { return owner; }
  public void setOwner(String owner) { this.owner = owner; }
  public String getRetirementCriteria() { return retirementCriteria; }
  public void setRetirementCriteria(String retirementCriteria) { this.retirementCriteria = retirementCriteria; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
}
