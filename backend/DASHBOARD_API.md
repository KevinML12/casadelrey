# API de Dashboard (KPIs) - Documentación para Backend

## Endpoint: GET /api/admin/kpis

### Descripción
Retorna los indicadores clave de rendimiento (KPIs) y datos para gráficos del dashboard administrativo.

### Headers
```
Authorization: Bearer <token>
```

### Response Exitoso (200 OK)
```json
{
  "kpis": {
    "donations": {
      "value": "$3,210.00",
      "count": 45
    },
    "members": {
      "value": "152",
      "growth": "+5"
    },
    "events": {
      "value": "24",
      "upcoming": 3
    },
    "groups": {
      "value": "8",
      "activeMembers": 98
    }
  },
  "charts": {
    "monthly": [
      {
        "mes": "Ene",
        "donaciones": 2400,
        "miembros": 140
      },
      {
        "mes": "Feb",
        "donaciones": 1398,
        "miembros": 145
      },
      {
        "mes": "Mar",
        "donaciones": 3800,
        "miembros": 148
      },
      {
        "mes": "Abr",
        "donaciones": 3908,
        "miembros": 150
      },
      {
        "mes": "May",
        "donaciones": 4800,
        "miembros": 152
      },
      {
        "mes": "Jun",
        "donaciones": 3800,
        "miembros": 155
      }
    ],
    "donations": [
      {
        "mes": "Ene",
        "monto": 2400
      },
      {
        "mes": "Feb",
        "monto": 1398
      },
      {
        "mes": "Mar",
        "monto": 3800
      },
      {
        "mes": "Abr",
        "monto": 3908
      },
      {
        "mes": "May",
        "monto": 4800
      },
      {
        "mes": "Jun",
        "monto": 3800
      }
    ]
  }
}
```

### Response de Error (401 Unauthorized)
```json
{
  "error": "No autorizado",
  "message": "Token inválido o expirado"
}
```

## Implementación en Backend (Go)

### 1. Modelo de Respuesta
```go
package models

type KPIData struct {
    Value string `json:"value"`
    Count int    `json:"count,omitempty"`
    Growth string `json:"growth,omitempty"`
}

type ChartDataPoint struct {
    Mes        string  `json:"mes"`
    Donaciones float64 `json:"donaciones,omitempty"`
    Miembros   int     `json:"miembros,omitempty"`
    Monto      float64 `json:"monto,omitempty"`
}

type DashboardResponse struct {
    KPIs struct {
        Donations KPIData `json:"donations"`
        Members   KPIData `json:"members"`
        Events    KPIData `json:"events"`
        Groups    KPIData `json:"groups"`
    } `json:"kpis"`
    Charts struct {
        Monthly   []ChartDataPoint `json:"monthly"`
        Donations []ChartDataPoint `json:"donations"`
    } `json:"charts"`
}
```

### 2. Handler
```go
package handlers

import (
    "net/http"
    "time"
    "github.com/labstack/echo/v4"
    "gorm.io/gorm"
)

func GetDashboardKPIs(c echo.Context) error {
    db := c.Get("db").(*gorm.DB)
    
    // Calcular KPIs
    var totalDonations float64
    db.Model(&Donation{}).
        Where("created_at >= ?", time.Now().AddDate(0, -6, 0)).
        Select("COALESCE(SUM(amount), 0)").
        Scan(&totalDonations)
    
    var membersCount int64
    db.Model(&User{}).Where("role = ?", "member").Count(&membersCount)
    
    var eventsCount int64
    db.Model(&Event{}).Count(&eventsCount)
    
    var groupsCount int64
    db.Model(&Group{}).Count(&groupsCount)
    
    // Datos para gráficos (últimos 6 meses)
    monthlyData := []ChartDataPoint{}
    donationsData := []ChartDataPoint{}
    
    for i := 5; i >= 0; i-- {
        month := time.Now().AddDate(0, -i, 0)
        monthName := month.Format("Jan")
        
        // Donaciones del mes
        var monthDonations float64
        db.Model(&Donation{}).
            Where("EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?", 
                month.Month(), month.Year()).
            Select("COALESCE(SUM(amount), 0)").
            Scan(&monthDonations)
        
        // Miembros al final del mes
        var monthMembers int64
        db.Model(&User{}).
            Where("created_at <= ? AND role = ?", 
                month.AddDate(0, 1, 0), "member").
            Count(&monthMembers)
        
        monthlyData = append(monthlyData, ChartDataPoint{
            Mes:        monthName,
            Donaciones: monthDonations,
            Miembros:   int(monthMembers),
        })
        
        donationsData = append(donationsData, ChartDataPoint{
            Mes:   monthName,
            Monto: monthDonations,
        })
    }
    
    response := DashboardResponse{}
    response.KPIs.Donations = KPIData{
        Value: fmt.Sprintf("$%.2f", totalDonations),
    }
    response.KPIs.Members = KPIData{
        Value: fmt.Sprintf("%d", membersCount),
    }
    response.KPIs.Events = KPIData{
        Value: fmt.Sprintf("%d", eventsCount),
    }
    response.KPIs.Groups = KPIData{
        Value: fmt.Sprintf("%d", groupsCount),
    }
    response.Charts.Monthly = monthlyData
    response.Charts.Donations = donationsData
    
    return c.JSON(http.StatusOK, response)
}
```

### 3. Middleware de Autenticación
```go
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        token := c.Request().Header.Get("Authorization")
        if token == "" {
            return c.JSON(http.StatusUnauthorized, map[string]string{
                "error": "No autorizado",
                "message": "Token no proporcionado",
            })
        }
        
        // Validar token JWT
        // ... lógica de validación
        
        return next(c)
    }
}
```

### 4. Registrar Ruta
```go
func main() {
    e := echo.New()
    
    // Rutas protegidas
    admin := e.Group("/api/admin")
    admin.Use(AuthMiddleware)
    admin.GET("/kpis", handlers.GetDashboardKPIs)
    
    e.Logger.Fatal(e.Start(":8080"))
}
```

## Consultas SQL Útiles

### Total de donaciones (últimos 6 meses)
```sql
SELECT COALESCE(SUM(amount), 0) as total
FROM donations
WHERE created_at >= NOW() - INTERVAL '6 months';
```

### Donaciones por mes
```sql
SELECT 
    TO_CHAR(created_at, 'Mon') as mes,
    SUM(amount) as monto
FROM donations
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
ORDER BY EXTRACT(MONTH FROM created_at);
```

### Miembros activos por mes
```sql
SELECT 
    TO_CHAR(date_trunc('month', created_at), 'Mon') as mes,
    COUNT(*) as miembros
FROM users
WHERE role = 'member'
    AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY date_trunc('month', created_at)
ORDER BY date_trunc('month', created_at);
```

## Testing

### Usar curl
```bash
curl -X GET http://localhost:8080/api/admin/kpis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Usar Postman
1. Crear request GET a `http://localhost:8080/api/admin/kpis`
2. Agregar header `Authorization: Bearer <token>`
3. Enviar request

## Notas

1. **Cache**: Considera cachear los KPIs por 5-10 minutos (Redis)
2. **Permisos**: Solo usuarios admin deben acceder
3. **Performance**: Usa índices en `created_at`, `role`
4. **Formato de fechas**: Frontend espera nombres de meses en español ("Ene", "Feb", etc.)
