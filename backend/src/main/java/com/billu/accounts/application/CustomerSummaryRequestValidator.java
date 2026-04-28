package com.billu.accounts.application;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public class CustomerSummaryRequestValidator {
  public void validateHistoricalRange(String startDate, String endDate) {
    if (isBlank(startDate) && isBlank(endDate)) {
      return;
    }
    if (isBlank(startDate) || isBlank(endDate)) {
      throw new IllegalArgumentException("startDate and endDate must be provided together");
    }
    LocalDate parsedStart = parseDate("startDate", startDate);
    LocalDate parsedEnd = parseDate("endDate", endDate);
    if (parsedEnd.isBefore(parsedStart)) {
      throw new IllegalArgumentException("endDate must be on or after startDate");
    }
  }

  public void validateExportMonth(Integer selectedYear, Integer selectedMonth, String exportType) {
    if (selectedYear == null || selectedMonth == null) {
      throw new IllegalArgumentException("selectedYear and selectedMonth are required for "
          + exportType);
    }
    if (selectedMonth.intValue() < 1 || selectedMonth.intValue() > 12) {
      throw new IllegalArgumentException("selectedMonth must be between 1 and 12");
    }
    if (selectedYear.intValue() < 2000 || selectedYear.intValue() > 2100) {
      throw new IllegalArgumentException("selectedYear must be between 2000 and 2100");
    }
  }

  private LocalDate parseDate(String fieldName, String value) {
    try {
      return LocalDate.parse(value);
    } catch (DateTimeParseException exception) {
      throw new IllegalArgumentException(fieldName + " must use ISO-8601 format yyyy-MM-dd");
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }
}
