package com.billu.foundation.infrastructure.secrets;

public class LocalSecretProvider implements SecretProvider {
  @Override
  public String resolve(String secretKey) {
    return System.getenv(secretKey);
  }
}
