package com.billu.foundation.domain;

import java.time.Instant;
import java.util.List;

public class AccessContext {
  private String subjectId;
  private String principalName;
  private String authSource;
  private List<String> roles;
  private List<String> scopes;
  private String environmentKey;
  private String sessionMode;
  private Instant issuedAt;

  public AccessContext() {
  }

  public AccessContext(String subjectId, String principalName, String authSource, List<String> roles,
      List<String> scopes, String environmentKey, String sessionMode, Instant issuedAt) {
    this.subjectId = subjectId;
    this.principalName = principalName;
    this.authSource = authSource;
    this.roles = roles;
    this.scopes = scopes;
    this.environmentKey = environmentKey;
    this.sessionMode = sessionMode;
    this.issuedAt = issuedAt;
  }

  public String getSubjectId() { return subjectId; }
  public String getPrincipalName() { return principalName; }
  public String getAuthSource() { return authSource; }
  public List<String> getRoles() { return roles; }
  public List<String> getScopes() { return scopes; }
  public String getEnvironmentKey() { return environmentKey; }
  public String getSessionMode() { return sessionMode; }
  public Instant getIssuedAt() { return issuedAt; }
}
