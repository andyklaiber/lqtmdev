# Race Category & Payment Inheritance System

## Overview

The system supports a **hybrid category model** where races can inherit categories and payment options from a series, override them, or define race-specific categories with their own payment options.

## Core Concepts

### 1. Series Categories
- Defined at the **series level** in the `series` collection
- Shared across all races in the series
- Include category groups with associated payment options
- Provide consistency across the series

### 2. Race-Specific Categories
- Defined at the **race level** in the `races` collection
- Unique to a single race
- Can have forced payment types via `paytype` field
- Used for special events (kids races, time trials, etc.)

### 3. Race Overrides
- Races can override series category properties (laps, start time, etc.)
- Category is still identified as "from series" by matching `id`
- Allows race-level adjustments while maintaining series association

## Data Structure

### Series Document
```javascript
{
  seriesId: "bear_offroad_2026",
  name: "Bear Off-Road Series",
  year: 2026,
  
  // Series categories
  regCategories: [
    {
      id: "expert_men_18_minus_44",
      catdispname: "Expert Men 18-44",
      laps: 1,
      minAge: 18,
      maxAge: 44
    }
  ],
  
  // Category groups with payment options
  categoryGroups: [
    {
      name: "Expert Categories",
      categories: ["expert_men_18_minus_44", "expert_women"],
      paymentOptions: [
        { name: "Adult Entry", type: "adult", amount: 125 },
        { name: "Expert Season Pass", type: "expert", amount: 360 }
      ]
    }
  ],
  
  // Default payment options for races without specific options
  defaultPaymentOptions: [
    { name: "Adult Entry", type: "adult", amount: 125 },
    { name: "Junior Entry", type: "18under", amount: 95 }
  ]
}
```

### Race Document
```javascript
{
  raceid: "2026_exchequer_off_minus_road",
  series: "bear_offroad_2026",  // Links to series
  
  // Categories: mix of series-inherited and race-specific
  regCategories: [
    // Series category (identified by matching ID)
    {
      id: "expert_men_18_minus_44",
      catdispname: "Expert Men 18-44",
      laps: 1
    },
    
    // Race-specific category (unique ID)
    {
      id: "kids_fun_race",
      catdispname: "Kids Fun Race",
      laps: 1,
      paytype: "kids_special"  // Forces this payment type
    }
  ],
  
  // Payment options for race-specific categories
  paymentOptions: [
    { name: "Kids Entry", type: "kids_special", amount: 10 }
  ]
}
```

## Payment Option Resolution

The system determines available payment options using this priority order:

### Priority 1: Category Forced Payment Type
If a category has a `paytype` field, only that payment type is available.
```javascript
category.paytype = "kids_special"
→ Only show payment options with type "kids_special"
```

### Priority 2: Series Category Group
If category is from series, use payment options from its category group.
```javascript
Category: "expert_men_18_minus_44"
→ Find in series.categoryGroups
→ Use that group's paymentOptions
```

### Priority 3: Series Default Payment Options
If race has empty `paymentOptions` array, inherit from series defaults.
```javascript
race.paymentOptions = []
→ Use series.defaultPaymentOptions
```

### Priority 4: Race Payment Options
Fallback to race-specific payment options.
```javascript
→ Use race.paymentOptions
```

## Data Processing Flow

### 1. API Request: `GET /api/races/:id`

```
MongoDB Aggregation Pipeline:
  1. $match: Find race by ID
  2. $lookup: Join series data
     from: 'series'
     localField: 'series'
     foreignField: 'seriesId'
  3. Return merged data
     ↓
processRaceWithSeriesData():
  1. Populate empty race.paymentOptions with series defaults
  2. Enrich race.regCategories with series data
  3. Add seriesData to response
     ↓
Return enriched race data
```

### 2. Registration: `POST /api/payments/start-registration`

```
User submits registration
  ↓
Fetch race + series data (via aggregation)
  ↓
processStartRegistration():
  1. Identify selected category
  2. Determine payment type priority:
     - User's explicit selection (if valid)
     - Series group season pass (if applicable)
     - Category forced paytype (if set)
  3. Apply category-specific pricing
  4. Calculate fees
  5. Create Stripe checkout
     ↓
Return Stripe redirect URL
```

## Category Identification

### Frontend (Admin & Registration)

```javascript
// Check if category is from series
function isSeriesCategory(categoryId, raceData) {
  if (!raceData.seriesData?.regCategories) return false;
  return raceData.seriesData.regCategories.some(cat => cat.id === categoryId);
}

// Get payment options for category
function getAvailablePaymentOptions(category, raceData) {
  // 1. Forced paytype?
  if (category.paytype) {
    return raceData.paymentOptions.filter(opt => opt.type === category.paytype);
  }
  
  // 2. Series category with group?
  if (isSeriesCategory(category.id, raceData)) {
    const group = raceData.seriesData.categoryGroups.find(g =>
      g.categories.includes(category.id)
    );
    if (group) return group.paymentOptions;
  }
  
  // 3. Fallback to race payment options
  return raceData.paymentOptions;
}
```

## Admin UI Features

### EditRacersComponent & RacerFormComponent

