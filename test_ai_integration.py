#!/usr/bin/env python3
"""
Test AI integration and recommendation engine
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
    return "https://stylist-kiosk.preview.emergentagent.com"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

def test_ai_vibe_endpoint():
    """Test the AI vibe endpoint directly"""
    try:
        ai_data = {
            "occasion": "Special Events",
            "style": "Modern",
            "budget": "₹25,000–₹65,000",
            "vibe_preference": "Editorial Chic"
        }
        
        response = requests.post(
            f"{API_BASE}/ai/vibe",
            json=ai_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"AI Vibe endpoint status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI Vibe Response:")
            print(f"   Vibe: {data.get('vibe')}")
            print(f"   Source: {data.get('source')}")
            print(f"   Explanation: {data.get('explanation')[:100]}...")
            return True
        else:
            print(f"❌ AI Vibe failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing AI vibe: {e}")
        return False

def test_recommendation_consistency():
    """Test that recommendations are consistent and relevant"""
    try:
        # Test multiple calls with same data to check consistency
        survey_data = {
            "occasion": "Work",
            "style": "Classic",
            "budget": "₹25,000–₹65,000"
        }
        
        responses = []
        for i in range(2):
            response = requests.post(
                f"{API_BASE}/survey",
                json=survey_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            if response.status_code == 200:
                responses.append(response.json())
        
        if len(responses) == 2:
            print(f"✅ Recommendation Consistency Test:")
            print(f"   Call 1 - Vibe: {responses[0]['vibe']}, Recommendations: {len(responses[0]['recommendations'])}")
            print(f"   Call 2 - Vibe: {responses[1]['vibe']}, Recommendations: {len(responses[1]['recommendations'])}")
            
            # Check if vibes are consistent (should be same for same input)
            if responses[0]['vibe'] == responses[1]['vibe']:
                print(f"   ✅ Vibe consistency: Both calls returned '{responses[0]['vibe']}'")
            else:
                print(f"   ⚠️  Vibe variation: '{responses[0]['vibe']}' vs '{responses[1]['vibe']}'")
            
            return True
        else:
            print(f"❌ Failed to get consistent responses")
            return False
            
    except Exception as e:
        print(f"❌ Error testing consistency: {e}")
        return False

def main():
    print("🤖 Testing AI Integration and Recommendation Engine")
    print("=" * 60)
    
    print("\n1. Testing AI Vibe Endpoint...")
    test_ai_vibe_endpoint()
    
    print("\n2. Testing Recommendation Consistency...")
    test_recommendation_consistency()

if __name__ == "__main__":
    main()