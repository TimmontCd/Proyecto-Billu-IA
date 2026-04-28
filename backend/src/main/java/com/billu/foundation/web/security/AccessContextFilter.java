package com.billu.foundation.web.security;

import com.billu.foundation.application.auth.AccessContextRequestContext;
import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

public class AccessContextFilter implements Filter {
  @Override
  public void init(FilterConfig filterConfig) {
  }

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest httpRequest = request instanceof HttpServletRequest
        ? (HttpServletRequest) request
        : null;
    try {
      AccessContextRequestContext.set(new AccessContextRequestContext.RequestMetadata(
          header(httpRequest, "X-Billu-Subject", "local-platform-admin"),
          header(httpRequest, "X-Billu-Principal", "local.developer@billu"),
          header(httpRequest, "X-Billu-Auth-Mode", "")));
      chain.doFilter(request, response);
    } finally {
      AccessContextRequestContext.clear();
    }
  }

  @Override
  public void destroy() {
  }

  private String header(HttpServletRequest request, String headerName, String defaultValue) {
    if (request == null) {
      return defaultValue;
    }
    String value = request.getHeader(headerName);
    return value == null || value.trim().isEmpty() ? defaultValue : value.trim();
  }
}
