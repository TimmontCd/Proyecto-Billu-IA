package com.billu.foundation.infrastructure.legacy;

import java.util.LinkedHashMap;
import java.util.Map;

public class SheetReadOnlyBridge implements LegacyReadOnlyAdapter {
  private final LegacyWriteBlockGuard writeBlockGuard;

  public SheetReadOnlyBridge(LegacyWriteBlockGuard writeBlockGuard) {
    this.writeBlockGuard = writeBlockGuard;
  }

  @Override
  public Object read(String key) {
    Map<String, String> snapshot = new LinkedHashMap<String, String>();
    snapshot.put("dependencyKey", "legacy-sheets-base-repository");
    snapshot.put("requestedKey", key);
    snapshot.put("accessMode", "READ_ONLY");
    snapshot.put("source", "legacy/src/repositories/BaseRepository.gs");
    return snapshot;
  }

  public void writeSheetRecord(String sheetKey, Object payload) {
    writeBlockGuard.ensureReadOnly("legacy-sheets-base-repository", "writeSheetRecord");
  }
}
