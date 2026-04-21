package com.billu.foundation.application.datasets;

import com.billu.foundation.domain.MockDataset;

public interface MockDatasetLoadUseCase {
  MockDataset load(MockDatasetLoadCommand command);
}
