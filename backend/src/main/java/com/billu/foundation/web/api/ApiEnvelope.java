package com.billu.foundation.web.api;

public class ApiEnvelope<T> {
  private final boolean ok;
  private final T data;
  private final String error;

  private ApiEnvelope(boolean ok, T data, String error) {
    this.ok = ok;
    this.data = data;
    this.error = error;
  }

  public static <T> ApiEnvelope<T> success(T data) {
    return new ApiEnvelope<T>(true, data, null);
  }

  public static <T> ApiEnvelope<T> error(String error) {
    return new ApiEnvelope<T>(false, null, error);
  }

  public boolean isOk() { return ok; }
  public T getData() { return data; }
  public String getError() { return error; }
}
