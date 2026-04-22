package com.billu.foundation.web.api;

import com.billu.foundation.application.transition.TransitionStatus;
import com.billu.foundation.application.transition.TransitionStatusUseCase;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("/platform/transition")
@Produces(MediaType.APPLICATION_JSON)
public class TransitionController {
  private final TransitionStatusUseCase transitionStatusUseCase;

  public TransitionController() {
    this(PlatformComponentFactory.getTransitionStatusService());
  }

  public TransitionController(TransitionStatusUseCase transitionStatusUseCase) {
    this.transitionStatusUseCase = transitionStatusUseCase;
  }

  @GET
  public TransitionStatusResponse getTransitionStatus() {
    TransitionStatus transitionStatus = transitionStatusUseCase.getStatus();
    return new TransitionStatusResponse(
        transitionStatus.getStatus(),
        transitionStatus.getRollbackState(),
        transitionStatus.getActiveSystem(),
        transitionStatus.getEnvironment(),
        transitionStatus.getEvidence());
  }
}
