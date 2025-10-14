#!/usr/bin/env python3
"""
Debug script to check backend database and API responses
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

def check_products():
    """Check if products exist in database"""
    try:
        response = requests.get(f"{API_BASE}/products", timeout=10)
        if response.status_code == 200:
            products = response.json()
            print(f"✅ Found {len(products)} products in database")
            if products:
                print("Sample product:")
                print(json.dumps(products[0], indent=2))
            return len(products) > 0
        else:
            print(f"❌ Products endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error checking products: {e}")
        return False

def debug_survey():
    """Debug survey response in detail"""
    try:
        survey_data = {
            "occasion": "Everyday",
            "style": "Classic",
            "budget": "Under ₹8,000"
        }
        
        response = requests.post(
            f"{API_BASE}/survey",
            json=survey_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Survey response status: {response.status_code}")
        print("Survey response body:")
        print(json.dumps(response.json(), indent=2))
        
    except Exception as e:
        print(f"❌ Error in survey debug: {e}")

def main():
    print("🔍 Debugging Backend Issues")
    print("=" * 40)
    
    print("\n1. Checking products in database...")
    has_products = check_products()
    
    print("\n2. Debugging survey response...")
    debug_survey()

if __name__ == "__main__":
    main()