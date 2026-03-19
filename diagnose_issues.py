#!/usr/bin/env python3
import urllib.request
import json

STORE_ID = "1539874562"

print("🔍 DIAGNOSING ISSUES:\n")
print("=" * 70)

# Check what the API is actually returning
API_URL = f"http://localhost:8002/get-tickets?idCRM={STORE_ID}&date1=20260315&date2=20260319&limit=5"

print("\n1️⃣ Checking API RESPONSE FORMAT:\n")

try:
    with urllib.request.urlopen(API_URL) as response:
        data = json.loads(response.read().decode())
        tickets = data.get('data', [])
        
        if tickets:
            sample = tickets[0]
            print(f"Sample ticket structure:")
            print(f"  ✓ Has idTiquer: {bool(sample.get('idTiquer'))}")
            print(f"  ✓ Has closureNumber: {bool(sample.get('closureNumber'))}")
            print(f"  ✓ Has Z: {bool(sample.get('Z'))}")
            print(f"  ✓ Has ConsumptionMode: {bool(sample.get('ConsumptionMode'))}")
            print(f"  ✓ Has PaymentMethods: {bool(sample.get('PaymentMethods'))}")
            
            print(f"\nActual values:")
            print(f"  closureNumber: {sample.get('closureNumber', 'MISSING')}")
            print(f"  Z: {sample.get('Z', 'MISSING')}")
            print(f"  ConsumptionMode: {sample.get('ConsumptionMode', 'MISSING')}")
            print(f"  PaymentMethod: {sample.get('PaymentMethods', [{}])[0].get('payment_method', 'MISSING')}")
            
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
print("\n2️⃣ Checking PAYMENT METHODS in system:\n")

API_URL = f"http://localhost:8002/get-tickets?idCRM={STORE_ID}&date1=20260315&date2=20260319&limit=100"

try:
    with urllib.request.urlopen(API_URL) as response:
        data = json.loads(response.read().decode())
        tickets = data.get('data', [])
        
        payments = {}
        for ticket in tickets:
            pm = ticket.get('PaymentMethods', [{}])[0].get('payment_method', 'Unknown')
            payments[pm] = payments.get(pm, 0) + 1
        
        print("Payment Methods found in database:")
        for method in sorted(payments.keys()):
            print(f"  • {method}: {payments[method]} tickets")
            
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
print("\n3️⃣ Checking FULFILLMENT MODES in system:\n")

try:
    with urllib.request.urlopen(API_URL) as response:
        data = json.loads(response.read().decode())
        tickets = data.get('data', [])
        
        modes = {}
        for ticket in tickets:
            mode = ticket.get('ConsumptionMode', 'Unknown')
            modes[mode] = modes.get(mode, 0) + 1
        
        print("Fulfillment Modes found in database:")
        for mode in sorted(modes.keys()):
            print(f"  • {mode}: {modes[mode]} tickets")
            print(f"    (French: À Emporter=Takeaway, Livraison=Delivery, Sur Place=Dine-in)")
            
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
print("\n4️⃣ SHIFT/CLOSURE NUMBER CHECK:\n")

try:
    with urllib.request.urlopen(API_URL) as response:
        data = json.loads(response.read().decode())
        tickets = data.get('data', [])
        
        shifts_z = {}
        shifts_closure = {}
        
        for ticket in tickets:
            z = ticket.get('Z')
            closure = ticket.get('closureNumber')
            
            if z is not None:
                shifts_z[str(z)] = shifts_z.get(str(z), 0) + 1
            if closure is not None:
                shifts_closure[str(closure)] = shifts_closure.get(str(closure), 0) + 1
        
        print("Shifts from 'Z' field:")
        if shifts_z:
            for shift in sorted(shifts_z.keys(), key=lambda x: int(x) if x.isdigit() else -1):
                print(f"  • Shift {shift}: {shifts_z[shift]} tickets")
        else:
            print("  • NO Z FIELD FOUND")
            
        print("\nShifts from 'closureNumber' field:")
        if shifts_closure:
            for shift in sorted(shifts_closure.keys(), key=lambda x: int(x) if x.isdigit() else -1):
                print(f"  • Shift {shift}: {shifts_closure[shift]} tickets")
        else:
            print("  • NO closureNumber FIELD FOUND ❌")
            
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 70)
