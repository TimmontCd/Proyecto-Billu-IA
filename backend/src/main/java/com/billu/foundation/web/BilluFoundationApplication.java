package com.billu.foundation.web;

import com.billu.foundation.web.filters.CorrelationFilter;
import com.billu.foundation.web.security.AccessContextFilter;
import com.billu.foundation.web.setup.PlatformApplication;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackages = "com.billu")
public class BilluFoundationApplication extends SpringBootServletInitializer {
  public static void main(String[] args) {
    SpringApplication.run(BilluFoundationApplication.class, args);
  }

  @Override
  protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
    return application.sources(BilluFoundationApplication.class);
  }

  @Bean
  public ResourceConfig jerseyResourceConfig() {
    return new PlatformApplication();
  }

  @Bean
  public FilterRegistrationBean<CorrelationFilter> correlationFilterRegistration() {
    FilterRegistrationBean<CorrelationFilter> registration =
        new FilterRegistrationBean<CorrelationFilter>();
    registration.setFilter(new CorrelationFilter());
    registration.addUrlPatterns("/*");
    registration.setOrder(1);
    return registration;
  }

  @Bean
  public FilterRegistrationBean<AccessContextFilter> accessContextFilterRegistration() {
    FilterRegistrationBean<AccessContextFilter> registration =
        new FilterRegistrationBean<AccessContextFilter>();
    registration.setFilter(new AccessContextFilter());
    registration.addUrlPatterns("/*");
    registration.setOrder(2);
    return registration;
  }
}
