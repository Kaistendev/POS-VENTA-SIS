# Estándares de Seguridad y Privacidad — Módulo de IA

## 1. Principios Generales

El módulo de IA (Red Neuronal + Phi3/LLM) opera bajo el principio de **solo lectura** respecto a la base de datos del sistema. Ningún componente de IA inyecta, modifica o elimina datos directamente en la BD.

Los datos generados por IA pasan por un **pipeline de validación obligatorio** antes de cualquier persistencia.

---

## 2. Arquitectura de Seguridad

```
Usuario → [Chat UI] → [Orquestador] → [RN (confianza > umbral)] → Respuesta directa
                                       → [Phi3 (LLM)] → [Validador Zod] → [Cola de Revisión] → Aprobación
```

### 2.1 Capas de Defensa

| Capa | Descripción |
|------|-------------|
| **Validación de entrada** | Toda consulta del usuario se valida con `aiChatInputSchema` (Zod): longitud máxima 500 caracteres, sin caracteres prohibidos |
| **Sanitización** | Se eliminan caracteres de control, secuencias SQL y scripts XSS antes de procesar |
| **Clasificación** | La RN clasifica la intención; si la confianza es < umbral (0.7), se delega a Phi3 |
| **Pipeline de Validación** | Datos generados por IA se validan contra esquemas Zod estrictos antes de presentarse al usuario |
| **Aprobación Humana** | Toda acción de escritura requiere confirmación explícita del usuario mediante `AiDraftModal` |
| **Auditoría** | Cada acción generada por IA se registra en `audit_logs` con metadatos (fuente, confianza, latencia) |

---

## 3. Restricciones de Seguridad

### 3.1 Prohibiciones Absolutas
- ❌ La IA **nunca** modifica datos existentes directamente
- ❌ La IA **nunca** elimina entidades
- ❌ La IA **nunca** accede a contraseñas o datos sensibles de usuarios
- ❌ La IA **nunca** ejecuta comandos SQL directamente
- ❌ La IA **nunca** modifica configuraciones del sistema (`settings`)

### 3.2 Acciones Permitidas (Solo con Aprobación)
- ✅ Crear productos (borrador → revisión → confirmación)
- ✅ Crear clientes (borrador → revisión → confirmación)
- ✅ Preparar borradores de venta (borrador → revisión → confirmación)
- ✅ Consultar datos de inventario (solo lectura)
- ✅ Generar resúmenes de ventas (solo lectura)

---

## 4. Validación de Datos Generados

Todo dato generado por IA debe pasar por el esquema Zod correspondiente:

| Esquema | Validaciones Clave |
|---------|-------------------|
| `aiEntityCreationSchema` | entity_type, name requerido, rangos numéricos, formato DNI/RUC |
| `aiSaleDraftSchema` | Mínimo 1 item, cantidades positivas, método de pago válido |
| `aiChatInputSchema` | Longitud 1-500 caracteres |
| `aiIntentClassificationSchema` | Intent válido, confidence 0-1 |

### 4.1 Reglas de Validación
- **Precios**: No negativos, máximo 999,999.99
- **Stock**: Enteros no negativos, máximo 999,999
- **Nombres**: 1-200 caracteres, sin caracteres de control
- **DNI**: 6-15 caracteres alfanuméricos
- **RUC**: 11 dígitos numéricos

---

## 5. Privacidad de Datos

### 5.1 Datos que la IA NO debe exponer
- ✗ Contraseñas y hashes
- ✗ Preguntas y respuestas de seguridad
- ✗ Tokens de sesión
- ✗ Configuración interna del sistema
- ✗ Datos de otros clientes no autorizados

### 5.2 Datos que la IA PUEDE procesar
- ✓ Nombres de productos y precios
- ✓ Stock y movimientos de inventario
- ✓ Nombres de clientes (con autorización)
- ✓ Resúmenes agregados de ventas
- ✓ Métricas no sensibles del dashboard

### 5.3 Almacenamiento Seguro
- El modelo de RN entrenado se almacena en `src/infrastructure/neural/models/`
- No contiene datos de clientes ni información personal
- Los pesos del modelo son numéricos y no reversibles a datos originales
- El dataset de entrenamiento NO contiene datos reales de producción

---

## 6. Rate Limiting y Protección

### 6.1 Límites de Consulta
- Máximo 30 consultas por minuto por usuario al servicio de IA
- Consultas a Phi3 (LLM) tienen timeout de 30 segundos
- Si la RN clasifica con confianza > 0.9, se omite Phi3 para respuestas rápidas

### 6.2 Protección contra Abusos
- Las consultas maliciosas (SQL injection, prompt injection) se detectan mediante patrones regex
- Los intentos de manipulación del prompt se registran en audit_logs
- Las respuestas de Phi3 se sanitizan antes de mostrarse al usuario

---

## 7. Auditoría

Toda interacción con el módulo de IA se registra:

| Campo | Descripción |
|-------|-------------|
| `user_id` | Usuario que realizó la consulta |
| `action` | `AI_QUERY`, `AI_DRAFT_CREATED`, `AI_DRAFT_CONFIRMED`, `AI_DRAFT_REJECTED` |
| `entity` | `ai_chat`, `ai_draft` |
| `metadata` | JSON con tipo de intent, fuente (RN/Phi3), confianza, latencia |

---

## 8. Dependencias Seguras

| Paquete | Versión | Propósito | Auditoría |
|---------|---------|-----------|-----------|
| `@tensorflow/tfjs` | ^4.22.0 | Inferencia de RN en CPU/GPU | Revisión periódica de CVEs |
| `zod` | ^4.x | Validación de esquemas | Sin vulnerabilidades conocidas |
| Ollama (externo) | última | Servidor Phi3 local | Aísla en localhost, sin exposición de red |

Toda dependencia se audita regularmente con `pnpm audit`.

---

## 9. Controles de Acceso

- El endpoint `ai:chat` requiere autenticación (usuario logueado)
- Los roles se verifican: ADMIN y VENDEDOR pueden usar IA
- Solo ADMIN puede ver/confirmar borradores de categorías, proveedores
- VENDEDOR solo puede crear productos y clientes mediante IA

---

## 10. Checklist de Despliegue Seguro

- [ ] Phi3 configurado solo en localhost (127.0.0.1)
- [ ] Puerto Ollama no expuesto a la red
- [ ] Timeout de 30s configurado en `OllamaAiProvider`
- [ ] Validación Zod en toda entrada de usuario
- [ ] Auditoría habilitada para todas las acciones de IA
- [ ] Rate limiting activo (30 req/min)
- [ ] Modelo RN no contiene datos personales
- [ ] Pipeline de validación obligatorio antes de persistir
