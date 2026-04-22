package com.billu.categorization.infrastructure.mock;

import com.billu.categorization.application.CustomerCategorizationExportGateway;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.domain.CustomerCategorizationExportRequest;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

public class MockCustomerCategorizationExportRepository
    implements CustomerCategorizationExportGateway {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public CustomerCategorizationExportResult exportData(CustomerCategorizationExportRequest request) {
    String normalizedSegmentId = normalizeSegmentId(request.getSegmentId());
    SegmentMetadata metadata = resolveSegmentMetadata(normalizedSegmentId);
    CustomerCategorizationExportResult template = readTemplate(resolveTemplatePath(
        request.getExportType()));
    return new CustomerCategorizationExportResult(
        request.getExportType(),
        metadata.segmentId,
        metadata.segmentLabel,
        template.getOutcome(),
        buildFileName(request.getExportType(), metadata.segmentId),
        metadata.rowCount,
        request.getCorrelationId(),
        buildSummary(request.getExportType(), metadata.segmentLabel));
  }

  private CustomerCategorizationExportResult readTemplate(String path) {
    InputStream inputStream = getClass().getClassLoader().getResourceAsStream(path);
    if (inputStream == null) {
      throw new IllegalStateException("Missing mock dataset: " + path);
    }
    try {
      return objectMapper.readValue(inputStream, CustomerCategorizationExportResult.class);
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load customer categorization export mock dataset",
          exception);
    }
  }

  private String resolveTemplatePath(String exportType) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "mock-datasets/customer-categorization-segment-export.json";
    }
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_CROSS_SELL.equals(exportType)) {
      return "mock-datasets/customer-categorization-cross-sell-export.json";
    }
    throw new IllegalArgumentException("Tipo de exporte no soportado: " + exportType);
  }

  private String buildFileName(String exportType, String segmentId) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "categorizacion_cliente_" + segmentId.toLowerCase() + ".csv";
    }
    return "venta_cruzada_" + segmentId.toLowerCase() + ".csv";
  }

  private String buildSummary(String exportType, String segmentLabel) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "Exporte institucional generado para el segmento " + segmentLabel + ".";
    }
    return "Exporte de venta cruzada generado para el segmento " + segmentLabel + ".";
  }

  private String normalizeSegmentId(String segmentId) {
    return segmentId == null ? "" : segmentId.trim();
  }

  private SegmentMetadata resolveSegmentMetadata(String segmentId) {
    Map<String, SegmentMetadata> supportedSegments = new LinkedHashMap<String, SegmentMetadata>();
    supportedSegments.put("Exploradores", new SegmentMetadata("Exploradores", "Exploradores", 31));
    supportedSegments.put("Constructores", new SegmentMetadata("Constructores", "Constructores", 64));
    supportedSegments.put("Aliados_Premium",
        new SegmentMetadata("Aliados_Premium", "Aliados Premium", 27));
    SegmentMetadata metadata = supportedSegments.get(segmentId);
    if (metadata == null) {
      throw new IllegalArgumentException("Nivel no soportado: " + segmentId);
    }
    return metadata;
  }

  private static final class SegmentMetadata {
    private final String segmentId;
    private final String segmentLabel;
    private final int rowCount;

    private SegmentMetadata(String segmentId, String segmentLabel, int rowCount) {
      this.segmentId = segmentId;
      this.segmentLabel = segmentLabel;
      this.rowCount = rowCount;
    }
  }
}
