# Email Template Implementation

## Overview
This implementation adds customizable email templates for race registration confirmations with full backwards compatibility for existing templates.

## Features Implemented

### 1. Email Template Module (`lib/emailTemplates.js`)
- **Dependency Injection**: Email sender function is injected for testability
- **Backwards Compatibility**: Handles both old string format and new object format
- **Template Variables**: Supports Handlebars variables in both subject and body
- **Default Template**: Provides sensible defaults when no template is configured

### 2. Backend Updates (`plugins/raceRegPlugin.js`)
- Refactored to use the new email template module
- Maintains existing API but uses new modular approach
- Supports both old and new template formats seamlessly

### 3. Frontend Component (`EditRaceEmailTemplateComponent.vue`)
- Rich text editor for email body with formatting tools
- Editable subject line with template variable support
- Variable reference panel showing:
  - Available template variables
  - Real race data examples
  - Click-to-copy functionality
- Preview feature with sample data
- Reset to default template option
- Shows default template for reference

### 4. Integration (`EditRaceComponent.vue`)
- Added email template section to Content tab
- Shows current template status (custom vs default)
- Preview of current email template
- Modal-based editor for better UX

### 5. Modal Component Enhancement (`ModalComponent.vue`)
- Added size support (sm, md, lg, xl)
- Email template editor uses xl size for better editing experience

## Available Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{name}}` | Registrant full name | John Doe |
| `{{sponsor}}` | Team/Sponsor name | Sample Racing Team |
| `{{eventName}}` | Event name | RodeoCross 2024 |
| `{{category}}` | Race category | Men's Cat 1 |
| `{{rosterLink}}` | Link to race roster | https://signup.bike/#/roster/raceid |
| `{{eventHomePageUrl}}` | Event homepage URL | https://example.com |
| `{{eventContactEmail}}` | Event contact email | contact@example.com |

## Data Structure

### Old Format (String)
```javascript
{
  emailTemplate: "<html><body>...</body></html>"
}
```

### New Format (Object)
```javascript
{
  emailTemplate: {
    subject: "{{eventName}} Registration",
    body: "<html><body>...</body></html>"
  }
}
```

## Backwards Compatibility

The system automatically handles both formats:
- **Old templates**: Converted to new format with default subject line
- **New templates**: Used as-is
- **No template**: Uses default template

## Testing

Run the test suite:
```bash
cd /Users/atkk/dev/lqtmdev
node lib/emailTemplates.test.js
```

Tests cover:
- Default template generation
- Template normalization (old and new formats)
- Template data preparation
- Template rendering with Handlebars
- Backwards compatibility

## API

The existing PATCH endpoint already supports the `emailTemplate` field:
```
PATCH /api/races/:id
{
  "emailTemplate": {
    "subject": "Welcome to {{eventName}}",
    "body": "<html>...</html>"
  }
}
```

## Usage

1. Navigate to Admin → Edit Race → Content tab
2. Find "Registration Confirmation Email" section
3. Click "Edit Email Template"
4. Customize subject and body using the rich text editor
5. Use template variables from the reference panel
6. Preview with sample data
7. Save

## Future Enhancements

Potential additions:
- Additional email types (reminders, cancellations, updates)
- Email scheduling
- A/B testing for email templates
- Email analytics (open rates, click rates)
- Template library/presets

