#!/usr/bin/env python3
"""
Check actual product prices and backend filtering
"""

import requests
import json

# Get backend URL
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    return "https://smart-jewelry-1.preview.emergentagent.com"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

def check_product_prices():
    """Check the actual price range of products"""
    try:
        response = requests.get(f"{API_BASE}/products", timeout=10)
        if response.status_code == 200:
            products = response.json()
            
            prices_usd = [p.get("price", 0) for p in products]
            prices_usd.sort()
            
            USD_TO_INR = 83.0
            
            print(f"Product price analysis:")
            print(f"Total products: {len(products)}")
            print(f"Price range (USD): ${prices_usd[0]:.2f} - ${prices_usd[-1]:.2f}")
            print(f"Price range (INR): ₹{prices_usd[0] * USD_TO_INR:.0f} - ₹{prices_usd[-1] * USD_TO_INR:.0f}")
            
            print(f"\nCheapest 10 products:")
            for i in range(min(10, len(products))):
                product = next(p for p in products if p.get("price") == prices_usd[i])
                price_inr = prices_usd[i] * USD_TO_INR
                print(f"  {i+1}. {product['name']} - ${prices_usd[i]:.2f} (₹{price_inr:.0f})")
            
            # Test different budget ranges
            budget_ranges = {
                "Under ₹8,000": (0, 8000),
                "₹8,000–₹25,000": (8000, 25000),
                "₹25,000–₹65,000": (25000, 65000),
                "₹65,000+": (65000, 10**9),
            }
            
            print(f"\nBudget range analysis:")
            for budget_name, (min_inr, max_inr) in budget_ranges.items():
                count = sum(1 for price in prices_usd 
                           if min_inr <= price * USD_TO_INR <= max_inr)
                print(f"  {budget_name}: {count} products")
            
        else:
            print(f"❌ Products endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error checking prices: {e}")

def test_higher_budget():
    """Test survey with a higher budget that should have products"""
    try:
        survey_data = {
            "occasion": "Everyday",
            "style": "Classic",
            "budget": "₹8,000–₹25,000"  # Higher budget range
        }
        
        response = requests.post(
            f"{API_BASE}/survey",
            json=survey_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"\nTesting higher budget range:")
        print(f"Survey response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            recommendations = data.get("recommendations", [])
            print(f"Recommendations returned: {len(recommendations)}")
            
            if recommendations:
                print("Sample recommendation:")
                rec = recommendations[0]
                product = rec["product"]
                price_inr = product["price"] * 83.0
                print(f"  Product: {product['name']}")
                print(f"  Price: ${product['price']:.2f} (₹{price_inr:.0f})")
                print(f"  Reason: {rec['reason']}")
        
    except Exception as e:
        print(f"❌ Error testing higher budget: {e}")

def main():
    print("🔍 Checking Product Prices and Budget Filtering")
    print("=" * 60)
    
    check_product_prices()
    test_higher_budget()

if __name__ == "__main__":
    main()