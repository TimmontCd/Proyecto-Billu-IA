package com.billu.categorization.infrastructure.oracle;

import com.billu.categorization.application.CustomerCategorizationExportGateway;
import com.billu.categorization.application.ExportCustomerCategorizationUseCase;
import com.billu.categorization.domain.CustomerCategorizationExportRequest;
import com.billu.categorization.domain.CustomerCategorizationExportResult;
import com.billu.foundation.domain.CsvContentBuilder;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class OracleCustomerCategorizationExportRepository
    extends OracleRepositorySupport implements CustomerCategorizationExportGateway {
  private static final String SEGMENT_EXPORT_SQL =
      "SELECT REWARDS_ID, SEGMENT_ID, SEGMENT_LABEL, SEGMENT_RULE_TEXT, "
          + "RECOMMENDED_CARD, RECOMMENDED_CARD_BENEFITS, CURRENT_BALANCE_AMOUNT, "
          + "BALANCE_AVG_3M, TOTAL_TRANSACTIONS, ABONOS_COUNT_30D, CARGOS_COUNT_30D, "
          + "TRANSACTION_PROFILE, TENURE_DAYS, MISSING_PRODUCTS_TEXT, SUGGESTED_CAMPAIGN "
          + "FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT "
          + "WHERE SNAPSHOT_DATE = (SELECT MAX(SNAPSHOT_DATE) FROM DLK_CUSTOMER_SEGMENT_SNAPSHOT) "
          + "  AND SEGMENT_ID = ? "
          + "ORDER BY REWARDS_ID";

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
      SegmentExportAggregate aggregate = loadSegmentExport(connection, request.getSegmentId());
      return new CustomerCategorizationExportResult(
          request.getExportType(),
          request.getSegmentId(),
          aggregate.segmentLabel,
          "SUCCEEDED",
          buildFileName(request.getExportType(), request.getSegmentId()),
          aggregate.rowCount,
          request.getCorrelationId(),
          buildSummary(request.getExportType(), aggregate.segmentLabel),
          aggregate.csvContent);
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer categorization export projection", exception);
    }
  }

  private SegmentExportAggregate loadSegmentExport(Connection connection, String segmentId)
      throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement(SEGMENT_EXPORT_SQL)) {
      statement.setString(1, segmentId);
      try (ResultSet resultSet = statement.executeQuery()) {
        List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
        String segmentLabel = normalizeSegmentLabel(segmentId);
        while (resultSet.next()) {
          if (hasText(resultSet.getString("SEGMENT_LABEL"))) {
            segmentLabel = resultSet.getString("SEGMENT_LABEL");
          }
          OracleCustomerCategorizationEnrichment.Enrichment enrichment =
              OracleCustomerCategorizationEnrichment.load(connection,
                  resultSet.getString("REWARDS_ID"));
          String effectiveSegmentLabel = hasText(resultSet.getString("SEGMENT_LABEL"))
              ? resultSet.getString("SEGMENT_LABEL")
              : normalizeSegmentLabel(resultSet.getString("SEGMENT_ID"));
          String campaign = OracleCustomerCategorizationEnrichment.buildCampaign(
              effectiveSegmentLabel,
              resultSet.getString("RECOMMENDED_CARD"),
              enrichment);
          rows.add(enrichment.toDetailMap(
              resultSet.getString("SEGMENT_ID"),
              effectiveSegmentLabel,
              resultSet.getString("SEGMENT_RULE_TEXT"),
              resultSet.getString("RECOMMENDED_CARD"),
              trimToEmpty(resultSet.getString("RECOMMENDED_CARD_BENEFITS")),
              round2(resultSet.getDouble("CURRENT_BALANCE_AMOUNT")),
              round2(resultSet.getDouble("BALANCE_AVG_3M")),
              resultSet.getInt("TOTAL_TRANSACTIONS"),
              resultSet.getInt("ABONOS_COUNT_30D"),
              resultSet.getInt("CARGOS_COUNT_30D"),
              resultSet.getString("TRANSACTION_PROFILE"),
              resultSet.getInt("TENURE_DAYS"),
              campaign));
        }
        return new SegmentExportAggregate(segmentLabel, rows.size(), buildCsv(rows));
      }
    }
  }

  private String buildCsv(List<Map<String, Object>> rows) {
    return CsvContentBuilder.fromMaps(new String[] {
        "ID_RECOMPENSAS",
        "NIVEL_CLIENTE_ID",
        "NIVEL_CLIENTE",
        "NIVEL_CLIENTE_REGLA",
        "TARJETA_RECOMENDADA",
        "TARJETA_BENEFICIOS",
        "SALDO_PROMEDIO_HOY",
        "SALDO_PROMEDIO_CATALOGO",
        "SALDO_PROMEDIO_3_MESES",
        "TRANSACCIONES_TOTALES",
        "ABONOS_30D",
        "CARGOS_30D",
        "PERFIL_TRANSACCIONAL",
        "ANTIGUEDAD_DIAS",
        "ESTATUS_DE_LA_CUENTA",
        "FECHA_APERTURA_CUENTA",
        "ESTADO",
        "GENERO",
        "PRODUCTOS_ACTIVOS",
        "PRODUCTOS_FALTANTES",
        "TIENE_CUENTA_N2",
        "TIENE_CUENTA_N4",
        "TIENE_AHORRO_PROGRAMADO",
        "TIENE_INVERSION_DIARIA",
        "TIENE_TARJETA_CREDITO",
        "SALDO_CUENTA_N2",
        "SALDO_CUENTA_N4",
        "SALDO_AHORRO_PROGRAMADO",
        "SALDO_INVERSION_DIARIA",
        "SALDO_TARJETA_CREDITO",
        "ESTATUS_CUENTA_BILLU",
        "TDC",
        "PRODUCTO_TDC",
        "ESTATUS_TDC",
        "TARJETA_FISICA",
        "TARJETA_DIGITAL",
        "ESTATUS_TARJETA",
        "TD_RECIENTE_FISICA",
        "TD_RECIENTE_DIGITAL",
        "DISENO_TARJETA",
        "FECHA_SOLICITUD_TARJETA",
        "FECHA_VENCIMIENTO_TARJETA",
        "FECHA_1ER_CARGO",
        "DIAS_1ER_CARGO",
        "MESES_1ER_CARGO",
        "SALDO_META_AHORRO",
        "FECHA_APERTURA_INVERSION",
        "CAMPANAS_ASIGNADAS",
        "CAMPANA_SUGERIDA"
    }, rows);
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
    private final String csvContent;

    private SegmentExportAggregate(String segmentLabel, int rowCount, String csvContent) {
      this.segmentLabel = segmentLabel;
      this.rowCount = rowCount;
      this.csvContent = csvContent;
    }
  }
}
