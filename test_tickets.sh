#!/bin/bash

# Configuration
API_BASE="http://localhost:8002"
STORE_ID="1539874562"
TODAY_DATE="20260319"
API_URL="${API_BASE}/update-ticket"

echo "🎫 Starting ticket posting test..."
echo "Store ID: $STORE_ID"
echo "Date: $TODAY_DATE"
echo "Creating 20 tickets with closure numbers 0-19"
echo ""

SUCCESS=0
FAILED=0

# Closure numbers: 0 (unassigned), then 1-9 repeated
CLOSURE_NUMBERS=(0 1 2 3 4 5 6 7 8 9 1 2 3 4 5 6 7 8 9 0)

for i in {1..20}; do
  TICKET_NUM=$i
  CLOSURE=${CLOSURE_NUMBERS[$((i-1))]}
  HOUR=$((8 + (i / 3)))
  MINUTE=$(((i % 60) * 2))
  AMOUNT=$(echo "20 + ($RANDOM % 80)" | bc)
  
  # Create JSON payload
  read -r -d '' PAYLOAD << 'EOF' || true
{
  "IdCRM": "STORE_ID",
  "Date": "TODAY_DATE",
  "idTiquer": "TICKET_NUM",
  "HeureTicket": "HOUR:MINUTE",
  "TTC": AMOUNT,
  "currency": "€",
  "merchant_name": "TEST RESTAURANT",
  "merchant_address": "123 TEST STREET",
  "SIRET": "12345678901234",
  "Z": CLOSURE,
  "ConsumptionMode": "Dine-in",
  "Menu": [
    {
      "NameProduct": "MENU ITEM",
      "TTC": 25.00,
      "QtyProduct": 1
    }
  ],
  "PaymentMethods": [
    {
      "payment_method": "CARD",
      "amount": AMOUNT
    }
  ],
  "Totals": {
    "Total_Ht": 20.00,
    "Total_TVA": 5.00,
    "Total_TTC": AMOUNT
  }
}
EOF

  # Replace placeholders
  PAYLOAD="${PAYLOAD//STORE_ID/$STORE_ID}"
  PAYLOAD="${PAYLOAD//TODAY_DATE/$TODAY_DATE}"
  PAYLOAD="${PAYLOAD//TICKET_NUM/$TICKET_NUM}"
  PAYLOAD="${PAYLOAD//HOUR/$HOUR}"
  PAYLOAD="${PAYLOAD//MINUTE/$MINUTE}"
  PAYLOAD="${PAYLOAD//AMOUNT/$AMOUNT}"

  echo "[${i}/20] Posting ticket $i (Closure: $CLOSURE)..."
  
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    -w "\n%{http_code}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "  ✅ Success (HTTP $HTTP_CODE)"
    ((SUCCESS++))
  else
    echo "  ❌ Failed (HTTP $HTTP_CODE) - $BODY"
    ((FAILED++))
  fi
  
  # Small delay between requests
  sleep 0.3
done

echo ""
echo "================================================================================"
echo "📊 TEST SUMMARY"
echo "================================================================================"
echo "✅ Successful: $SUCCESS/20"
echo "❌ Failed: $FAILED/20"
echo ""
echo "Next Steps:"
echo "1. Navigate to Dashboard to see the new tickets"
echo "2. Use 'Filter by Shift' dropdown to filter by closure number"
echo "3. Click 'Shifts' in sidebar to see shift summary page"
echo "4. Check API filtering:"
echo "   GET /get-tickets?idCRM=$STORE_ID&date1=$TODAY_DATE&date2=$TODAY_DATE&closureNumber=0"
echo ""
