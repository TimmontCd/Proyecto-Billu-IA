package com.billu.foundation.application.dependencies;

import java.util.List;

public interface DependencyQueryUseCase {
  List<DependencyStatus> listDependencies();
}
