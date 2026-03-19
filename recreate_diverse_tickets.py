#!/usr/bin/env python3
"""
Script to delete and recreate tickets with diversity:
- Different payment methods (CASH, CARD, CHECK)
- Different fulfillment modes (Dine-in, Takeaway, Delivery)
- Different dates (spread across 5 days)
- Different shifts (0-9)
"""
import urllib.request
import json
import time
from datetime import datetime, timedelta

STORE_ID = "1539874562"
API_BASE = "http://localhost:8002"
BASE_DATE = "20260315"  # Starting from March 15, 2026

# Payment methods
PAYMENT_METHODS = ["CASH", "CARD", "CHECK"]

# Fulfillment modes
FULFILLMENT_MODES = ["Dine-in", "Takeaway", "Delivery"]

# Shift numbers (0-9, with 0 being unassigned)
SHIFTS = list(range(0, 10))

def delete_tickets_mongodb():
    """Delete all tickets for the store directly from MongoDB"""
    print("🗑️  Attempting to delete existing tickets from MongoDB...\n")
    
    # Create a simple Node.js script to delete
    delete_script = f"""
const {{ MongoClient }} = require('mongodb');
const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = 'Makseb';
const collectionName = 'Tiquer';

async function deleteTickets() {{
  const client = new MongoClient(url);
  try {{
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteMany({{ IdCRM: "{STORE_ID}" }});
    console.log(`✅ Deleted ${{result.deletedCount}} tickets for store {STORE_ID}`);
    
    process.exit(0);
  }} catch (error) {{
    console.error('❌ Error:', error.message);
    process.exit(1);
  }} finally {{
    await client.close();
  }}
}}

deleteTickets();
"""
    
    # Try using the existing app structure
    import subprocess
    
    try:
        # Use Node.js directly with MongoDB connection
        cmd = f"""
node -e "
const {{MongoClient}} = require('mongodb');
(async () => {{
  const client = new MongoClient('mongodb://localhost:27017');
  try {{
    await client.connect();
    const db = client.db('Makseb');
    const collection = db.collection('Tiquer');
    const result = await collection.deleteMany({{IdCRM: '{STORE_ID}'}});
    console.log('✅ Deleted', result.deletedCount, 'tickets');
    process.exit(0);
  }} catch(e) {{
    console.log('Note: Could not connect to MongoDB directly. Tickets may still exist.');
    process.exit(0);
  }} finally {{
    await client.close();
  }}
}}()).catch(() => process.exit(0));
"
"""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        if result.stdout:
            print(result.stdout)
    except:
        print("⚠️  Skipping direct MongoDB deletion (MongoDB client not available)")
        print("   Existing tickets will remain in database\n")

def create_ticket(ticket_num, base_date, payment_method, fulfillment, shift):
    """Create a diverse ticket payload"""
    # Calculate date (spread across 5 days, 10 tickets per day)
    day_offset = (ticket_num - 1) // 10
    date_obj = datetime.strptime(base_date, "%Y%m%d") + timedelta(days=day_offset)
    ticket_date = date_obj.strftime("%Y%m%d")
    
    # Time varies by ticket number
    hour = 8 + (ticket_num % 12)
    minute = ((ticket_num * 13) % 60)
    
    # Variable amount based on payment method (cash users spend less on average)
    if payment_method == "CASH":
        amount = 15 + (ticket_num * 1.2) % 35
    elif payment_method == "CHECK":
        amount = 25 + (ticket_num * 1.5) % 50
    else:  # CARD
        amount = 20 + (ticket_num * 1.8) % 60
    
    return {
        "IdCRM": STORE_ID,
        "Date": ticket_date,
        "idTiquer": str(ticket_num),
        "HeureTicket": f"{hour:02d}:{minute:02d}",
        "TTC": round(amount, 2),
        "currency": "€",
        "merchant_name": "TEST RESTAURANT",
        "merchant_address": "123 TEST STREET",
        "SIRET": "12345678901234",
        "Z": shift,
        "ConsumptionMode": fulfillment,
        "Menu": [
            {
                "NameProduct": f"{fulfillment} Menu #{ticket_num}",
                "TTC": round(amount * 0.8, 2),
                "QtyProduct": 1
            }
        ],
        "PaymentMethods": [
            {
                "payment_method": payment_method,
                "amount": round(amount, 2)
            }
        ],
        "Totals": {
            "Total_Ht": round(amount * 0.83, 2),
            "Total_TVA": round(amount * 0.20, 2),
            "Total_TTC": round(amount, 2)
        }
    }

