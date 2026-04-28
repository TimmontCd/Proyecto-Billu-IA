package com.billu.foundation.infrastructure.oracle;

public class OracleReadinessProbe {
  public boolean isReady(String url, String user, String password) {
    return url != null && !url.trim().isEmpty() && user != null && !user.trim().isEmpty()
        && password != null && !password.trim().isEmpty();
  }
}
