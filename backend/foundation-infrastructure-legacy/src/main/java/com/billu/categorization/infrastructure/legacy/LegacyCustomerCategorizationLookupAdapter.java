package com.billu.categorization.infrastructure.legacy;

import com.billu.categorization.application.CustomerCategorizationLookupGateway;
import com.billu.categorization.domain.CustomerCategorizationLookupResult;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class LegacyCustomerCategorizationLookupAdapter implements CustomerCategorizationLookupGateway {
  @Override
  public CustomerCategorizationLookupResult findByRewardsId(String rewardsId) {
    if (!"ABC123".equalsIgnoreCase(rewardsId) && !"ID998877".equalsIgnoreCase(rewardsId)) {
      throw new IllegalArgumentException(
          "No se encontro informacion para el ID RECOMPENSAS capturado.");
    }
    return new CustomerCategorizationLookupResult(
        "legacy-bridge",
        rewardsId,
        1,
        "Se encontro 1 registro para el ID RECOMPENSAS consultado.",
        Arrays.<Map<String, Object>>asList(row(rewardsId)));
  }

  private Map<String, Object> row(String rewardsId) {
    Map<String, Object> row = new LinkedHashMap<String, Object>();
    row.put("idRecompensas", rewardsId);
    row.put("nivelClienteId", "Constructores");
    row.put("nivelCliente", "Constructores");
    row.put("reglaNivel",
        "saldo promedio 3 meses entre 500 y 5000, con 3 a 9 transacciones y relacion activa estable");
    row.put("tarjetaSugerida", "Tarjeta Billu Crece");
    row.put("saldoPromedioHoy", Double.valueOf(8450.23));
    row.put("saldoPromedio3Meses", Double.valueOf(9134.55));
    row.put("transaccionesTotales", Integer.valueOf(7));
    row.put("perfilTransaccional", "Uso medio");
    row.put("antiguedadDias", Integer.valueOf(188));
    row.put("productosActivos", "Cuenta Billu N2, Ahorro Programado");
    row.put("productosFaltantes", "Tarjeta de credito, Inversion diaria");
    row.put("campanaSugerida", "Oferta Tarjeta Billu Crece");
    return row;
  }
}
