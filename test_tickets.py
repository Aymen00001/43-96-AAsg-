#!/usr/bin/env python3
import subprocess
import json
from datetime import datetime

API_BASE = "http://localhost:8002"
STORE_ID = "1539874562"
TODAY_DATE = "20260319"

def create_ticket(ticket_num, closure):
    """Create a ticket payload"""
    hour = 8 + (ticket_num // 3)
    minute = (ticket_num % 60) * 2
    amount = 20 + (ticket_num * 3.5) % 80
    
    return {
        "IdCRM": STORE_ID,
        "Date": TODAY_DATE,
        "idTiquer": str(ticket_num),
        "HeureTicket": f"{hour:02d}:{minute:02d}",
        "TTC": round(amount, 2),
        "currency": "€",
        "merchant_name": "TEST RESTAURANT",
        "merchant_address": "123 TEST STREET",
        "SIRET": "12345678901234",
        "Z": closure,  # Closure number / shift
        "ConsumptionMode": ["Dine-in", "Takeaway", "Delivery"][ticket_num % 3],
        "Menu": [
            {
                "NameProduct": f"MENU {ticket_num}",
                "TTC": 25.00,
                "QtyProduct": 1
            }
        ],
        "PaymentMethods": [
            {
                "payment_method": ["CASH", "CARD", "CHECK"][ticket_num % 3],
                "amount": round(amount, 2)
            }
        ],
        "Totals": {
            "Total_Ht": 20.00,
            "Total_TVA": 5.00,
            "Total_TTC": round(amount, 2)
        }
    }

def main():
    print("🎫 Starting ticket posting test...")
    print(f"Store ID: {STORE_ID}")
    print(f"Date: {TODAY_DATE}")
    print("Creating 20 tickets with closure numbers 0-19\n")
    
    # Closure numbers: 0 (unassigned), then 1-9 repeated
    closure_numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
    
    success_count = 0
    failed_count = 0
    
    for i in range(1, 21):
        closure = closure_numbers[i - 1]
        ticket = create_ticket(i, closure)
        
        print(f"[{i}/20] Posting ticket {i} (Closure: {closure})...", end=" ", flush=True)
        
        try:
            # Use curl to post
            cmd = [
                "curl",
                "-s",
                "-X", "POST",
                f"{API_BASE}/update-ticket",
                "-H", "Content-Type: application/json",
                "-d", json.dumps(ticket)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            # Check if response contains success indicators
            if result.returncode == 0:
                response = result.stdout
                if "_id" in response or "successfully" in response.lower():
                    print("✅ Success")
                    success_count += 1
                else:
                    print(f"❌ Failed - {response[:100]}")
                    failed_count += 1
            else:
                print(f"❌ Failed - {result.stderr[:100]}")
                failed_count += 1
        except Exception as e:
            print(f"❌ Error - {str(e)[:50]}")
            failed_count += 1
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 TEST SUMMARY")
    print(f"{'='*80}")
    print(f"✅ Successful: {success_count}/20")
    print(f"❌ Failed: {failed_count}/20")
    print(f"\n{'='*80}")
    print("Next Steps:")
    print("1. Navigate to Dashboard to see the new tickets")
    print("2. Use 'Filter by Shift' dropdown to filter by closure number")
    print("3. Click 'Shifts' in sidebar to see shift summary page")
    print("4. Test API filtering:")
    print(f"   curl 'http://localhost:8002/get-tickets?idCRM={STORE_ID}&date1={TODAY_DATE}&date2={TODAY_DATE}&closureNumber=0'")
    print(f"\n")

if __name__ == "__main__":
    main()
