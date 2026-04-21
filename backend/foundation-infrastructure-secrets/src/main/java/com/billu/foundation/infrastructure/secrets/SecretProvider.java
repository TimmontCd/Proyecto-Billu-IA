package com.billu.foundation.infrastructure.secrets;

public interface SecretProvider {
  String resolve(String secretKey);
}
