# Live Stats API - Integration Documentation

**API Base URL:** `http://localhost:8002`

**API Version:** 1.0  
**Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Sales & Transaction Endpoints](#sales--transaction-endpoints)
5. [Email Endpoints](#email-endpoints)
6. [Data Retrieval Endpoints](#data-retrieval-endpoints)
7. [Payment Statistics](#payment-statistics)
8. [Store Management Endpoints](#store-management-endpoints)
9. [Category & Image Synchronization](#category--image-synchronization)
10. [Ticket Display Endpoints](#ticket-display-endpoints)
11. [Error Handling](#error-handling)
12. [Code Examples](#code-examples)

---

## Overview

The Live Stats API provides comprehensive endpoints for managing restaurant transactions, store operations, ticket generation, and data synchronization. All endpoints are built on Express.js and connect to a MongoDB database.

**Key Features:**
- Transaction and ticket management
- Email notifications
- Store licensing and configuration
- Real-time sales statistics
- PDF ticket generation
- Image and category synchronization

---

## Authentication

Currently, most endpoints do **not require authentication** except where explicitly noted. Some endpoints may require token verification (noted in endpoint description).

For endpoints that require authentication:
- Include `Authorization` header with valid token
- Token validation is performed by `verifyAccessToken` middleware

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "status": "error",
  "code": 400,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes Used
- `200` - OK: Request succeeded
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid input parameters
- `404` - Not Found: Resource not found
- `500` - Internal Server Error: Server-side error

---

## Sales & Transaction Endpoints

### 1. Update Live Statistics

**Endpoint:** `POST /update-live-stats`

**Description:** Updates live statistics data for a store on a specific date

**Request Body:**
```json
{
  "IdCRM": "2435",
  "date": "20260204",
  "data": {
    "totalSales": 1234.50,
    "itemCount": 45,
    "customdata": "any other fields"
  }
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| IdCRM | string | Yes | Restaurant/Store unique identifier |
| date | string | Yes | Date in YYYYMMDD format |
| data | object | Yes | Statistics data to update |

**Response:**
```json
{
  "status": 200,
  "message": "Statistics updated successfully"
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

---

### 2. Update Transaction Data

**Endpoint:** `POST /update-transaction-data`

**Description:** Records and updates transaction data for a specific date

**Request Body:**
```json
{
  "IdCRM": "2435",
  "date": "20260204",
  "transactions": [
    {
      "transactionId": "TR001",
      "amount": 45.50,
      "timestamp": "15:30"
    }
  ]
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| IdCRM | string | Yes | Store identifier |
| date | string | Yes | Date in YYYYMMDD format |
| transactions | array | No | Array of transaction objects |

**Response:** Status `200` on success

**Database Collection:** `livestats`

---

### 3. Update Payment Settlement

**Endpoint:** `POST /update-payment-settlement`

**Description:** Updates payment settlement and regulatory information

**Request Body:**
```json
{
  "IdCRM": "2435",
  "date": "20260204",
  "totalPayment": 5000.00,
  "settlementDetails": {
    "cash": 2000.00,
    "card": 3000.00
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### 4. Update Specific Ticket

**Endpoint:** `POST /update-ticket`

**Description:** Creates or updates a ticket record. Does not update if ticket already exists.

**Request Body:**
```json
{
  "IdCRM": "2435",
  "Date": "20251213",
  "idTiquer": "30",
  "HeureTicket": "15:21",
  "TTC": 51.49,
  "ModeConsomation": "A Emporter",
  "Menu": [
    {
      "NameProduct": "MENU SANDWICH",
      "TTC": 0,
      "QtyProduct": 1,
      "Sup": [
        {
          "NameProduct": "MENU CHICKEN TANDOORI",
          "QtyProduct": 1,
          "TTC": 8.9
        }
      ],
      "Gredient": [
        {
          "NameProduct": "PAIN MAISON",
          "QtyProduct": 0,
          "TTC": 0
        }
      ],
      "Gredient2": [
        {
          "NameProduct": "SANS CRUDITES",
          "QtyProduct": 0,
          "TTC": 0
        }
      ]
    }
  ],
  "ModePaiement": [
    {
      "payment_method": "CASH",
      "amount": 18.09
    }
  ],
  "Totals": {
    "Total_TTC": 8.9,
    "Total_Ht": 8.091,
    "Total_TVA": 0.809
  },
  "devise": "€",
  "NomSociete": "MISTER GRILL",
  "sAdress": "71 COURS DES ROCHES",
  "ville": "77186  NOISIEL"
}
```

**Required Fields:**
- `IdCRM` - Store identifier
- `Date` - Date in YYYYMMDD format
- `idTiquer` - Ticket unique identifier (within same restaurant/date)
- `HeureTicket` - Ticket time
- `Menu` - Array of menu items
- `Totals` - Totals object with Total_Ht, Total_TVA, and Total_TTC

**Optional Fields:**
- `TTC` - Total with tax
- `ModeConsomation` - Consumption mode
- `PaymentMethods` - Payment methods array (new format, recommended)
- `ModePaiement` - Payment methods array (legacy format, deprecated)
- `devise` - Currency
- `NomSociete` - Restaurant name
- `sAdress` - Address
- `ville` - City

**Payment Method Structure (New Format - Recommended):**
```json
{
  "PaymentMethods": [
    {
      "payment_method": "CASH",
      "amount": 13.5
    },
    {
      "payment_method": "CARD",
      "amount": 0
    }
  ]
}
```

**Payment Method Validation:**
- Each payment method must have `payment_method` (string) and `amount` (number)
- Sum of all payment amounts MUST equal ticket TTC (with 0.01 tolerance for floating point)
- Returns 400 error if payment amounts don't match ticket total

**Payment Method Structure (Legacy Format - Deprecated):**
```json
{
  "ModePaiement": [
    {
      "ModePaimeent": "CASH",
      "totalwithMode": 13.5
    }
  ]
}
```
```json
{
  "NameProduct": "Product Name",
  "TTC": 10.50,
  "QtyProduct": 1,
  "Sup": [
    {
      "NameProduct": "Supplement Name",
      "QtyProduct": 1,
      "TTC": 5.00
    }
  ],
  "Gredient": [
    {
      "NameProduct": "Ingredient",
      "QtyProduct": 0,
      "TTC": 0
    }
  ],
  "Gredient2": [
    {
      "NameProduct": "Exclusion",
      "QtyProduct": 0,
      "TTC": 0
    }
  ]
}
```

**Response:** Status `200`

**Database Collection:** `Tiquer`

**Important:** If a ticket with same IdCRM, Date, idTiquer, and HeureTicket exists, it will NOT be updated.

---

## Email Endpoints

### 1. Send Welcome Email

**Endpoint:** `POST /send-welcome-email`

**Description:** Sends a welcome email with account credentials

**Request Body:**
```json
{
  "email": "customer@example.com",
  "name": "Restaurant Name",
  "lien": "https://example.com/ticket/123"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Recipient email address |
| name | string | Yes | Sender/Restaurant name |
| lien | string | Yes | Link to ticket or account page |

**Response:**
```json
{
  "message": "E-mail envoyé avec succès."
}
```

**Status Codes:**
- `200` - Email sent successfully
- `500` - Email sending error

**Email Template:** HTML formatted with welcome message and link

---

### 2. Send PDF Email

**Endpoint:** `POST /send-pdf-email`

**Description:** Sends an email with PDF attachment

**Request Body:**
```json
{
  "email": "customer@example.com",
  "name": "Restaurant Name",
  "pdf": "Base64 encoded PDF or URL"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Recipient email |
| name | string | Yes | Sender name |
| pdf | string | Yes | PDF content (base64 or URL) |

**Response:**
```json
{
  "message": "E-mail envoyé avec succès."
}
```

**Status Codes:**
- `200` - Success
- `500` - Error

**SMTP Configuration:**
- Host: `makseb.fr`
- Port: `465`
- From: `commandes@makseb.fr`

---

## Data Retrieval Endpoints

### 1. Get Sales Summary

**Endpoint:** `GET /get-sales-summary`

**Description:** Retrieves aggregated sales statistics for a store within a date range

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |
| date1 | string | Yes | Start date (YYYYMMDD) |
| date2 | string | Yes | End date (YYYYMMDD) |

**Example Request:**
```
GET /get-sales-summary?idCRM=2435&date1=20260101&date2=20260228
```

**Response:**
```json
[
  {
    "IdCRM": "2435",
    "date": "20260101",
    "totalSales": 1234.50,
    "itemCount": 45,
    ...
  }
]
```

**Status Codes:**
- `200` - Success
- `404` - No data found
- `500` - Server error

---

### 2. Get Detailed Sales Summary

**Endpoint:** `GET /get-detailed-sales-summary`

**Description:** Retrieves detailed sales statistics with breakdown information

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |
| date1 | string | Yes | Start date (YYYYMMDD) |
| date2 | string | Yes | End date (YYYYMMDD) |

**Example Request:**
```
GET /get-detailed-sales-summary?idCRM=2435&date1=20260101&date2=20260228
```

**Response:** Detailed object with breakdown by category, payment method, etc.

**Status Codes:**
- `200` - Success
- `404` - No data found
- `500` - Server error

---

## Payment Statistics

Statistics endpoint for analyzing payment methods and revenue trends.

### 1. Get Payment Statistics

**Description:** Retrieves payment method statistics and aggregates for a store within a date range

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |
| date1 | string | Yes | Start date (YYYYMMDD) |
| date2 | string | Yes | End date (YYYYMMDD) |

**Example Request:**
```
GET /get-payment-statistics?idCRM=2435&date1=20260101&date2=20260228
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_revenue": 5234.50,
    "total_transactions": 45,
    "date_range": {
      "start": "20260101",
      "end": "20260228"
    },
    "payment_methods": {
      "CASH": {
        "total_amount": 3000.00,
        "transaction_count": 25,
        "average_transaction": 120.00
      },
      "CARD": {
        "total_amount": 2234.50,
        "transaction_count": 20,
        "average_transaction": 111.73
      }
    },
    "payment_breakdown": [
      {
        "payment_method": "CASH",
        "total_amount": 3000.00,
        "transaction_count": 25,
        "average_amount": 120.00,
        "percentage_of_total": 57.38
      },
      {
        "payment_method": "CARD",
        "total_amount": 2234.50,
        "transaction_count": 20,
        "average_amount": 111.73,
        "percentage_of_total": 42.62
      }
    ]
  },
  "message": "Payment statistics retrieved successfully"
}
```

**Response Fields:**
- `total_revenue` - Total amount across all transactions
- `total_transactions` - Number of transactions in period
- `payment_methods` - Detailed breakdown by payment method
- `payment_breakdown` - Sorted array of payment method statistics

**Status Codes:**
- `200` - Success
- `400` - Missing required parameters
- `404` - No tickets found for date range
- `500` - Server error

---

**Endpoint:** `GET /get-tickets`

**Description:** Retrieves all tickets for a store within a date range

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |
| date1 | string | Yes | Start date (YYYYMMDD) |
| date2 | string | Yes | End date (YYYYMMDD) |

**Example Request:**
```
GET /get-tickets?idCRM=2435&date1=20260101&date2=20260131
```

**Response:**
```json
[
  {
    "_id": "693d765ffba51e4799b4db3e",
    "idTiquer": "30",
    "Date": "20251213",
    "HeureTicket": "15:21",
    "TTC": 51.49,
    "Menu": [...],
    ...
  }
]
```

**Database Collection:** `Tiquer`

**Status Codes:**
- `200` - Success
- `404` - No tickets found
- `500` - Server error

---

## Store Management Endpoints

### 1. Update Store Status

**Endpoint:** `POST /update-store-status`

**Description:** Updates store status and last interaction timestamp

**Request Body:**
```json
{
  "IdCRM": "2435",
  "LastCommand": "REBOOT",
  "Status": "Activer"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| IdCRM | string | Yes | Store identifier |
| LastCommand | string | No | Last command executed |
| Status | string | No | Store status (Activer/Desactiver) |

**Response:** Status `200`

**Database Collection:** `user`

**Updated Fields:**
- `Status` - Set to "Activer" (Enabled)
- `LastCommand` - Updated if provided
- `lastInteraction` - Set to current timestamp

---

### 2. Get License

**Endpoint:** `GET /get-license/:idCRM`

**Description:** Checks if store has active license

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |

**Example Request:**
```
GET /get-license/2435
```

**Response:**
```json
{
  "hasLicense": "EMakseb"
}
```

**Possible Values:**
- `"EMakseb"` - License is enabled
- `"MaksebD"` - License is disabled/demo

**Database Collection:** `user`

**Status Codes:**
- `200` - Success
- `500` - Error

---

### 3. Get Store Name

**Endpoint:** `GET /get-store-name/:idCRM`

**Description:** Retrieves store/restaurant information

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |

**Example Request:**
```
GET /get-store-name/2435
```

**Response:**
```json
{
  "name": "MISTER GRILL",
  "baseData": {...}
}
```

**Database Collection:** `user`

---

### 4. Update License

**Endpoint:** `GET /update-license/:idCRM/:action`

**Description:** Updates store license status

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |
| action | string | Yes | "Enable" or "Disable" |

**Example Request:**
```
GET /update-license/2435/Enable
```

**Response:** JSON object with updated license status

**Status Codes:**
- `200` - Success
- `500` - Error

---

### 5. Update Database

**Endpoint:** `GET /update-database/:idCRM/:action`

**Description:** Updates database configuration for store

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|nsurance---|----------|-------------|
| idCRM | string | Yes | Store identifier |
| action | string | Yes | Action type |

**Example Request:**
```
GET /update-database/2435/refresh
```

**Status Codes:**
- `200` - Success
- `500` - Error

---

## Category & Image Synchronization

### 1. Sync Categories to Folder

**Endpoint:** `POST /sync-categories-to-folder`

**Description:** Synchronizes product categories to local folder structure

**Request Body:**
```json
{
  "idCRM": "2435",
  "categories": [
    {
      "name": "Sandwiches",
      "id": "CAT001"
    }
  ]
}
```

**Response:** Status `200` on success

**Status Codes:**
- `200` - Success
- `500` - Error

---

### 2. Sync Categories to Database

**Endpoint:** `POST /sync-categories-to-database`

**Description:** Synchronizes and encrypts categories in MongoDB

**Request Body:**
```json
{
  "idCRM": "2435",
  "categories": [...]
}
```

**Response:** Status `200`

**Database Collection:** Stores encrypted category data

---

### 3. Get Product Images

**Endpoint:** `GET /get-product-images`

**Description:** Retrieves product images and category information

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | No | Store identifier |
| category | string | No | Specific category |

**Response:**
```json
[
  {
    "categoryId": "CAT001",
    "categoryName": "Sandwiches",
    "images": [...]
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Error

---

## Ticket Display Endpoints

### 1. Display Tickets (HTML)

**Endpoint:** `GET /display-tickets`

**Description:** Generates and displays HTML formatted tickets list

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Store identifier |
| date1 | string | Yes | Start date |
| date2 | string | Yes | End date |

**Response:** HTML page displaying formatted tickets

**Features:**
- Responsive design
- Monospace Dina font
- Printable format
- PDF export capability

---

### 2. Display Tickets Detailed

**Endpoint:** `GET /display-tickets-detailed`

**Description:** Displays detailed formatted tickets with full information

**Query Parameters:** Same as `/display-tickets`

**Response:** Enhanced HTML with detailed breakdown

---

### 3. Display Ticket Receipt (Primary Endpoint)

**Endpoint:** `GET /display-ticket-receipt/:idCRM/:date/:idTiquer`

**Description:** Displays individual ticket receipt with PDF download option

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idCRM | string | Yes | Restaurant/Store identifier |
| date | string | Yes | Ticket date (YYYYMMDD format) |
| idTiquer | string | Yes | Ticket unique identifier |

**Example Request:**
```
GET /display-ticket-receipt/2435/20251213/30
```

**Response:** HTML page with:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Ticket Receipt</title>
  <script src="html2pdf library"></script>
  <style>
    @font-face { font-family: 'Dina'; src: url('/Dina.fon'); }
    body { font-family: 'Dina', monospace; }
    .download-btn { /* PDF button styling */ }
  </style>
</head>
<body>
  <button onclick="downloadPDF()">Download PDF</button>
  <div id="ticket-content">
    <!-- Ticket details here -->
    <h1>TICKET: 30</h1>
    <p>Store: MISTER GRILL</p>
    <p>Date: 2025-12-13 15:21</p>
    <table><!-- Menu items --></table>
    <table><!-- Totals --></table>
  </div>
</body>
</html>
```

**Display Features:**
- **Font:** Dina monospace programming font
- **Layout:** Receipt-sized (80x200mm when printed as PDF)
- **Button:** Sticky PDF download button (top-right)
- **Data Displayed:**
  - Menu items with quantities and prices
  - Supplements (+)
  - Ingredients (•)
  - Exclusions (-)
  - Bill totals (HT, TVA, TTC)
  - Payment method and amount
  - Store name and address
  - Consumption mode (À Emporter/Sur Place)

**Ticket Composition:**
```
MISTER GRILL
71 COURS DES ROCHES
77186 NOISIEL

TICKET: 30
Date: 2025-12-13 15:21

1x MENU SANDWICH
  + 1x MENU CHICKEN TANDOORI        8.90€
  + 1x FRITES CLASSIQUES            0.00€
  + 1x COCA CHERRY 33CL             0.00€
  • PAIN MAISON
  • BIGGY
  • MAYONNAISE
  - SANS CRUDITES

─────────────────────────
ESPECES                   18.09€
─────────────────────────
À EMPORTER
MERCI DE VOTRE VISITE
```

**Status Codes:**
- `200` - Success (HTML page)
- `404` - Ticket not found (HTML: "Ticket not found")
- `500` - Server error

**PDF Export:**
- **Format:** 80mm × 200mm (receipt size)
- **Quality:** 98% JPEG
- **Filename:** `ticket-{timestamp}.pdf`
- **Trigger:** Client-side JavaScript `downloadPDF()` function

**Unique Identification:**
Tickets are uniquely identified by combining three fields:
- `idCRM` - Restaurant identifier (prevents cross-store confusion)
- `Date` - Ticket date (YYYYMMDD format)
- `idTiquer` - Ticket number within that date

This ensures correct ticket retrieval even if same ticket numbers exist across different restaurants or dates.

**Mobile Responsive:**
- Breakpoint: `max-width: 480px`
- Adapts font sizes and spacing for small screens
- Maintains readability on mobile devices

---

## Error Handling

### Standard Error Responses

**Not Found (404):**
```json
{
  "error": "Resource not found"
}
```

**Server Error (500):**
```json
{
  "error": "Internal Server Error"
}
```

**Validation Error (400):**
```json
{
  "error": "Missing required parameters"
}
```

### Common Error Causes

| Error | Cause | Solution |
|-------|-------|----------|
| "Ticket not found" | Invalid idCRM, date, or idTiquer | Verify all three parameters match database records |
| "Livestats not found" | No data in date range | Check date format (YYYYMMDD) and range |
| "E-mail sending error" | SMTP configuration issue | Verify email, name, and link parameters |
| "Address already in use" | Port 8002 occupied | Kill process on port 8002 or change port |

---

## Code Examples

### JavaScript/Node.js

#### Get Tickets
```javascript
const fetch = require('node-fetch');

async function getTickets(idCRM, startDate, endDate) {
  const url = `http://localhost:8002/get-tickets?idCRM=${idCRM}&date1=${startDate}&date2=${endDate}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tickets = await response.json();
    console.log(tickets);
    return tickets;
  } catch (error) {
    console.error('Error fetching tickets:', error);
  }
}

getTickets('2435', '20260101', '20260131');
```

#### Create Ticket
```javascript
async function createTicket(ticketData) {
  const url = 'http://localhost:8002/update-ticket';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });
    
    if (response.ok) {
      console.log('Ticket created successfully');
    } else {
      console.error('Error creating ticket:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

const newTicket = {
  IdCRM: '2435',
  Date: '20260204',
  idTiquer: '45',
  HeureTicket: '14:30',
  TTC: 25.50,
  Menu: [...]
};

createTicket(newTicket);
```

#### Get Ticket Receipt HTML
```javascript
async function getTicketReceipt(idCRM, date, idTiquer) {
  const url = `http://localhost:8002/display-ticket-receipt/${idCRM}/${date}/${idTiquer}`;
  
  try {
    const html = await fetch(url).then(r => r.text());
    // Display in iframe
    document.getElementById('ticketFrame').srcdoc = html;
  } catch (error) {
    console.error('Error fetching receipt:', error);
  }
}

getTicketReceipt('2435', '20251213', '30');
```

### cURL

#### Get Tickets
```bash
curl -X GET "http://localhost:8002/get-tickets?idCRM=2435&date1=20260101&date2=20260131"
```

#### Create Ticket
```bash
curl -X POST http://localhost:8002/update-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "IdCRM": "2435",
    "Date": "20260204",
    "idTiquer": "45",
    "HeureTicket": "14:30",
    "TTC": 25.50,
    "Menu": []
  }'
```

#### Get Sales Summary
```bash
curl -X GET "http://localhost:8002/get-sales-summary?idCRM=2435&date1=20260101&date2=20260228"
```

#### Send Welcome Email
```bash
curl -X POST http://localhost:8002/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "name": "My Restaurant",
    "lien": "https://example.com/receipt"
  }'
```

#### Check License
```bash
curl -X GET "http://localhost:8002/get-license/2435"
```

#### Display Ticket Receipt
```bash
curl -X GET "http://localhost:8002/display-ticket-receipt/2435/20251213/30" \
  -o ticket.html

# Open in browser
open ticket.html
```

---

## Database Collections Reference

### Tiquer Collection
Stores individual ticket records

**Key Fields:**
- `IdCRM` - Store identifier
- `Date` - Ticket date (YYYYMMDD)
- `idTiquer` - Ticket ID
- `HeureTicket` - Time
- `TTC` - Total with tax
- `Menu[]` - Line items
- `Totals` - Totals object
- `ModePaiement[]` - Payment methods

**Unique Index:** `{IdCRM, Date, idTiquer}`

### Livestats Collection
Stores aggregated statistics

**Key Fields:**
- `IdCRM` - Store identifier
- `date` - Date (YYYYMMDD)
- Various statistical fields

### User Collection
Stores store/restaurant information

**Key Fields:**
- `idCRM` - Store identifier
- `name` - Store name
- `Licence` - License status (Enable/Disable)
- `Status` - Activation status
- `LastCommand` - Last executed command
- `lastInteraction` - Last interaction timestamp

---

## Rate Limiting & Performance Notes

- No built-in rate limiting currently implemented
- All endpoints are synchronous (blocking)
- Database connection is single-threaded per request
- PDF generation done client-side (no server load)
- Recommended max payload: 10MB

---

## Support & Contact

For API issues or questions:
- Email: commandes@makseb.fr
- Verify MongoDB connection string in `.env`
- Ensure port 8002 is available
- Check file permissions for static assets (Dina.fon, pdf.png)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial documentation with all endpoints |
| | | Added detailed examples and database schemas |
| | | Implemented composite ticket identification |

