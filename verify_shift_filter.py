#!/usr/bin/env python3
import urllib.request
import json

# Test the shift filter
API_URL_FILTER = "http://localhost:8002/get-tickets?idCRM=1539874562&date1=20260319&date2=20260319&closureNumber=5&limit=10"

print("🔍 Testing Shift Filtering (closureNumber=5):\n")

try:
    with urllib.request.urlopen(API_URL_FILTER) as response:
        data = json.loads(response.read().decode())
        print(f"✅ Tickets with Shift 5: {data.get('totalCount', 0)}\n")
        
        if data.get('data'):
            for ticket in data['data']:
                print(f"   Ticket #{ticket.get('idTiquer')}:")
                print(f"     - closureNumber: {ticket.get('closureNumber', 'NOT FOUND')}")
                print(f"     - Z: {ticket.get('Z', 'NOT FOUND')}")
                print(f"     - Amount: €{ticket.get('TTC', 0)}")
                print()
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*70)
print("🔍 Checking Raw Ticket Data (first ticket):\n")

API_URL_ALL = "http://localhost:8002/get-tickets?idCRM=1539874562&date1=20260319&date2=20260319&limit=1"

try:
    with urllib.request.urlopen(API_URL_ALL) as response:
        data = json.loads(response.read().decode())
        
        if data.get('data'):
            ticket = data['data'][0]
            print("Available fields in ticket object:")
            for key in sorted(ticket.keys()):
                value = ticket[key]
                if isinstance(value, dict):
                    print(f"  {key}: [object]")
                elif isinstance(value, list):
                    print(f"  {key}: [array of {len(value)} items]")
                elif key in ['closureNumber', 'Z', 'idTiquer', 'Date', 'HeureTicket', 'TTC']:
                    print(f"  {key}: {value}")
                    
except Exception as e:
    print(f"❌ Error: {e}")
