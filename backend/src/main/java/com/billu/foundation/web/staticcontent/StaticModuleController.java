package com.billu.foundation.web.staticcontent;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class StaticModuleController {
  private static final Set<String> MODULES = new HashSet<String>(Arrays.asList(
      "realtime",
      "conversion-agent",
      "whatsapp-agent",
      "funnel",
      "accounts",
      "customer-categorization",
      "projects",
      "heatmaps",
      "audio",
      "tincho",
      "admin"));

  @GetMapping("/")
  public String root() {
    return "redirect:/customer-categorization/";
  }

  @GetMapping("/{module}/")
  public String module(@PathVariable("module") String module) {
    if ("customer-summary".equals(module)) {
      return "redirect:/customer-categorization/";
    }
    if (!MODULES.contains(module)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return "forward:/" + module + "/index.html";
  }
}
