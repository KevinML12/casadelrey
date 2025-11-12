# Sistema de Donaciones - Preparado para Integración con Pasarela de Pago

## Flujo de Donaciones Implementado

### Backend (Go)

**Modelo de Datos: `Donation`**

| Campo          | Tipo    | Descripción                                    |
|----------------|---------|------------------------------------------------|
| id             | uint    | ID autoincremental                             |
| created_at     | timestamp | Fecha de creación                            |
| updated_at     | timestamp | Fecha de actualización                       |
| deleted_at     | timestamp | Soft delete                                  |
| name           | string  | Nombre del donante (opcional)                  |
| email          | string  | Correo electrónico (requerido)                 |
| amount         | float64 | Monto de la donación                           |
| payment_method | string  | Método de pago (Ebi Pay, PayPal, etc.)         |
| message        | string  | Mensaje del donante (opcional)                 |
| status         | string  | Estado: Pending, Completed, Failed             |
| transaction_id | string  | ID de la transacción de la pasarela           |

**Endpoint: POST `/api/donations/order`**

Crea una orden de donación pendiente y retorna la URL de redirección a la pasarela de pago.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "amount": 10000,
  "payment_method": "Ebi Pay",
  "message": "Para el trabajo de la iglesia"
}
```

**Response (200 OK):**
```json
{
  "message": "Orden de donación creada con éxito. Redirigiendo a Ebi Pay...",
  "order_id": "ORD-CDR-juan",
  "redirect_url": "https://ebi.pay.simulated/checkout?order_id=ORD-CDR-juan"
}
```

### Frontend (React)

**Componente: `DonationForm.jsx`**

Características:
- Formulario responsive con validación
- Campos: nombre (opcional), email, monto, método de pago, mensaje
- Redirección automática a la pasarela después de crear la orden
- Manejo de estados: idle, loading, success, error
- Timeout de 1.5 segundos antes de redirección

**Flujo de Usuario:**
1. Usuario llena el formulario de donación
2. Click en "Donar Ahora"
3. Frontend envía POST a `/api/donations/order`
4. Backend crea orden con estado "Pending"
5. Backend retorna `redirect_url`
6. Frontend muestra mensaje de éxito
7. Después de 1.5 segundos, redirige a la URL de la pasarela
8. Usuario completa el pago en la pasarela externa
9. (Futuro) Webhook de la pasarela actualiza el estado a "Completed"

## Preparación para Integración Real

### Paso 1: Configurar Credenciales de Pasarela

Agregar al archivo `.env`:
```env
EBI_PAY_API_KEY="tu_api_key_aqui"
EBI_PAY_SECRET="tu_secret_aqui"
EBI_PAY_MERCHANT_ID="tu_merchant_id"
```

### Paso 2: Implementar Cliente de Pasarela

Crear archivo `backend/payments/ebi_pay.go`:
```go
package payments

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"
)

type EbiPayClient struct {
    APIKey     string
    Secret     string
    MerchantID string
    BaseURL    string
}

func NewEbiPayClient() *EbiPayClient {
    return &EbiPayClient{
        APIKey:     os.Getenv("EBI_PAY_API_KEY"),
        Secret:     os.Getenv("EBI_PAY_SECRET"),
        MerchantID: os.Getenv("EBI_PAY_MERCHANT_ID"),
        BaseURL:    "https://api.ebi.pay/v1",
    }
}

func (c *EbiPayClient) CreateOrder(amount float64, email string) (string, error) {
    // Implementar llamada real a la API de Ebi Pay
    // Retornar la URL de redirección real
}
```

### Paso 3: Modificar Handler

En `backend/main.go`, reemplazar la lógica simulada:
```go
func createDonationOrder(c echo.Context) error {
    // ... validaciones existentes ...
    
    // LLAMADA REAL A LA PASARELA
    ebiClient := payments.NewEbiPayClient()
    redirectURL, err := ebiClient.CreateOrder(d.Amount, d.Email)
    if err != nil {
        return c.JSON(http.StatusInternalServerError, map[string]string{
            "error": "Error al crear la orden en la pasarela de pago",
        })
    }
    
    d.Status = "Pending"
    d.TransactionID = "ORD-" + generateUniqueID()
    
    // Guardar en BD...
    
    return c.JSON(http.StatusOK, map[string]interface{}{
        "order_id": d.TransactionID,
        "redirect_url": redirectURL, // URL REAL de Ebi Pay
    })
}
```

### Paso 4: Implementar Webhook

Crear endpoint para recibir notificaciones de la pasarela:
```go
e.POST("/api/webhooks/ebi-pay", handleEbiPayWebhook)

func handleEbiPayWebhook(c echo.Context) error {
    // Validar firma del webhook
    // Actualizar estado de la donación
    // Enviar email de confirmación
}
```

## Configuración Frontend para Producción

En producción, cambiar la URL base en `DonationForm.jsx`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const response = await fetch(`${API_BASE_URL}/api/donations/order`, {
    // ...
});
```

## URLs de Retorno

Configurar en la pasarela:
- **URL de Éxito:** `https://casadelrey.com/donation/success?order_id={ORDER_ID}`
- **URL de Error:** `https://casadelrey.com/donation/error?order_id={ORDER_ID}`
- **URL de Webhook:** `https://api.casadelrey.com/api/webhooks/ebi-pay`

## Seguridad

1. **Validar Webhooks:** Verificar firma HMAC de cada webhook
2. **HTTPS Obligatorio:** En producción, solo aceptar conexiones HTTPS
3. **Rate Limiting:** Limitar intentos de creación de órdenes
4. **Logs:** Registrar todas las transacciones para auditoría
5. **Montos Máximos:** Establecer límites razonables

## Testing

### Modo Sandbox
La mayoría de pasarelas ofrecen un entorno de prueba:
```env
EBI_PAY_SANDBOX=true
EBI_PAY_API_URL="https://sandbox.ebi.pay/api/v1"
```

### Tarjetas de Prueba
Usar tarjetas de prueba proporcionadas por la pasarela para simular diferentes escenarios.

## Estado Actual

- ✅ Modelo de datos creado
- ✅ Endpoint de creación de órdenes implementado
- ✅ Formulario frontend con redirección
- ✅ Estado "Pending" para órdenes
- ⏳ Integración real con pasarela (pendiente)
- ⏳ Sistema de webhooks (pendiente)
- ⏳ Confirmación por email (pendiente)

## Próximos Pasos

1. Elegir y contratar pasarela de pago (Ebi Pay, Flow, Mercado Pago, etc.)
2. Obtener credenciales de API
3. Implementar cliente de la pasarela
4. Configurar webhooks
5. Probar en modo sandbox
6. Deploy a producción
