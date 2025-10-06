#!/usr/bin/env python3
"""
Backend API Testing for Jewelry Recommendation System
Tests the 4-page flow backend APIs as requested in the review.
"""

import requests
import json
import sys
import os
from typing import Dict, Any, List

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    return "https://style-genius-16.preview.emergentagent.com"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok") is True and "time" in data:
                    self.log_test("Health Check", True, f"Response: {data}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_survey_submission(self):
        """Test POST /api/survey with various budget ranges"""
        test_cases = [
            {
                "name": "Everyday Classic Low-Range (Expected: Few/No Results)",
                "data": {
                    "occasion": "Everyday",
                    "style": "Classic", 
                    "budget": "Under ₹8,000",
                    "vibe_preference": "Minimal Modern"
                },
                "expect_empty": True  # We expect this to be empty based on product prices
            },
            {
                "name": "Special Events Modern Mid-Range",
                "data": {
                    "occasion": "Special Events",
                    "style": "Modern",
                    "budget": "₹8,000–₹25,000"
                },
                "expect_empty": False
            },
            {
                "name": "Work Vintage High-Range",
                "data": {
                    "occasion": "Work",
                    "style": "Vintage", 
                    "budget": "₹25,000–₹65,000"
                },
                "expect_empty": False
            },
            {
                "name": "Romantic Bohemian Premium",
                "data": {
                    "occasion": "Romantic",
                    "style": "Bohemian",
                    "budget": "₹65,000+"
                },
                "expect_empty": False
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            try:
                response = requests.post(
                    f"{API_BASE}/survey",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure
                    required_fields = ["session_id", "engine", "vibe", "explanation", "moodboard_image", "recommendations", "created_at"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test(f"Survey: {test_case['name']}", False, f"Missing fields: {missing_fields}")
                        all_passed = False
                        continue
                    
                    # Validate recommendations
                    recommendations = data.get("recommendations", [])
                    if not isinstance(recommendations, list) or len(recommendations) == 0:
                        self.log_test(f"Survey: {test_case['name']}", False, "No recommendations returned")
                        all_passed = False
                        continue
                    
                    # Check if we have 4 recommendations as expected
                    if len(recommendations) < 3:
                        self.log_test(f"Survey: {test_case['name']}", False, f"Only {len(recommendations)} recommendations, expected at least 3")
                        all_passed = False
                        continue
                    
                    # Validate recommendation structure
                    for i, rec in enumerate(recommendations):
                        if not isinstance(rec, dict) or "product" not in rec or "reason" not in rec:
                            self.log_test(f"Survey: {test_case['name']}", False, f"Invalid recommendation {i} structure")
                            all_passed = False
                            break
                        
                        product = rec["product"]
                        required_product_fields = ["id", "name", "price", "image_url"]
                        missing_product_fields = [field for field in required_product_fields if field not in product]
                        if missing_product_fields:
                            self.log_test(f"Survey: {test_case['name']}", False, f"Product {i} missing fields: {missing_product_fields}")
                            all_passed = False
                            break
                    
                    if all_passed:
                        # Store session_id for passport test
                        if not self.session_id:
                            self.session_id = data["session_id"]
                        
                        self.log_test(
                            f"Survey: {test_case['name']}", 
                            True, 
                            f"Session: {data['session_id']}, Engine: {data['engine']}, Vibe: {data['vibe']}, Recommendations: {len(recommendations)}"
                        )
                else:
                    self.log_test(f"Survey: {test_case['name']}", False, f"Status {response.status_code}: {response.text}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Survey: {test_case['name']}", False, f"Request failed: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_passport_retrieval(self):
        """Test GET /api/passport/{session_id}"""
        if not self.session_id:
            self.log_test("Passport Retrieval", False, "No session_id available from survey test")
            return False
        
        try:
            response = requests.get(f"{API_BASE}/passport/{self.session_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ["session_id", "engine", "survey", "vibe", "explanation", "recommendations", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Passport Retrieval", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Validate survey data
                survey = data.get("survey", {})
                if not isinstance(survey, dict) or not survey.get("occasion") or not survey.get("style") or not survey.get("budget"):
                    self.log_test("Passport Retrieval", False, "Invalid survey data in passport")
                    return False
                
                # Validate recommendations
                recommendations = data.get("recommendations", [])
                if not isinstance(recommendations, list) or len(recommendations) == 0:
                    self.log_test("Passport Retrieval", False, "No recommendations in passport")
                    return False
                
                self.log_test(
                    "Passport Retrieval", 
                    True, 
                    f"Session: {data['session_id']}, Survey: {survey['occasion']}/{survey['style']}/{survey['budget']}, Recommendations: {len(recommendations)}"
                )
                return True
                
            elif response.status_code == 404:
                self.log_test("Passport Retrieval", False, "Session not found (404)")
                return False
            else:
                self.log_test("Passport Retrieval", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Passport Retrieval", False, f"Request failed: {str(e)}")
            return False
    
    def test_invalid_session_passport(self):
        """Test passport retrieval with invalid session_id"""
        try:
            fake_session_id = "invalid-session-id-12345"
            response = requests.get(f"{API_BASE}/passport/{fake_session_id}", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Invalid Session Passport", True, "Correctly returned 404 for invalid session")
                return True
            else:
                self.log_test("Invalid Session Passport", False, f"Expected 404, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Session Passport", False, f"Request failed: {str(e)}")
            return False
    
    def test_budget_filtering(self):
        """Test that budget filtering works correctly with INR ranges"""
        try:
            # Test with lowest budget range
            low_budget_data = {
                "occasion": "Everyday",
                "style": "Classic",
                "budget": "Under ₹8,000"
            }
            
            response = requests.post(
                f"{API_BASE}/survey",
                json=low_budget_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                recommendations = data.get("recommendations", [])
                
                # Check if all recommended products are within budget
                all_within_budget = True
                usd_to_inr = 83.0  # Default conversion rate from backend
                
                for rec in recommendations:
                    product = rec["product"]
                    price_usd = product.get("price", 0)
                    price_inr = price_usd * usd_to_inr
                    
                    if price_inr > 8000:  # Should be under ₹8,000
                        all_within_budget = False
                        self.log_test("Budget Filtering", False, f"Product {product['name']} at ₹{price_inr:.0f} exceeds budget")
                        break
                
                if all_within_budget:
                    self.log_test("Budget Filtering", True, f"All {len(recommendations)} products within ₹8,000 budget")
                    return True
                else:
                    return False
            else:
                self.log_test("Budget Filtering", False, f"Survey failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Budget Filtering", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🧪 Starting Backend API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 60)
        
        # Run tests in order
        tests = [
            self.test_health_check,
            self.test_survey_submission,
            self.test_passport_retrieval,
            self.test_invalid_session_passport,
            self.test_budget_filtering
        ]
        
        passed = 0
        total = 0
        
        for test_func in tests:
            result = test_func()
            if result:
                passed += 1
            total += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"📊 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend tests PASSED!")
            return True
        else:
            print(f"⚠️  {total - passed} tests FAILED")
            return False

def main():
    """Main test runner"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if not success:
        print("\n🔍 Failed tests require attention before proceeding with frontend testing.")
        sys.exit(1)
    else:
        print("\n✅ Backend APIs are working correctly and ready for frontend integration.")
        sys.exit(0)

if __name__ == "__main__":
    main()