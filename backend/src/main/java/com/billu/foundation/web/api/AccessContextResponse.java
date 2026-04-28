package com.billu.foundation.web.api;

import java.util.List;

public class AccessContextResponse {
  private final String subjectId;
  private final String principalName;
  private final String authSource;
  private final List<String> roles;
  private final List<String> scopes;
  private final String environment;
  private final String correlationId;

  public AccessContextResponse(String subjectId, String principalName, String authSource,
      List<String> roles, List<String> scopes, String environment, String correlationId) {
    this.subjectId = subjectId;
    this.principalName = principalName;
    this.authSource = authSource;
    this.roles = roles;
    this.scopes = scopes;
    this.environment = environment;
    this.correlationId = correlationId;
  }

  public String getSubjectId() { return subjectId; }
  public String getPrincipalName() { return principalName; }
  public String getAuthSource() { return authSource; }
  public List<String> getRoles() { return roles; }
  public List<String> getScopes() { return scopes; }
  public String getEnvironment() { return environment; }
  public String getCorrelationId() { return correlationId; }
}
