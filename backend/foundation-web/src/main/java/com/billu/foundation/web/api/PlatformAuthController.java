package com.billu.foundation.web.api;

import com.billu.foundation.application.validation.LocalValidationService;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/internal/platform/auth/context")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformAuthController {
  private final LocalValidationService localValidationService;

  public PlatformAuthController() {
    this(PlatformComponentFactory.getLocalValidationService());
  }

  public PlatformAuthController(LocalValidationService localValidationService) {
    this.localValidationService = localValidationService;
  }

  @GET
  public AccessContextResponse getAccessContext(@Context HttpServletRequest request) {
    AccessContext accessContext = localValidationService.getAccessContext();
    return new AccessContextResponse(
        accessContext.getSubjectId(),
        accessContext.getPrincipalName(),
        accessContext.getAuthSource(),
        accessContext.getRoles(),
        accessContext.getScopes(),
        accessContext.getEnvironmentKey(),
        resolveCorrelationId(request));
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
