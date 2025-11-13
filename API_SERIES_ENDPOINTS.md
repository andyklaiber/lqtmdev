# Series API Endpoints Documentation

This document describes the API endpoints for managing race series, including season pass pricing configuration.

## Base URL
All endpoints are prefixed with `/api/series`

## Authentication
All write operations (POST, PATCH, PUT, DELETE) require admin authentication via session cookie.

---

## Endpoints

### 1. Get Series by ID
**GET** `/api/series/:id`

Retrieves a single series document by its ID.

**Parameters:**
- `id` (path parameter) - The series ID

**Response:**
```json
{
  "seriesId": "bear_gravity_2026",
  "name": "Bear Gravity Series",
  "displayName": "Bear Gravity Series 2026",
  "year": 2026,
  "active": true,
  "description": "Bear Gravity Series downhill racing",
  "seasonPassPricing": {
    "categoryGroups": [...],
    "defaultAmount": 360,
    "defaultName": "Season Pass"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Series not found

---

### 2. Create New Series
**POST** `/api/series/`

Creates a new series document.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "seriesId": "bear_gravity_2026",
  "name": "Bear Gravity Series",
  "displayName": "Bear Gravity Series 2026",
  "year": 2026,
  "active": true,
  "description": "Bear Gravity Series downhill racing",
  "seasonPassPricing": {
    "categoryGroups": [
      {
        "name": "High School/Middle School Season Pass - $300",
        "categories": ["high_school_jvvarsity_boys", "high_school_freshsoph_boys"],
        "amount": 300
      }
    ],
    "defaultAmount": 360,
    "defaultName": "Season Pass"
  }
}
```

**Required Fields:**
- `seriesId` (string) - Unique identifier for the series
- `name` (string) - Short name of the series
- `displayName` (string) - Full display name
- `year` (number) - Year of the series

**Optional Fields:**
- `active` (boolean) - Whether the series is active (defaults to `true`)
- `description` (string) - Description of the series
- `seasonPassPricing` (object) - Season pass pricing configuration

**Response:**
Returns the created series document.

**Status Codes:**
- `200` - Success
- `400` - Bad request (missing required fields or invalid data)
- `409` - Conflict (series with this ID already exists)
- `401` - Unauthorized

---

### 3. Update Series Properties
**PATCH** `/api/series/:id`

Updates one or more properties of an existing series.

**Authentication:** Required (Admin)

**Parameters:**
- `id` (path parameter) - The series ID

**Request Body:**
You can include any of the following fields to update:
```json
{
  "name": "Updated Series Name",
  "displayName": "Updated Display Name",
  "year": 2026,
  "active": false,
  "description": "Updated description",
  "seasonPassPricing": {
    "categoryGroups": [...],
    "defaultAmount": 360,
    "defaultName": "Season Pass"
  }
}
```

**Allowed Fields:**
- `name` (string)
- `displayName` (string)
- `year` (number)
- `active` (boolean)
- `description` (string)
- `seasonPassPricing` (object)

**Response:**
Returns the complete updated series document.

**Status Codes:**
- `200` - Success
- `400` - Bad request (no valid fields provided or invalid data)
- `404` - Series not found
- `401` - Unauthorized

---

### 4. Update Season Pass Pricing
**PUT** `/api/series/:id/season-pass-pricing`

Replaces the entire `seasonPassPricing` configuration for a series.

**Authentication:** Required (Admin)

**Parameters:**
- `id` (path parameter) - The series ID

**Request Body:**
```json
{
  "categoryGroups": [
    {
      "name": "High School/Middle School Season Pass - $300",
      "categories": [
        "high_school_jvvarsity_boys",
        "high_school_freshsoph_boys",
        "high_school_jvvarsity_girls",
        "high_school_freshsoph_girls"
      ],
      "amount": 300
    },
    {
      "name": "Adult Season Pass - $360",
      "categories": [
        "pro_men",
        "pro_women",
        "expert_men_18_minus_44",
        "sport_men_18_minus_44",
        "beginner_men"
      ],
      "amount": 360
    }
  ],
  "defaultAmount": 360,
  "defaultName": "Season Pass"
}
```

**Required Fields:**
- `categoryGroups` (array) - Array of category group objects
  - Each group must have:
    - `name` (string) - Display name for the group
    - `categories` (array of strings) - Category IDs in this group
    - `amount` (number) - Price for this group
- `defaultAmount` (number) - Default price for categories not in any group
- `defaultName` (string) - Default display name

