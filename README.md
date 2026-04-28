# Proyecto Billu IA

Aplicacion Spring Boot 2.7 compatible con Java 8 para los modulos internos de Billu.

## Requisitos locales

- JDK 8
- Maven 3.x
- Oracle local accesible en `jdbc:oracle:thin:@//localhost:1521/xepdb1`
- Usuario admin de Oracle para crear tablas y grants. En el entorno local usado por el proyecto:
  - usuario: `SYSTEM`
  - password: `password`

## Bootstrap local de Oracle

El proyecto incluye un script para crear todas las tablas `DLK_*`, cargar el catalogo de datos y sembrar los datos dummy que usa la aplicacion.

```powershell
Copy-Item .env.example .env
powershell -NoProfile -ExecutionPolicy Bypass -File backend\scripts\bootstrap-local-oracle.ps1
```

Por defecto el script:

- Usa `SYSTEM/password` como admin local.
- Crea o actualiza el usuario de aplicacion `BILLU_READ`.
- Elimina y recrea las tablas `DLK_*` del schema admin.
- Ejecuta `backend/config/oracle/billu_datalake_mvp.sql`.
- Ejecuta `backend/config/oracle/billu_data_catalog_seed.sql`.
- Ejecuta `backend/config/oracle/billu_datalake_seed_demo.sql`.
- Crea grants y sinonimos para que la app consulte como `BILLU_READ`.

Para conservar tablas existentes, agrega `-NoReset`.

## Correr la app

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend\scripts\run-local-oracle.ps1
```

La app queda en:

- `http://localhost:8080/customer-categorization/`
- `http://localhost:8080/internal/platform/health`

El script de arranque tambien levanta ngrok para el puerto `8080`, salvo que se use `-SkipNgrok`.
