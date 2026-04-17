# WhatsApp Agent PoC en Apps Script

Esta PoC usa el proyecto actual de Google Apps Script solo para validar rápido el flujo funcional de WhatsApp:

- validación del webhook con `doGet`
- recepción de eventos con `doPost`
- parsing del payload entrante
- clasificación de intención por reglas
- menú principal guiado
- respuestas orientativas
- placeholder de escalamiento a humano
- trazabilidad en Google Sheets

## Archivos clave

- `/Users/martinmercado/Documents/Martin/Innovacion Digital/Banco Digital/IA/PROYECTO BILLÚ/src/core/08_App.gs`
- `/Users/martinmercado/Documents/Martin/Innovacion Digital/Banco Digital/IA/PROYECTO BILLÚ/src/services/WhatsAppConversationalPocService.gs`
- `/Users/martinmercado/Documents/Martin/Innovacion Digital/Banco Digital/IA/PROYECTO BILLÚ/src/core/01_Config.gs`

## Configuración requerida en Script Properties

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_AGENT_SPREADSHEET_ID`

## Hojas usadas por la PoC

La PoC crea automáticamente estas pestañas dentro del spreadsheet configurado:

- `WhatsApp PoC Log`
- `WhatsApp PoC Escalamiento`

## Intenciones soportadas

- `saludo`
- `apertura_cuenta`
- `ayuda_registro`
- `productos_beneficios`
- `soporte`
- `hablar_asesor`
- `desconocida`

## Menú base

1. Abrir mi cuenta
2. Ayuda con mi registro
3. Productos y beneficios
4. Soporte
5. Hablar con un asesor

## Guardrails de esta PoC

Esta versión:

- no ejecuta operaciones bancarias sensibles
- no consulta saldos ni movimientos
- no autentica identidad
- no sustituye un proceso formal del banco

## Prueba rápida del webhook

### Verificación

Configura en Meta la URL del web app y usa el token definido en `WHATSAPP_VERIFY_TOKEN`.

Apps Script responderá la verificación desde `doGet`.

### Evento entrante

Meta enviará un `POST` y `WhatsAppConversationalPocService.handleWebhook(payload)`:

1. extrae mensaje y `wa_id`
2. clasifica intención
3. genera respuesta
4. intenta responder vía WhatsApp Cloud API
5. registra el intercambio
6. crea escalamiento si aplica

## Evolución recomendada

No inviertas demasiado en sofisticar esta PoC.

Úsala para:

- validar webhook
- validar tono
- validar menú
- validar logging
- validar handoff básico

La base definitiva debe ser Node.js + TypeScript en:

- `/Users/martinmercado/Documents/Martin/Innovacion Digital/Banco Digital/IA/PROYECTO BILLÚ/whatsapp-agent-node`
