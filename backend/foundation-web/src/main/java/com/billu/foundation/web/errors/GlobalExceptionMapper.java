package com.billu.foundation.web.errors;

import com.billu.foundation.web.api.ApiEnvelope;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;

public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {
  @Override
  public Response toResponse(Throwable exception) {
    if (exception instanceof WebApplicationException) {
      WebApplicationException webApplicationException = (WebApplicationException) exception;
      Object entity = webApplicationException.getResponse().getEntity();
      if (entity != null) {
        return webApplicationException.getResponse();
      }
      ApiEnvelope<String> envelope = ApiEnvelope.error(exception.getMessage());
      return Response.status(webApplicationException.getResponse().getStatus())
          .entity(envelope)
          .build();
    }
    ApiEnvelope<String> envelope = ApiEnvelope.error(exception.getMessage());
    return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(envelope).build();
  }
}
