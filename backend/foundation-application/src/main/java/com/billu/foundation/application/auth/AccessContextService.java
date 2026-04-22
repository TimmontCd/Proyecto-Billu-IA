package com.billu.foundation.application.auth;

import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.domain.EnvironmentProfile;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class AccessContextService implements AccessContextQueryUseCase {
  private final EnvironmentProfile environmentProfile;

  public AccessContextService(EnvironmentProfile environmentProfile) {
    this.environmentProfile = environmentProfile;
  }

  @Override
  public AccessContext getAccessContext() {
    AccessContextRequestContext.RequestMetadata metadata = AccessContextRequestContext.get();
    String subjectId = valueOrDefault(metadata == null ? null : metadata.getSubjectId(),
        "local-platform-admin");
    String principalName = valueOrDefault(metadata == null ? null : metadata.getPrincipalName(),
        "local.developer@billu");
    String authMode = resolveAuthMode(metadata == null ? null : metadata.getAuthMode());
    List<String> roles = "CORPORATE_IDP".equals(authMode)
        ? Arrays.asList("PLATFORM_OPERATOR", "AUDIT_READER")
        : Arrays.asList("PLATFORM_ADMIN", "FOUNDATION_OPERATOR");
    List<String> scopes = Arrays.asList("foundation:read", "foundation:operate", "jobs:execute");
    return new AccessContext(
        subjectId,
        principalName,
        authMode,
        roles,
        scopes,
        environmentProfile.getEnvironmentKey(),
        environmentProfile.isOracleModeEnabled() ? "LOCAL_ORACLE" : "LOCAL_MOCK",
        Instant.now());
  }

  private String resolveAuthMode(String requestedMode) {
    String normalized = valueOrDefault(requestedMode, "").toUpperCase();
    if ("FEDERATED".equals(normalized) || "CORPORATE_IDP".equals(normalized)) {
      return "CORPORATE_IDP";
    }
    if (environmentProfile.isLegacyBridgeEnabled() && "LEGACY".equals(normalized)) {
      return "LEGACY_BRIDGE";
    }
    return environmentProfile.isOracleModeEnabled() ? "CORPORATE_IDP" : "LOCAL_MOCK";
  }

  private String valueOrDefault(String value, String defaultValue) {
    return value == null || value.trim().isEmpty() ? defaultValue : value.trim();
  }
}
