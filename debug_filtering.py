#!/usr/bin/env python3
"""
Debug the product filtering logic
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

def analyze_products_for_budget():
    """Analyze products to see which ones fit the budget"""
    try:
        response = requests.get(f"{API_BASE}/products", timeout=10)
        if response.status_code == 200:
            products = response.json()
            
            # Budget range: Under ₹8,000 (0 to 8000 INR)
            USD_TO_INR = 83.0
            max_inr = 8000
            max_usd = max_inr / USD_TO_INR  # ~96.39 USD
            
            print(f"Budget analysis for 'Under ₹8,000':")
            print(f"Max USD price: ${max_usd:.2f}")
            print(f"USD to INR rate: {USD_TO_INR}")
            
            within_budget = []
            over_budget = []
            
            for product in products:
                price_usd = product.get("price", 0)
                price_inr = price_usd * USD_TO_INR
                
                if price_usd <= max_usd:
                    within_budget.append({
                        "name": product["name"],
                        "price_usd": price_usd,
                        "price_inr": price_inr,
                        "style_tags": product.get("style_tags", []),
                        "occasion_tags": product.get("occasion_tags", [])
                    })
                else:
                    over_budget.append({
                        "name": product["name"],
                        "price_usd": price_usd,
                        "price_inr": price_inr
                    })
            
            print(f"\n✅ Products within budget: {len(within_budget)}")
            print(f"❌ Products over budget: {len(over_budget)}")
            
            if within_budget:
                print("\nSample products within budget:")
                for i, product in enumerate(within_budget[:5]):
                    print(f"  {i+1}. {product['name']} - ${product['price_usd']:.2f} (₹{product['price_inr']:.0f})")
                    print(f"     Style: {product['style_tags']}, Occasion: {product['occasion_tags']}")
            
            # Check for classic/everyday matches
            classic_everyday = [p for p in within_budget 
                              if any('classic' in tag.lower() for tag in p['style_tags']) 
                              or any('everyday' in tag.lower() for tag in p['occasion_tags'])]
            
            print(f"\n🎯 Classic/Everyday products within budget: {len(classic_everyday)}")
            
            return len(within_budget) > 0
            
        else:
            print(f"❌ Products endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error analyzing products: {e}")
        return False

def main():
    print("🔍 Analyzing Product Filtering Logic")
    print("=" * 50)
    
    analyze_products_for_budget()

if __name__ == "__main__":
    main()