# Customer Summary Frontend

Primera version institucional del frontend para `Resumen de Clientes`.

## Contenido

- `index.html`: SPA ligera sin toolchain
- `styles.css`: layout institucional inicial
- `app.js`: consumo de endpoints y render del dashboard
- `preview-server.ps1`: servidor local estatico con proxy a `/internal/*`

## Ejecutar localmente

1. Levanta el backend en `http://localhost:8080`.
2. En PowerShell:

```powershell
cd frontend/customer-summary
.\preview-server.ps1
```

3. Abre `http://localhost:8090`.

## Notas

- El preview server evita problemas de CORS al hacer proxy al backend.
- La interfaz usa los endpoints del slice ya implementado en foundation.
- Si el backend vive en otra URL:

```powershell
.\preview-server.ps1 -BackendBaseUrl http://localhost:9080
```
