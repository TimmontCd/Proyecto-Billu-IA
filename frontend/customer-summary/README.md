# Customer Summary Frontend

Primera version institucional del frontend para `Resumen de Clientes`.

## Contenido

- `index.html`: SPA ligera sin toolchain
- `styles.css`: layout institucional inicial
- `app.js`: consumo de endpoints y render del dashboard
- `preview-server.ps1`: servidor local estatico con proxy a `/internal/*`

## Ejecutar localmente

Opcion integrada:

1. Levanta el backend en `http://localhost:8080`.
2. Abre `http://localhost:8080/customer-summary/`.

Opcion estatica con proxy:

1. Levanta el backend en `http://localhost:8080`.
2. En PowerShell:

```powershell
cd frontend/customer-summary
.\preview-server.ps1
```

3. Abre `http://localhost:8090`.

## Notas

- El WAR sirve la misma pantalla desde `/customer-summary/`.
- El preview server evita problemas de CORS al hacer proxy al backend.
- La interfaz muestra estado de backend, ambiente, fuente, Oracle y legacy.
- Si el backend vive en otra URL:

```powershell
.\preview-server.ps1 -BackendBaseUrl http://localhost:9080
```
