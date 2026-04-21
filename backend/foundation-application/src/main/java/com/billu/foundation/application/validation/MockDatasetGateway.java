package com.billu.foundation.application.validation;

import com.billu.foundation.domain.MockDataset;
import java.io.IOException;

public interface MockDatasetGateway {
  MockDataset load(String datasetKey, boolean resetBeforeLoad) throws IOException;
}
