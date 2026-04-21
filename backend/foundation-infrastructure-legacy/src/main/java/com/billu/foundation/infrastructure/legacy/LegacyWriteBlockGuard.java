package com.billu.foundation.infrastructure.legacy;

public class LegacyWriteBlockGuard {
  public void ensureReadOnly() {
    throw new UnsupportedOperationException("Legacy bridge is read-only in backend foundation.");
  }
}
