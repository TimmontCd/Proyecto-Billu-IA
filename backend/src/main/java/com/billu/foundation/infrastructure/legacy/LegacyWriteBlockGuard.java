package com.billu.foundation.infrastructure.legacy;

public class LegacyWriteBlockGuard {
  public void ensureReadOnly() {
    ensureReadOnly("legacy-bridge", "write");
  }

  public void ensureReadOnly(String dependencyKey, String attemptedOperation) {
    throw new UnsupportedOperationException(
        "Legacy bridge " + dependencyKey + " is read-only in backend foundation. Blocked operation: "
            + attemptedOperation);
  }
}