**Visual Indicators:**
- 🔗 Icon: Category inherited from series
- ✏️ Icon: Series category overridden at race level
- Green badge: Series payment group name
- Blue badge: Forced payment type

**Payment Options:**
- Shows all relevant payment options including series groups
- Format: "Expert Season Pass (expert)" for series groups
- Includes admin-only options (cash, comp)

### EditRaceCategoriesComponent

**Features:**
- Fetches series data on mount
- Marks categories with `isFromSeries` flag
- Displays series info banner
- Prevents editing series category names
- Shows payment group info for series categories

## Use Cases

### Use Case 1: Pure Series Race
All categories from series, no race-specific categories.

```javascript
// Race has empty categories (inherits all from series)
race.regCategories = []
race.paymentOptions = []

// Result: All series categories available
// Payment options from series category groups
```

### Use Case 2: Hybrid Race
Series categories + race-specific categories.

```javascript
// Race has series categories + kids race
race.regCategories = [
  { id: "expert_men_18_minus_44", ... },  // From series
  { id: "kids_fun_race", paytype: "kids_special", ... }  // Race-specific
]
race.paymentOptions = [
  { type: "kids_special", amount: 10 }
]

// Result:
// - Expert categories use series payment groups
// - Kids race uses forced "kids_special" payment
```

### Use Case 3: Race Override
Race modifies a series category.

```javascript
// Series defines 1 lap
series.regCategories = [
  { id: "expert_men_18_minus_44", laps: 1 }
]

// Race overrides to 3 laps
race.regCategories = [
  { id: "expert_men_18_minus_44", laps: 3 }  // Override
]

// Result:
// - Still identified as series category (by ID)
// - Uses 3 laps (race override)
// - Uses series payment group
```

## Key Files

### Backend
- **`src/lib/raceProcessing.js`** - `processRaceWithSeriesData()` function
- **`api/races/index.js`** - Race endpoints with aggregation pipeline
- **`api/payments/index.js`** - Payment processing with `getCategoryPrice()`
- **`api/racers/index.js`** - Racer list/export with category enrichment

### Frontend
- **`src/components/registration/RaceReg.vue`** - Registration form
- **`src/admin/components/EditRacersComponent.vue`** - Racer list admin
- **`src/admin/components/RacerFormComponent.vue`** - Racer form admin
- **`src/admin/components/EditRaceCategoriesComponent.vue`** - Category editor

### Tests
- **`test/api/payments/start-registration.test.js`** - Payment processing tests

## API Response Example

```javascript
{
  raceid: "2026_exchequer_off_minus_road",
  series: "bear_offroad_2026",
  
  // All categories (series + race-specific)
  regCategories: [
    { id: "expert_men_18_minus_44", catdispname: "Expert Men 18-44" },
    { id: "kids_fun_race", catdispname: "Kids Fun Race", paytype: "kids_special" }
  ],
  
  // Race-specific payment options
  paymentOptions: [
    { name: "Kids Entry", type: "kids_special", amount: 10 }
  ],
  
  // Series data (from $lookup)
  seriesData: {
    seriesId: "bear_offroad_2026",
    name: "Bear Off-Road Series",
    regCategories: [
      { id: "expert_men_18_minus_44", ... }
    ],
    categoryGroups: [
      {
        name: "Expert Categories",
        categories: ["expert_men_18_minus_44"],
        paymentOptions: [
          { name: "Adult Entry", type: "adult", amount: 125 },
          { name: "Expert Season Pass", type: "expert", amount: 360 }
        ]
      }
    ],
    defaultPaymentOptions: [...]
  }
}
```

## Benefits

✅ **Consistency** - Series categories maintain naming and pricing across races
✅ **Flexibility** - Races can add unique categories or override series settings
✅ **Single API Call** - All data fetched in one request via aggregation
✅ **Clear Separation** - Visual indicators show category source
✅ **Backward Compatible** - Works with races that don't have series
✅ **No Migration** - Existing data structure supports this model

## Common Operations

### Add a Race-Specific Category
1. Edit race categories in admin
2. Click "Add Race Category"
3. Define category with unique ID
4. Set `paytype` if forcing specific payment
5. Add matching payment option to race

### Remove Series Category from Race
1. Edit race categories
2. Find series category (🔗 icon)
3. Delete category
4. Save (removed from race only, not series)

### Override Series Category
1. Edit race categories
2. Find series category
3. Modify properties (laps, start time, etc.)
4. Save (creates race-level override)

### Inherit All Series Categories
1. Leave race `regCategories` empty
2. System automatically includes all series categories
3. Uses series payment groups

## Troubleshooting

### Category shows wrong payment options
- Check if category has `paytype` field (forces specific payment)
- Verify category ID matches series category (for group lookup)
- Check series `categoryGroups` includes the category

### Race has no categories
- Check if race has `series` field
- Verify series document exists
- Check if race `regCategories` is empty (should inherit from series)

### Payment type not found error
- Verify race has `paymentOptions` or series has `defaultPaymentOptions`
- Check that payment type exists in appropriate location
- Review `processRaceWithSeriesData()` logs

## Related Documentation

- **API_SERIES_ENDPOINTS.md** - Series API reference
- **test/api/payments/start-registration.test.js** - Test examples

