# API Endpoints Examples (Mi Hacienda ERP)

Base URL: `http://localhost:3001/api`

### 🐄 Animals (Ganado)

#### 1. List Animals
Returns all animals in the database.
- **Method**: `GET`
- **URL**: `/api/animals`
- **Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "tag": "A-001",
    "name": "Bella",
    "breed": "Jersey",
    "gender": "Hembra",
    "weight": 420.5,
    "status": "Healthy",
    "farmId": "default-farm",
    "createdAt": "2026-04-05T...",
    "updatedAt": "2026-04-05T..."
  }
]
```

#### 2. Create Animal
Registers a new animal.
- **Method**: `POST`
- **URL**: `/api/animals`
- **Body**:
```json
{
  "tag": "A-005",
  "name": "Furia",
  "breed": "Nelore",
  "gender": "Macho",
  "weight": 600,
  "farmId": "default-farm"
}
```
- **Response**: `201 Created`

---

### 🚜 Farms (Haciendas)

#### 1. List Farms
- **Method**: `GET`
- **URL**: `/api/farms` (Implementation pending)

---

### 🏥 Health (Sanidad) - Coming Soon
- Registration of vaccines and treatments.

---

### 📊 Reports - Coming Soon
- Weight gain charts.
- Inventory summary.
