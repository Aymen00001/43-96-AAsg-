#!/usr/bin/env python3
import urllib.request
import json
from datetime import datetime

STORE_ID = "1539874562"
API_URL = f"http://localhost:8002/get-tickets?idCRM={STORE_ID}&date1=20260315&date2=20260319&limit=100"

print("🔍 Verifying Diverse Ticket Distribution:\n")
print(f"Store ID: {STORE_ID}")
print(f"Date Range: March 15-19, 2026\n")

try:
    with urllib.request.urlopen(API_URL) as response:
        data = json.loads(response.read().decode())
        tickets = data.get('data', [])
        
        print(f"✅ Total Tickets: {len(tickets)}\n")
        
        # Analyze distribution
        by_shift = {}
        by_payment = {}
        by_fulfillment = {}
        by_date = {}
        
        for ticket in tickets:
            shift = ticket.get('Z') or ticket.get('closureNumber', 'Unknown')
            payment = ticket.get('PaymentMethods', [{}])[0].get('payment_method', 'Unknown')
            fulfillment = ticket.get('ConsumptionMode', 'Unknown')
            date = ticket.get('Date', 'Unknown')
            
            by_shift[shift] = by_shift.get(shift, 0) + 1
            by_payment[payment] = by_payment.get(payment, 0) + 1
            by_fulfillment[fulfillment] = by_fulfillment.get(fulfillment, 0) + 1
            by_date[date] = by_date.get(date, 0) + 1
        
        print("📊 DISTRIBUTION ANALYSIS:")
        print("=" * 60)
        
        print("\n🔄 By Shift (Closure Number):")
        for shift in sorted(by_shift.keys(), key=lambda x: int(x) if str(x).isdigit() else -1):
            count = by_shift[shift]
            pct = (count / len(tickets)) * 100
            print(f"   Shift {shift}: {count:2d} tickets ({pct:5.1f}%)")
        
        print("\n💳 By Payment Method:")
        for payment in sorted(by_payment.keys()):
            count = by_payment[payment]
            pct = (count / len(tickets)) * 100
            print(f"   {payment:8s}: {count:2d} tickets ({pct:5.1f}%)")
        
        print("\n🛵 By Fulfillment Mode:")
        for mode in sorted(by_fulfillment.keys()):
            count = by_fulfillment[mode]
            pct = (count / len(tickets)) * 100
            print(f"   {mode:10s}: {count:2d} tickets ({pct:5.1f}%)")
        
        print("\n📅 By Date:")
        for date in sorted(by_date.keys()):
            count = by_date[date]
            date_obj = datetime.strptime(date, "%Y%m%d")
            print(f"   {date} ({date_obj.strftime('%A')}): {count:2d} tickets")
        
        # Show sample tickets with all attributes
        print("\n" + "=" * 60)
        print("\n📋 SAMPLE TICKETS (showing diversity):\n")
        
        samples = [0, 15, 30, 45]
        for idx in samples:
            if idx < len(tickets):
                t = tickets[idx]
                print(f"Ticket {t.get('idTiquer')}:")
                print(f"  Date: {t.get('Date')}  Time: {t.get('HeureTicket')}")
                print(f"  Shift: {t.get('Z') or t.get('closureNumber')}")
                print(f"  Payment: {t.get('PaymentMethods', [{}])[0].get('payment_method', 'N/A')}")
                print(f"  Mode: {t.get('ConsumptionMode', 'N/A')}")
                print(f"  Amount: €{t.get('TTC', 0)}")
                print()
        
        print("=" * 60)
        print("✅ Data is ready for comprehensive testing!")
        print("\nYou can now:")
        print("  • Test shift filtering (0-9)")
        print("  • Test payment method filtering (CASH/CARD/CHECK)")
        print("  • Test fulfillment mode filtering (Dine-in/Takeaway/Delivery)")
        print("  • Test date range filtering (March 15-19)")
        print("  • Test multiple filter combinations")
        print("  • View comprehensive shift summaries")
        
except Exception as e:
    print(f"❌ Error: {e}")
