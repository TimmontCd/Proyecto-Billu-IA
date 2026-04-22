package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationExportGateway;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.domain.CustomerCategorizationExportRequest;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class OracleCustomerCategorizationExportRepository
    extends OracleRepositorySupport implements CustomerCategorizationExportGateway {
  private static final String SEGMENT_COUNT_SQL =
      "SELECT MAX(SEGMENT_LABEL) AS segment_label, COUNT(*) AS row_count "
          + "FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "WHERE SNAPSHOT_DATE = (SELECT MAX(SNAPSHOT_DATE) FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT) "
          + "  AND SEGMENT_ID = ?";

  public OracleCustomerCategorizationExportRepository(String environment, String url, String user,
      String password) {
    super(environment, url, user, password);
  }

  OracleCustomerCategorizationExportRepository(String environment, String url, String user,
      String password, OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public CustomerCategorizationExportResult exportData(CustomerCategorizationExportRequest request) {
    try (Connection connection = openConnection()) {
      SegmentExportAggregate aggregate = loadSegmentAggregate(connection, request.getSegmentId());
      return new CustomerCategorizationExportResult(
          request.getExportType(),
          request.getSegmentId(),
          aggregate.segmentLabel,
          "SUCCEEDED",
          buildFileName(request.getExportType(), request.getSegmentId()),
          aggregate.rowCount,
          request.getCorrelationId(),
          buildSummary(request.getExportType(), aggregate.segmentLabel));
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer categorization export projection", exception);
    }
  }

  private SegmentExportAggregate loadSegmentAggregate(Connection connection, String segmentId)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(SEGMENT_COUNT_SQL)) {
      statement.setString(1, segmentId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return new SegmentExportAggregate(normalizeSegmentLabel(segmentId), 0);
        }
        String segmentLabel = hasText(resultSet.getString("segment_label"))
            ? resultSet.getString("segment_label")
            : normalizeSegmentLabel(segmentId);
        return new SegmentExportAggregate(segmentLabel, resultSet.getInt("row_count"));
      }
    }
  }

  private String buildFileName(String exportType, String segmentId) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "categorizacion_cliente_" + segmentId.toLowerCase() + ".csv";
    }
    return "venta_cruzada_" + segmentId.toLowerCase() + ".csv";
  }

  private String buildSummary(String exportType, String segmentLabel) {
    if (ExportCustomerCategorizationUseCase.EXPORT_TYPE_SEGMENT.equals(exportType)) {
      return "Exporte Oracle generado para el segmento " + segmentLabel + ".";
    }
    return "Exporte Oracle de venta cruzada generado para el segmento " + segmentLabel + ".";
  }

  private static final class SegmentExportAggregate {
    private final String segmentLabel;
    private final int rowCount;

    private SegmentExportAggregate(String segmentLabel, int rowCount) {
      this.segmentLabel = segmentLabel;
      this.rowCount = rowCount;
    }
  }
}
