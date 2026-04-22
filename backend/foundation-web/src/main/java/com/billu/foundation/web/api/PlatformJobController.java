package com.billu.foundation.web.api;

import com.billu.foundation.application.jobs.JobExecutionCommand;
import com.billu.foundation.application.jobs.JobExecutionQueryUseCase;
import com.billu.foundation.application.jobs.JobExecutionUseCase;
import com.billu.foundation.domain.JobExecution;
import com.billu.foundation.web.metrics.PlatformMetricsPublisher;
import com.billu.foundation.web.setup.PlatformComponentFactory;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/platform/jobs")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlatformJobController {
  private final JobExecutionUseCase jobExecutionUseCase;
  private final JobExecutionQueryUseCase jobExecutionQueryUseCase;
  private final PlatformMetricsPublisher metricsPublisher;

  public PlatformJobController() {
    this(
        PlatformComponentFactory.getJobExecutionService(),
        PlatformComponentFactory.getJobExecutionService(),
        PlatformComponentFactory.getPlatformMetricsPublisher());
  }

  public PlatformJobController(JobExecutionUseCase jobExecutionUseCase,
      JobExecutionQueryUseCase jobExecutionQueryUseCase,
      PlatformMetricsPublisher metricsPublisher) {
    this.jobExecutionUseCase = jobExecutionUseCase;
    this.jobExecutionQueryUseCase = jobExecutionQueryUseCase;
    this.metricsPublisher = metricsPublisher;
  }

  @POST
  @Path("/{jobKey}/executions")
  public Response execute(@PathParam("jobKey") String jobKey, JobExecutionRequest request,
      @Context HttpServletRequest httpServletRequest) {
    try {
      JobExecution execution = jobExecutionUseCase.execute(new JobExecutionCommand(
          jobKey,
          request == null ? null : request.getRequestedMode(),
          request == null ? null : request.getRequestedBy(),
          request != null && request.isDryRun(),
          resolveCorrelationId(httpServletRequest)));
      metricsPublisher.recordJobExecution(execution);
      return Response.accepted(toResponse(execution)).build();
    } catch (IllegalArgumentException exception) {
      throw new WebApplicationException(
          Response.status(Response.Status.NOT_FOUND)
              .entity(ApiEnvelope.error(exception.getMessage()))
              .build());
    } catch (IllegalStateException exception) {
      throw new WebApplicationException(
          Response.status(Response.Status.BAD_REQUEST)
              .entity(ApiEnvelope.error(exception.getMessage()))
              .build());
    }
  }

  @GET
  @Path("/{jobKey}/executions/{executionId}")
  public JobExecutionResponse find(@PathParam("jobKey") String jobKey,
      @PathParam("executionId") String executionId) {
    try {
      return toResponse(jobExecutionQueryUseCase.find(jobKey, executionId));
    } catch (IllegalArgumentException exception) {
      throw new WebApplicationException(
          Response.status(Response.Status.NOT_FOUND)
              .entity(ApiEnvelope.error(exception.getMessage()))
              .build());
    }
  }

  private JobExecutionResponse toResponse(JobExecution execution) {
    return new JobExecutionResponse(
        execution.getExecutionId(),
        execution.getJobKey(),
        execution.getOutcome(),
        execution.getEnvironmentKey(),
        execution.getRunMode(),
        execution.getCorrelationId(),
        execution.getSummary());
  }

  private String resolveCorrelationId(HttpServletRequest request) {
    Object correlationId = request == null ? null : request.getAttribute("correlationId");
    return correlationId == null ? "unavailable" : correlationId.toString();
  }
}
