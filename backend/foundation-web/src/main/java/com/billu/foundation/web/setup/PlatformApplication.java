package com.billu.foundation.web.setup;

import com.billu.foundation.web.api.PlatformAuthController;
import com.billu.foundation.web.api.PlatformHealthController;
import com.billu.foundation.web.api.PlatformMockDatasetController;
import com.billu.foundation.web.api.PlatformReadinessController;
import com.billu.foundation.web.errors.GlobalExceptionMapper;
import org.glassfish.jersey.jackson.JacksonFeature;
import org.glassfish.jersey.server.ResourceConfig;

public class PlatformApplication extends ResourceConfig {
  public PlatformApplication() {
    register(PlatformHealthController.class);
    register(PlatformReadinessController.class);
    register(PlatformAuthController.class);
    register(PlatformMockDatasetController.class);
    register(GlobalExceptionMapper.class);
    register(JacksonFeature.class);
  }
}
