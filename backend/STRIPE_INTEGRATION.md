# API de Donaciones - Documentación para Backend

## Endpoint: POST /api/donate

### Request Body
```json
{
  "amount": 100.00,
  "paymentMethodId": "pm_1234567890abcdef",
  "name": "Juan Pérez"
}
```

### Headers
```
Content-Type: application/json
```

### Campos del Request

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `amount` | `float` | Monto de la donación en USD | Requerido, > 0 |
| `paymentMethodId` | `string` | ID del Payment Method de Stripe | Requerido, formato `pm_*` |
| `name` | `string` | Nombre del donante | Requerido |

### Response Exitoso (200 OK)
```json
{
  "success": true,
  "message": "Donación procesada exitosamente",
  "transactionId": "txn_1234567890",
  "amount": 100.00,
  "donorName": "Juan Pérez"
}
```

### Response de Error (400/500)
```json
{
  "success": false,
  "message": "Error al procesar el pago: descripción del error"
}
```

## Implementación en Backend (Go)

### 1. Instalar Stripe Go SDK
```bash
go get github.com/stripe/stripe-go/v78
```

### 2. Configurar clave secreta de Stripe
```go
import "github.com/stripe/stripe-go/v78"

func init() {
    stripe.Key = os.Getenv("STRIPE_SECRET_KEY") // sk_test_...
}
```

### 3. Endpoint Handler (Echo Framework)
```go
package handlers

import (
    "net/http"
    "github.com/labstack/echo/v4"
    "github.com/stripe/stripe-go/v78"
    "github.com/stripe/stripe-go/v78/paymentintent"
)

type DonationRequest struct {
    Amount          float64 `json:"amount" validate:"required,gt=0"`
    PaymentMethodID string  `json:"paymentMethodId" validate:"required"`
    Name            string  `json:"name" validate:"required"`
}

type DonationResponse struct {
    Success       bool    `json:"success"`
    Message       string  `json:"message"`
    TransactionID string  `json:"transactionId,omitempty"`
    Amount        float64 `json:"amount,omitempty"`
    DonorName     string  `json:"donorName,omitempty"`
}

func CreateDonation(c echo.Context) error {
    var req DonationRequest
    
    // Bind y validar request
    if err := c.Bind(&req); err != nil {
        return c.JSON(http.StatusBadRequest, DonationResponse{
            Success: false,
            Message: "Datos inválidos",
        })
    }
    
    // Convertir monto a centavos (Stripe usa centavos)
    amountInCents := int64(req.Amount * 100)
    
    // Crear Payment Intent con Stripe
    params := &stripe.PaymentIntentParams{
        Amount:        stripe.Int64(amountInCents),
        Currency:      stripe.String("usd"),
        PaymentMethod: stripe.String(req.PaymentMethodID),
        Confirm:       stripe.Bool(true), // Confirmar inmediatamente
        Description:   stripe.String("Donación de " + req.Name),
        ReceiptEmail:  stripe.String("opcional@email.com"), // Opcional
    }
    
    pi, err := paymentintent.New(params)
    if err != nil {
        return c.JSON(http.StatusInternalServerError, DonationResponse{
            Success: false,
            Message: "Error al procesar el pago: " + err.Error(),
        })
    }
    
    // Verificar estado del pago
    if pi.Status != stripe.PaymentIntentStatusSucceeded {
        return c.JSON(http.StatusBadRequest, DonationResponse{
            Success: false,
            Message: "El pago no pudo ser completado",
        })
    }
    
    // TODO: Guardar la donación en la base de datos
    // donation := &models.Donation{
    //     Amount:          req.Amount,
    //     DonorName:       req.Name,
    //     StripePaymentID: pi.ID,
    //     Status:          "completed",
    //     CreatedAt:       time.Now(),
    // }
    // db.Create(donation)
    
    return c.JSON(http.StatusOK, DonationResponse{
        Success:       true,
        Message:       "Donación procesada exitosamente",
        TransactionID: pi.ID,
        Amount:        req.Amount,
        DonorName:     req.Name,
    })
}
```

### 4. Registrar ruta en main.go
```go
func main() {
    e := echo.New()
    
    // CORS middleware
    e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
        AllowOrigins: []string{"http://localhost:3001"},
        AllowMethods: []string{echo.POST, echo.GET},
    }))
    
    // Rutas
    e.POST("/api/donate", handlers.CreateDonation)
    
    e.Logger.Fatal(e.Start(":8080"))
}
```

### 5. Variables de Entorno (.env)
```bash
# Backend
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui

# Base de datos
DATABASE_URL=postgresql://...
```

## Modelo de Base de Datos (opcional)

### Tabla: donations
```sql
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modelo GORM (Go)
```go
type Donation struct {
    ID              uint      `gorm:"primaryKey" json:"id"`
    Amount          float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
    DonorName       string    `gorm:"size:255;not null" json:"donorName"`
    StripePaymentID string    `gorm:"size:255;unique;not null" json:"stripePaymentId"`
    Status          string    `gorm:"size:50;default:completed" json:"status"`
    CreatedAt       time.Time `json:"createdAt"`
    UpdatedAt       time.Time `json:"updatedAt"`
}
```

## Testing

### Usar tarjetas de prueba de Stripe:
- Tarjeta exitosa: `4242 4242 4242 4242`
- Tarjeta rechazada: `4000 0000 0000 0002`
- Requiere autenticación: `4000 0025 0000 3155`
- Fecha de expiración: Cualquier fecha futura
- CVC: Cualquier 3 dígitos


## Notas Importantes

1. **Clave secreta**: Usa `sk_test_...` para desarrollo, `sk_live_...` para producción
2. **Webhook (opcional)**: Para eventos asíncronos (reembolsos, disputas)
3. **Logs**: Guarda logs de todas las transacciones para debugging
4. **Seguridad**: La clave secreta NUNCA debe exponerse al frontend
5. **Montos**: Stripe usa centavos, multiplicar por 100
6. **Currency**: USD configurado, cambiar según necesidad

## Recursos
- [Stripe Go SDK](https://github.com/stripe/stripe-go)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)
- [Testing Cards](https://stripe.com/docs/testing)