**Response:**
```json
{
  "success": true,
  "seasonPassPricing": {
    "categoryGroups": [...],
    "defaultAmount": 360,
    "defaultName": "Season Pass"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid structure)
- `404` - Series not found
- `401` - Unauthorized

---

### 5. Remove Season Pass Pricing
**DELETE** `/api/series/:id/season-pass-pricing`

Removes the `seasonPassPricing` configuration from a series.

**Authentication:** Required (Admin)

**Parameters:**
- `id` (path parameter) - The series ID

**Response:**
```json
{
  "success": true,
  "message": "Season pass pricing removed"
}
```

**Status Codes:**
- `200` - Success
- `404` - Series not found
- `401` - Unauthorized

---

### 6. Get Series Races
**GET** `/api/series/:id/races`

Retrieves all active races for a series along with series results.

**Parameters:**
- `id` (path parameter) - The series ID

**Response:**
Returns series results with embedded race information.

**Status Codes:**
- `200` - Success
- `404` - Series not found

---

### 7. Get Series Registration Races
**GET** `/api/series/:id/registration`

Retrieves minimal race information for active races in a series (used for registration).

**Parameters:**
- `id` (path parameter) - The series ID

**Response:**
```json
[
  {
    "raceid": "race_123",
    "racename": "Race 1",
    "displayName": "Race 1 - Bear Mountain",
    "eventDate": "2026-05-15T10:00"
  }
]
```

**Status Codes:**
- `200` - Success
- `404` - No active races found

---

## Season Pass Pricing Structure

The `seasonPassPricing` object allows you to configure different prices for different category groups:

```json
{
  "categoryGroups": [
    {
      "name": "Display name shown to users",
      "categories": ["category_id_1", "category_id_2"],
      "amount": 300
    }
  ],
  "defaultAmount": 360,
  "defaultName": "Season Pass"
}
```

### How it works:
1. When a racer registers for a race with a season pass payment option, the system looks up their category
2. It searches through `categoryGroups` to find which group contains their category
3. If found, it uses that group's `amount` and `name`
4. If not found, it uses `defaultAmount` and `defaultName`

### Example:
```json
{
  "categoryGroups": [
    {
      "name": "High School Season Pass - $300",
      "categories": ["high_school_jvvarsity_boys", "high_school_freshsoph_boys"],
      "amount": 300
    },
    {
      "name": "Adult Season Pass - $360",
      "categories": ["pro_men", "expert_men_18_minus_44"],
      "amount": 360
    }
  ],
  "defaultAmount": 360,
  "defaultName": "Season Pass"
}
```

In this example:
- High school boys pay $300
- Pro and expert men pay $360
- Any other category pays $360 (default)

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

---

## Usage Examples

### Example 1: Create a new series with season pass pricing

```bash
curl -X POST http://localhost:3000/api/series \
  -H "Content-Type: application/json" \
  -b "session=your_session_cookie" \
  -d '{
    "seriesId": "bear_gravity_2026",
    "name": "Bear Gravity Series",
    "displayName": "Bear Gravity Series 2026",
    "year": 2026,
    "active": true,
    "description": "Bear Gravity Series downhill racing",
    "seasonPassPricing": {
      "categoryGroups": [
        {
          "name": "High School Season Pass - $300",
          "categories": ["high_school_jvvarsity_boys"],
          "amount": 300
        }
      ],
      "defaultAmount": 360,
      "defaultName": "Season Pass"
    }
  }'
```

### Example 2: Update only the description

```bash
curl -X PATCH http://localhost:3000/api/series/bear_gravity_2026 \
  -H "Content-Type: application/json" \
  -b "session=your_session_cookie" \
  -d '{
    "description": "New description for the series"
  }'
```

### Example 3: Update season pass pricing

```bash
curl -X PUT http://localhost:3000/api/series/bear_gravity_2026/season-pass-pricing \
  -H "Content-Type: application/json" \
  -b "session=your_session_cookie" \
  -d '{
    "categoryGroups": [
      {
        "name": "Youth Season Pass - $250",
        "categories": ["high_school_jvvarsity_boys", "high_school_freshsoph_boys"],
        "amount": 250
      }
    ],
    "defaultAmount": 360,
    "defaultName": "Adult Season Pass"
  }'
```

### Example 4: Remove season pass pricing

```bash
curl -X DELETE http://localhost:3000/api/series/bear_gravity_2026/season-pass-pricing \
  -b "session=your_session_cookie"
```

### Example 5: Get series information

```bash
curl http://localhost:3000/api/series/bear_gravity_2026
```

---

## 5. Bulk Update Races in Series

**POST** `/api/series/:id/races`

Add or remove multiple races from a series in a single operation.

**Authentication:** Required (Admin)

**Parameters:**
- `id` (path parameter) - The series ID

**Request Body:**
```json
{
  "raceIds": ["race1", "race2", "race3"],
  "action": "add"  // or "remove"
}
```

**Fields:**
- `raceIds` (required) - Array of race IDs to update
- `action` (required) - Either "add" (assign races to series) or "remove" (unassign races from series)

**Response:**
```json
{
  "success": true,
  "action": "add",
  "seriesId": "bear_gravity_2026",
  "matchedCount": 3,
  "modifiedCount": 3,
  "raceIds": ["race1", "race2", "race3"]
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing fields, invalid action, empty array)
- `401` - Not authenticated
- `404` - Series not found

**Notes:**
- When action is "add", sets the `series` field on all matching races to the series ID
- When action is "remove", unsets the `series` field on all matching races
- `matchedCount` indicates how many races were found
- `modifiedCount` indicates how many races were actually updated (may be less if some already had the correct series value)

**Example - Add races to series:**
```bash
curl -X POST http://localhost:3000/api/series/bear_gravity_2026/races \
  -H "Content-Type: application/json" \
  -b "session=your_session_cookie" \
  -d '{
    "raceIds": ["race_001", "race_002", "race_003"],
    "action": "add"
  }'
```

**Example - Remove races from series:**
```bash
curl -X POST http://localhost:3000/api/series/bear_gravity_2026/races \
  -H "Content-Type: application/json" \
  -b "session=your_session_cookie" \
  -d '{
    "raceIds": ["race_001"],
    "action": "remove"
  }'
```

