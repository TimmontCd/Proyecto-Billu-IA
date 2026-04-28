package com.billu.foundation.infrastructure.secrets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CyberArkSecretProvider implements SecretProvider {
  private static final Logger LOGGER = LoggerFactory.getLogger(CyberArkSecretProvider.class);

  @Override
  public String resolve(String secretKey) {
    LOGGER.info("CyberArk secret resolution requested for key={}", secretKey);
    return null;
  }
}
