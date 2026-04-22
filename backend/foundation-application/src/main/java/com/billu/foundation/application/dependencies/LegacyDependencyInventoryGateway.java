package com.billu.foundation.application.dependencies;

import com.billu.foundation.domain.LegacyDependency;
import java.util.List;

public interface LegacyDependencyInventoryGateway {
  List<LegacyDependency> listDependencies();
}
