package com.billu.foundation.web.api;

import com.billu.foundation.application.health.HealthStatus;
import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import java.time.Instant;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/internal/platform/health")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformHealthController {
  private final LocalValidationService localValidationService;

  public PlatformHealthController() {
    this(PlatformComponentFactory.getLocalValidationService());
  }

  public PlatformHealthController(LocalValidationService localValidationService) {
    this.localValidationService = localValidationService;
  }

  @GET
  public HealthResponse getHealth(@Context HttpServletRequest request) {
    HealthStatus healthStatus = localValidationService.getHealth();
    return new HealthResponse(
        healthStatus.getStatus(),
        healthStatus.getService(),
        healthStatus.getEnvironment(),
        Instant.now(),
        localValidationService.getServiceVersion(),
        resolveCorrelationId(request));
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