def post_tickets():
    """Post 50 diverse tickets"""
    print("🎫 Creating and posting 50 diverse tickets...\n")
    
    success_count = 0
    failed_count = 0
    tickets_by_date = {}
    tickets_by_shift = {}
    tickets_by_payment = {}
    tickets_by_fulfillment = {}
    
    for i in range(1, 51):
        # Distribute payment methods evenly (16-17 each)
        payment = PAYMENT_METHODS[(i - 1) % len(PAYMENT_METHODS)]
        
        # Distribute fulfillment modes evenly (16-17 each)
        fulfillment = FULFILLMENT_MODES[(i - 1) % len(FULFILLMENT_MODES)]
        
        # Distribute shifts (5 tickets per shift, 0-9)
        shift = SHIFTS[(i - 1) % len(SHIFTS)]
        
        # Create ticket
        ticket = create_ticket(i, BASE_DATE, payment, fulfillment, shift)
        
        print(f"[{i:2d}/50] Posting ticket {i:2d} | "
              f"Date: {ticket['Date']} | "
              f"Shift: {shift} | "
              f"Payment: {payment:6s} | "
              f"Mode: {fulfillment:10s}...", end=" ", flush=True)
        
        try:
            # Post using urllib
            data = json.dumps(ticket).encode('utf-8')
            req = urllib.request.Request(
                f"{API_BASE}/update-ticket",
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode())
                print("✅")
                success_count += 1
                
                # Track statistics
                date_key = ticket['Date']
                tickets_by_date[date_key] = tickets_by_date.get(date_key, 0) + 1
                tickets_by_shift[shift] = tickets_by_shift.get(shift, 0) + 1
                tickets_by_payment[payment] = tickets_by_payment.get(payment, 0) + 1
                tickets_by_fulfillment[fulfillment] = tickets_by_fulfillment.get(fulfillment, 0) + 1
                
        except Exception as e:
            print(f"❌ {str(e)[:30]}")
            failed_count += 1
        
        # Small delay between requests
        time.sleep(0.2)
    
    # Print summary
    print(f"\n{'='*80}")
    print("📊 TEST SUMMARY")
    print(f"{'='*80}")
    print(f"✅ Successful: {success_count}/50")
    print(f"❌ Failed: {failed_count}/50")
    
    print(f"\n📅 Distribution by Date:")
    for date in sorted(tickets_by_date.keys()):
        count = tickets_by_date[date]
        print(f"   {date}: {count:2d} tickets")
    
    print(f"\n🔄 Distribution by Shift (Closure #):")
    for shift in sorted(tickets_by_shift.keys()):
        count = tickets_by_shift[shift]
        print(f"   Shift {shift}: {count:2d} tickets")
    
    print(f"\n💳 Distribution by Payment Method:")
    for payment in sorted(tickets_by_payment.keys()):
        count = tickets_by_payment[payment]
        print(f"   {payment:6s}: {count:2d} tickets")
    
    print(f"\n🛵 Distribution by Fulfillment Mode:")
    for mode in sorted(tickets_by_fulfillment.keys()):
        count = tickets_by_fulfillment[mode]
        print(f"   {mode:10s}: {count:2d} tickets")
    
    print(f"\n{'='*80}")
    print("Next Steps:")
    print("1. ✅ Navigate to Dashboard")
    print("2. ✅ Use filters: Shift, Payment Method, Fulfillment Mode")
    print("3. ✅ Click 'Shifts' page to see all 10 shifts with summaries")
    print("4. ✅ Test API filtering combinations")
    print(f"\n")

if __name__ == "__main__":
    delete_tickets_mongodb()
    post_tickets()
