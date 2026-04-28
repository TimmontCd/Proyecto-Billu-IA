package com.billu.foundation.application.auth;

public final class AccessContextRequestContext {
  private static final ThreadLocal<RequestMetadata> CURRENT = new ThreadLocal<RequestMetadata>();

  private AccessContextRequestContext() {
  }

  public static void set(RequestMetadata metadata) {
    CURRENT.set(metadata);
  }

  public static RequestMetadata get() {
    return CURRENT.get();
  }

  public static void clear() {
    CURRENT.remove();
  }

  public static final class RequestMetadata {
    private final String subjectId;
    private final String principalName;
    private final String authMode;

    public RequestMetadata(String subjectId, String principalName, String authMode) {
      this.subjectId = subjectId;
      this.principalName = principalName;
      this.authMode = authMode;
    }

    public String getSubjectId() { return subjectId; }
    public String getPrincipalName() { return principalName; }
    public String getAuthMode() { return authMode; }
  }
}
