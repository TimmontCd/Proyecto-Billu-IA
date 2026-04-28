package com.billu.foundation.web.api;

import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

@Path("/platform/auth/context")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformAuthController {
  private final AccessContextQueryUseCase accessContextQueryUseCase;

  public PlatformAuthController() {
    this(PlatformComponentFactory.getAccessContextService());
  }

  public PlatformAuthController(AccessContextQueryUseCase accessContextQueryUseCase) {
    this.accessContextQueryUseCase = accessContextQueryUseCase;
  }

  @GET
  public AccessContextResponse getAccessContext(@Context HttpServletRequest request) {
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
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
