package com.billu.categorization.application;

import com.billu.categorization.domain.CustomerCategorizationExportRequest;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.billu.foundation.application.auth.AccessContextQueryUseCase;
import com.billu.foundation.domain.AccessContext;

public class ExportCustomerCategorizationUseCase {
  public static final String EXPORT_TYPE_SEGMENT = "SEGMENT_EXPORT";
  public static final String EXPORT_TYPE_CROSS_SELL = "CROSS_SELL_EXPORT";

  private final CustomerCategorizationExportGateway exportGateway;
  private final CustomerCategorizationAuditService auditService;
  private final AccessContextQueryUseCase accessContextQueryUseCase;
  private final CustomerCategorizationRequestValidator requestValidator;
  private final CustomerCategorizationMappingValidator mappingValidator;

  public ExportCustomerCategorizationUseCase(CustomerCategorizationExportGateway exportGateway,
      CustomerCategorizationAuditService auditService,
      AccessContextQueryUseCase accessContextQueryUseCase) {
    this(exportGateway, auditService, accessContextQueryUseCase,
        new CustomerCategorizationRequestValidator(),
        new CustomerCategorizationMappingValidator());
  }

  public ExportCustomerCategorizationUseCase(CustomerCategorizationExportGateway exportGateway,
      CustomerCategorizationAuditService auditService,
      AccessContextQueryUseCase accessContextQueryUseCase,
      CustomerCategorizationRequestValidator requestValidator,
      CustomerCategorizationMappingValidator mappingValidator) {
    this.exportGateway = exportGateway;
    this.auditService = auditService;
    this.accessContextQueryUseCase = accessContextQueryUseCase;
    this.requestValidator = requestValidator;
    this.mappingValidator = mappingValidator;
  }

  public CustomerCategorizationExportResult exportSegment(String segmentId, String correlationId) {
    return export(EXPORT_TYPE_SEGMENT, segmentId, correlationId);
  }

  public CustomerCategorizationExportResult exportCrossSell(String segmentId, String correlationId) {
    return export(EXPORT_TYPE_CROSS_SELL, segmentId, correlationId);
  }

  private CustomerCategorizationExportResult export(String exportType, String segmentId,
      String correlationId) {
    AccessContext accessContext = accessContextQueryUseCase.getAccessContext();
    String validatedSegmentId = requestValidator.validateSegmentId(segmentId);
    CustomerCategorizationExportResult result = mappingValidator.validateExport(
        exportGateway.exportData(new CustomerCategorizationExportRequest(
            exportType,
            accessContext.getEnvironmentKey(),
            accessContext.getPrincipalName(),
            validatedSegmentId,
            correlationId,
            "REQUESTED")));
    auditService.recordExportRequest(
        accessContext.getPrincipalName(),
        accessContext.getEnvironmentKey(),
        correlationId,
        result.getExportType(),
        result.getSegmentId(),
        result.getOutcome(),
        result.getFileName());
    return result;
  }
}
