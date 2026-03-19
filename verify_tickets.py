#!/usr/bin/env python3
import urllib.request
import json

API_URL = "http://localhost:8002/get-tickets?idCRM=1539874562&date1=20260319&date2=20260319&limit=25"

try:
    with urllib.request.urlopen(API_URL) as response:
        data = json.loads(response.read().decode())
        print(f"✅ Total tickets retrieved: {data.get('totalCount', 0)}")
        print(f"   Showing {len(data.get('data', []))} on page 1\n")
        
        # Show shift distribution
        shifts = {}
        for ticket in data.get('data', []):
            shift = ticket.get('closureNumber', 'Unknown')
            shifts[shift] = shifts.get(shift, 0) + 1
        
        print("📊 Shift Distribution:")
        for shift in sorted(shifts.keys(), key=lambda x: int(x) if isinstance(x, (int, str)) and str(x).isdigit() else 999):
            print(f"   Shift {shift}: {shifts[shift]} tickets")
        
        # Show first ticket details
        if data.get('data'):
            ticket = data['data'][0]
            print(f"\n📋 Sample Ticket Details:")
            print(f"   Ticket #: {ticket.get('idTiquer')}")
            print(f"   Closure/Shift: {ticket.get('closureNumber', 'N/A')}")
            print(f"   Date: {ticket.get('Date')}")
            print(f"   Time: {ticket.get('HeureTicket')}")
            print(f"   Amount: €{ticket.get('TTC', 0)}")
            print(f"   Payment: {ticket.get('PaymentMethods', [{}])[0].get('payment_method', 'N/A')}")
            
except Exception as e:
    print(f"❌ Error: {e}")
