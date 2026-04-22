package com.billu.categorization.infrastructure.legacy;

import com.billu.categorization.application.CustomerCategorizationExportGateway;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.domain.CustomerCategorizationExportRequest;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import java.util.LinkedHashMap;
import java.util.Map;

public class LegacyCustomerCategorizationExportAdapter
    implements CustomerCategorizationExportGateway {
  @Override
  public CustomerCategorizationExportResult exportData(CustomerCategorizationExportRequest request) {
    SegmentMetadata metadata = resolveSegmentMetadata(request.getSegmentId());
    return new CustomerCategorizationExportResult(
        request.getExportType(),
        metadata.segmentId,
        metadata.segmentLabel,
        "SUCCEEDED",
        buildFileName(request.getExportType(), metadata.segmentId),
        metadata.rowCount,
        request.getCorrelationId(),
        buildSummary(request.getExportType(), metadata.segmentLabel));
  }

  private SegmentMetadata resolveSegmentMetadata(String segmentId) {
    Map<String, SegmentMetadata> supportedSegments = new LinkedHashMap<String, SegmentMetadata>();
    supportedSegments.put("Exploradores",
        new SegmentMetadata("Exploradores", "Exploradores", 412));
    supportedSegments.put("Constructores",
        new SegmentMetadata("Constructores", "Constructores", 978));
    supportedSegments.put("Aliados_Premium",
        new SegmentMetadata("Aliados_Premium", "Aliados Premium", 452));
    SegmentMetadata metadata = supportedSegments.get(segmentId);
    if (metadata == null) {
      throw new IllegalArgumentException("Nivel no soportado: " + segmentId);
    }
    return metadata;
  }

  private String buildFileName(String exportType, String segmentId) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "categorizacion_cliente_" + segmentId.toLowerCase() + ".csv";
    }
    return "venta_cruzada_" + segmentId.toLowerCase() + ".csv";
  }

  private String buildSummary(String exportType, String segmentLabel) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "Exporte legado read-only preparado para el segmento " + segmentLabel + ".";
    }
    return "Base de venta cruzada read-only preparada para el segmento " + segmentLabel + ".";
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
