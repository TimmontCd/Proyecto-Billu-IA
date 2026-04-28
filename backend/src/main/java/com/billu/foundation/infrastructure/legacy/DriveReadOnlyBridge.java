package com.billu.foundation.infrastructure.legacy;

import java.util.LinkedHashMap;
import java.util.Map;

public class DriveReadOnlyBridge implements LegacyReadOnlyAdapter {
  private final LegacyWriteBlockGuard writeBlockGuard;

  public DriveReadOnlyBridge(LegacyWriteBlockGuard writeBlockGuard) {
    this.writeBlockGuard = writeBlockGuard;
  }

  @Override
  public Object read(String key) {
    Map<String, String> snapshot = new LinkedHashMap<String, String>();
    snapshot.put("dependencyKey", "legacy-drive-documents");
    snapshot.put("requestedKey", key);
    snapshot.put("accessMode", "READ_ONLY");
    snapshot.put("source", "legacy/src/services/DocumentService.gs");
    return snapshot;
  }

  public void moveFile(String fileId, String targetFolderId) {
    writeBlockGuard.ensureReadOnly("legacy-drive-documents", "moveFile");
  }
}
