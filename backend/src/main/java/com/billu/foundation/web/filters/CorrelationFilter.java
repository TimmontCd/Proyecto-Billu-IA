package com.billu.foundation.web.filters;

import java.io.IOException;
import java.util.UUID;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

public class CorrelationFilter implements Filter {
  @Override
  public void init(FilterConfig filterConfig) {
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    request.setAttribute("correlationId", UUID.randomUUID().toString());
    chain.doFilter(request, response);
  }

  @Override
  public void destroy() {
  }
}
