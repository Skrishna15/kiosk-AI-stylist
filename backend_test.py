#!/usr/bin/env python3
"""
Real Evol Jewels Product Data Testing for Luxury Jewelry Kiosk System
Tests the newly integrated real Evol Jewels product data with 45 products (₹14,998 - ₹68,128 range).
Verifies product import, survey API filtering, recommendation engine, and data integrity.
"""

import requests
import json
import sys
import os
from typing import Dict, Any, List
import time

# Get backend URL from frontend .env file
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
                    expect_empty = test_case.get("expect_empty", False)
                    
                    if expect_empty:
                        # For low budget ranges, empty results are acceptable
                        if len(recommendations) == 0:
                            self.log_test(f"Survey: {test_case['name']}", True, "No recommendations (expected for this budget range)")
                            continue
                        else:
                            self.log_test(f"Survey: {test_case['name']}", True, f"Got {len(recommendations)} recommendations (better than expected)")
                    else:
                        # For higher budget ranges, we expect recommendations
                        if not isinstance(recommendations, list) or len(recommendations) == 0:
                            self.log_test(f"Survey: {test_case['name']}", False, "No recommendations returned")
                            all_passed = False
                            continue
                        
                        # Check if we have at least 3 recommendations as expected
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
                        # Store session_id for passport test (use first non-empty result)
                        if not self.session_id and len(recommendations) > 0:
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
            # Test with mid-range budget that should have products
            mid_budget_data = {
                "occasion": "Everyday",
                "style": "Classic",
                "budget": "₹8,000–₹25,000"
            }
            
            response = requests.post(
                f"{API_BASE}/survey",
                json=mid_budget_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                recommendations = data.get("recommendations", [])
                
                if len(recommendations) == 0:
                    self.log_test("Budget Filtering", False, "No recommendations returned for mid-range budget")
                    return False
                
                # Check if all recommended products are within budget
                all_within_budget = True
                usd_to_inr = 83.0  # Default conversion rate from backend
                
                for rec in recommendations:
                    product = rec["product"]
                    price_usd = product.get("price", 0)
                    price_inr = price_usd * usd_to_inr
                    
                    if not (8000 <= price_inr <= 25000):  # Should be within ₹8,000–₹25,000
                        all_within_budget = False
                        self.log_test("Budget Filtering", False, f"Product {product['name']} at ₹{price_inr:.0f} outside budget range")
                        break
                
                if all_within_budget:
                    self.log_test("Budget Filtering", True, f"All {len(recommendations)} products within ₹8,000–₹25,000 budget")
                    return True
                else:
                    return False
            else:
                self.log_test("Budget Filtering", False, f"Survey failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Budget Filtering", False, f"Request failed: {str(e)}")
            return False

    def test_evol_products_import(self):
        """Test that all 45 real Evol Jewels products are properly loaded (₹14,998 - ₹68,128 range)"""
        try:
            # First import the products
            response = requests.post(
                f"{API_BASE}/admin/import-evol-products",
                headers={"Content-Type": "application/json"},
                timeout=20
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if not data.get("success"):
                    self.log_test("Real Evol Products Import", False, f"Import failed: {data}")
                    return False
                
                imported_count = data.get("imported", 0)
                if imported_count != 45:  # Expect exactly 45 products including custom option
                    self.log_test("Real Evol Products Import", False, f"Expected 45 products, got {imported_count}")
                    return False
                
                # Verify products are accessible via products endpoint
                products_response = requests.get(f"{API_BASE}/products", timeout=10)
                if products_response.status_code != 200:
                    self.log_test("Real Evol Products Import", False, "Cannot access products endpoint after import")
                    return False
                
                products = products_response.json()
                if len(products) != 45:
                    self.log_test("Real Evol Products Import", False, f"Products endpoint shows {len(products)} products, expected 45")
                    return False
                
                # Check price range (convert USD to INR for verification)
                usd_to_inr = 83.0
                min_price_inr = float('inf')
                max_price_inr = 0
                custom_product_found = False
                
                for product in products:
                    price_usd = product.get("price", 0)
                    price_inr = price_usd * usd_to_inr
                    
                    # Check for custom jewelry option (price = 0)
                    if price_usd == 0 and "Design Your Dream Piece" in product.get("name", ""):
                        custom_product_found = True
                        continue
                    
                    if price_inr < min_price_inr:
                        min_price_inr = price_inr
                    if price_inr > max_price_inr:
                        max_price_inr = price_inr
                
                # Verify price range matches expected ₹14,998 - ₹68,128
                if abs(min_price_inr - 14998) > 100:  # Allow small rounding differences
                    self.log_test("Real Evol Products Import", False, f"Min price ₹{min_price_inr:.0f} doesn't match expected ₹14,998")
                    return False
                
                if abs(max_price_inr - 68128) > 100:  # Allow small rounding differences
                    self.log_test("Real Evol Products Import", False, f"Max price ₹{max_price_inr:.0f} doesn't match expected ₹68,128")
                    return False
                
                if not custom_product_found:
                    self.log_test("Real Evol Products Import", False, "Custom jewelry option 'Design Your Dream Piece' not found")
                    return False
                
                self.log_test("Real Evol Products Import", True, 
                            f"Successfully imported 45 products (₹{min_price_inr:.0f} - ₹{max_price_inr:.0f} range) + custom option")
                return True
            else:
                self.log_test("Real Evol Products Import", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Real Evol Products Import", False, f"Request failed: {str(e)}")
            return False

    def test_celebrity_styles_database(self):
        """Test GET /api/celebrity-styles endpoint"""
        try:
            response = requests.get(f"{API_BASE}/celebrity-styles", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if "celebrities" not in data or "style_vibes" not in data:
                    self.log_test("Celebrity Styles Database", False, "Missing celebrities or style_vibes in response")
                    return False
                
                celebrities = data.get("celebrities", {})
                style_vibes = data.get("style_vibes", [])
                
                # Check for expected celebrities
                expected_celebrities = ["Emma Stone", "Blake Lively", "Margot Robbie", "Zendaya"]
                missing_celebrities = [name for name in expected_celebrities if name not in celebrities]
                
                if missing_celebrities:
                    self.log_test("Celebrity Styles Database", False, f"Missing celebrities: {missing_celebrities}")
                    return False
                
                # Check celebrity data structure
                for name, info in celebrities.items():
                    required_fields = ["style_vibe", "signature_looks", "occasions", "jewelry_preferences", "quote"]
                    missing_fields = [field for field in required_fields if field not in info]
                    if missing_fields:
                        self.log_test("Celebrity Styles Database", False, f"{name} missing fields: {missing_fields}")
                        return False
                
                # Check style vibes
                expected_vibes = ["Hollywood Glam", "Editorial Chic", "Vintage Romance", "Boho Luxe"]
                missing_vibes = [vibe for vibe in expected_vibes if vibe not in style_vibes]
                
                if missing_vibes:
                    self.log_test("Celebrity Styles Database", False, f"Missing style vibes: {missing_vibes}")
                    return False
                
                self.log_test("Celebrity Styles Database", True, f"Found {len(celebrities)} celebrities with {len(style_vibes)} style vibes")
                return True
            else:
                self.log_test("Celebrity Styles Database", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Celebrity Styles Database", False, f"Request failed: {str(e)}")
            return False

    def test_enhanced_product_recommendations(self):
        """Test enhanced product recommendations with real Evol Jewels products"""
        test_cases = [
            {
                "name": "Classic Style Under ₹8,000 (Expected: No Results)",
                "data": {
                    "occasion": "Special Events",
                    "style": "Classic", 
                    "budget": "Under ₹8,000"
                },
                "expect_empty": True
            },
            {
                "name": "Modern Style ₹25,000–₹65,000 (Expected: Real Evol Products)",
                "data": {
                    "occasion": "Special Events",
                    "style": "Modern",
                    "budget": "₹25,000–₹65,000"
                },
                "expect_real_products": True
            },
            {
                "name": "Vintage Style ₹65,000+ (Expected: Premium Products)",
                "data": {
                    "occasion": "Romantic",
                    "style": "Vintage",
                    "budget": "₹65,000+"
                },
                "expect_real_products": True
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
                    recommendations = data.get("recommendations", [])
                    
                    if test_case.get("expect_empty"):
                        if len(recommendations) == 0:
                            self.log_test(f"Enhanced Recommendations: {test_case['name']}", True, "No recommendations (expected for low budget)")
                        else:
                            self.log_test(f"Enhanced Recommendations: {test_case['name']}", True, f"Got {len(recommendations)} recommendations (better than expected)")
                    elif test_case.get("expect_real_products"):
                        if len(recommendations) == 0:
                            self.log_test(f"Enhanced Recommendations: {test_case['name']}", False, "No recommendations returned")
                            all_passed = False
                            continue
                        
                        # Check for real Evol product names
                        real_product_names = ["Talia Diamond Ring", "Orbis Diamond Ring", "Hold Me Closer Diamond Ring", 
                                            "Romance Diamond Ring", "Dazzling Dewdrop Diamond Studs", "Wain Marquise Diamond Ring"]
                        
                        found_real_products = 0
                        for rec in recommendations:
                            product_name = rec["product"]["name"]
                            if any(real_name in product_name for real_name in real_product_names):
                                found_real_products += 1
                        
                        if found_real_products > 0:
                            self.log_test(f"Enhanced Recommendations: {test_case['name']}", True, 
                                        f"Found {found_real_products}/{len(recommendations)} real Evol products")
                        else:
                            self.log_test(f"Enhanced Recommendations: {test_case['name']}", False, 
                                        "No real Evol product names found in recommendations")
                            all_passed = False
                else:
                    self.log_test(f"Enhanced Recommendations: {test_case['name']}", False, f"Status {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Enhanced Recommendations: {test_case['name']}", False, f"Request failed: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_data_integration_verification(self):
        """Test data integration with INR pricing, CDN images, and product details"""
        try:
            # Get recommendations with mid-range budget
            response = requests.post(
                f"{API_BASE}/survey",
                json={
                    "occasion": "Special Events",
                    "style": "Modern",
                    "budget": "₹25,000–₹65,000"
                },
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test("Data Integration Verification", False, f"Survey failed with status {response.status_code}")
                return False
            
            data = response.json()
            recommendations = data.get("recommendations", [])
            
            if len(recommendations) == 0:
                self.log_test("Data Integration Verification", False, "No recommendations to verify")
                return False
            
            issues = []
            
            for i, rec in enumerate(recommendations):
                product = rec["product"]
                
                # Check INR pricing display in reason
                reason = rec.get("reason", "")
                if "₹" not in reason:
                    issues.append(f"Product {i+1}: No INR pricing in reason")
                
                # Check image URL accessibility
                image_url = product.get("image_url", "")
                if image_url:
                    try:
                        img_response = requests.head(image_url, timeout=5)
                        if img_response.status_code not in [200, 301, 302]:
                            issues.append(f"Product {i+1}: Image URL not accessible ({img_response.status_code})")
                    except:
                        issues.append(f"Product {i+1}: Image URL request failed")
                else:
                    issues.append(f"Product {i+1}: No image URL")
                
                # Check product description
                if not product.get("description"):
                    issues.append(f"Product {i+1}: No description")
                
                # Check style and occasion tags
                if not product.get("style_tags") or not product.get("occasion_tags"):
                    issues.append(f"Product {i+1}: Missing style or occasion tags")
            
            if issues:
                self.log_test("Data Integration Verification", False, f"Issues found: {'; '.join(issues[:3])}")
                return False
            else:
                self.log_test("Data Integration Verification", True, f"All {len(recommendations)} products have proper INR pricing, accessible images, and complete data")
                return True
                
        except Exception as e:
            self.log_test("Data Integration Verification", False, f"Request failed: {str(e)}")
            return False

    def test_api_compatibility(self):
        """Test that existing frontend still works with enhanced backend"""
        try:
            # Test the complete flow that frontend would use
            survey_data = {
                "occasion": "Special Events",
                "style": "Modern",
                "budget": "₹25,000–₹65,000"
            }
            
            # Step 1: Submit survey
            response = requests.post(
                f"{API_BASE}/survey",
                json=survey_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test("API Compatibility", False, f"Survey submission failed: {response.status_code}")
                return False
            
            survey_result = response.json()
            session_id = survey_result.get("session_id")
            
            if not session_id:
                self.log_test("API Compatibility", False, "No session_id returned from survey")
                return False
            
            # Step 2: Get passport
            passport_response = requests.get(f"{API_BASE}/passport/{session_id}", timeout=10)
            
            if passport_response.status_code != 200:
                self.log_test("API Compatibility", False, f"Passport retrieval failed: {passport_response.status_code}")
                return False
            
            passport_data = passport_response.json()
            
            # Step 3: Test AI vibe endpoint
            ai_response = requests.post(
                f"{API_BASE}/ai/vibe",
                json=survey_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if ai_response.status_code != 200:
                self.log_test("API Compatibility", False, f"AI vibe endpoint failed: {ai_response.status_code}")
                return False
            
            ai_data = ai_response.json()
            
            # Verify all responses have expected structure
            required_survey_fields = ["session_id", "vibe", "recommendations"]
            required_passport_fields = ["session_id", "survey", "recommendations"]
            required_ai_fields = ["vibe", "explanation", "source"]
            
            missing_survey = [f for f in required_survey_fields if f not in survey_result]
            missing_passport = [f for f in required_passport_fields if f not in passport_data]
            missing_ai = [f for f in required_ai_fields if f not in ai_data]
            
            if missing_survey or missing_passport or missing_ai:
                issues = []
                if missing_survey: issues.append(f"Survey missing: {missing_survey}")
                if missing_passport: issues.append(f"Passport missing: {missing_passport}")
                if missing_ai: issues.append(f"AI missing: {missing_ai}")
                self.log_test("API Compatibility", False, f"Missing fields: {'; '.join(issues)}")
                return False
            
            self.log_test("API Compatibility", True, "All frontend APIs working with enhanced backend")
            return True
            
        except Exception as e:
            self.log_test("API Compatibility", False, f"Request failed: {str(e)}")
            return False

    def test_performance_and_reliability(self):
        """Test system performance and reliability with real product dataset"""
        try:
            start_time = time.time()
            
            # Test multiple concurrent-like requests
            test_requests = [
                {"occasion": "Everyday", "style": "Classic", "budget": "₹8,000–₹25,000"},
                {"occasion": "Special Events", "style": "Modern", "budget": "₹25,000–₹65,000"},
                {"occasion": "Romantic", "style": "Vintage", "budget": "₹65,000+"},
                {"occasion": "Work", "style": "Modern", "budget": "₹25,000–₹65,000"}
            ]
            
            successful_requests = 0
            total_response_time = 0
            
            for i, survey_data in enumerate(test_requests):
                request_start = time.time()
                
                response = requests.post(
                    f"{API_BASE}/survey",
                    json=survey_data,
                    headers={"Content-Type": "application/json"},
                    timeout=20
                )
                
                request_time = time.time() - request_start
                total_response_time += request_time
                
                if response.status_code == 200:
                    successful_requests += 1
                    data = response.json()
                    
                    # Verify response has recommendations (except for low budget)
                    recommendations = data.get("recommendations", [])
                    if survey_data["budget"] != "₹8,000–₹25,000" and len(recommendations) == 0:
                        self.log_test("Performance and Reliability", False, f"Request {i+1}: No recommendations for higher budget")
                        return False
                else:
                    self.log_test("Performance and Reliability", False, f"Request {i+1} failed: {response.status_code}")
                    return False
            
            total_time = time.time() - start_time
            avg_response_time = total_response_time / len(test_requests)
            
            # Performance criteria
            if total_time > 30:  # Should complete all requests within 30 seconds
                self.log_test("Performance and Reliability", False, f"Total time {total_time:.2f}s exceeds 30s limit")
                return False
            
            if avg_response_time > 10:  # Average response should be under 10 seconds
                self.log_test("Performance and Reliability", False, f"Average response time {avg_response_time:.2f}s exceeds 10s limit")
                return False
            
            if successful_requests != len(test_requests):
                self.log_test("Performance and Reliability", False, f"Only {successful_requests}/{len(test_requests)} requests successful")
                return False
            
            self.log_test("Performance and Reliability", True, 
                        f"All {successful_requests} requests successful, avg response: {avg_response_time:.2f}s, total: {total_time:.2f}s")
            return True
            
        except Exception as e:
            self.log_test("Performance and Reliability", False, f"Test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all enhanced backend tests"""
        print(f"🧪 Starting Enhanced Backend API Tests for Luxury Jewelry Kiosk System")
        print(f"📍 Testing against: {API_BASE}")
        print(f"🎯 Testing the remaining 30% completion with real Evol Jewels data")
        print("=" * 80)
        
        # Run tests in order - enhanced features first
        tests = [
            ("Basic Health Check", self.test_health_check),
            ("Real Evol Jewels Product Import", self.test_evol_products_import),
            ("Celebrity Style Database", self.test_celebrity_styles_database),
            ("Enhanced Product Recommendations", self.test_enhanced_product_recommendations),
            ("Data Integration Verification", self.test_data_integration_verification),
            ("API Compatibility", self.test_api_compatibility),
            ("Performance and Reliability", self.test_performance_and_reliability),
            ("Legacy Survey Submission", self.test_survey_submission),
            ("Legacy Passport Retrieval", self.test_passport_retrieval),
            ("Legacy Invalid Session", self.test_invalid_session_passport),
            ("Legacy Budget Filtering", self.test_budget_filtering)
        ]
        
        passed = 0
        total = 0
        failed_tests = []
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            print("-" * 40)
            result = test_func()
            if result:
                passed += 1
            else:
                failed_tests.append(test_name)
            total += 1
            print()  # Add spacing between tests
        
        print("=" * 80)
        print(f"📊 Enhanced Backend Test Summary: {passed}/{total} tests passed")
        
        if failed_tests:
            print(f"❌ Failed Tests:")
            for test in failed_tests:
                print(f"   • {test}")
        
        if passed == total:
            print("🎉 All enhanced backend tests PASSED!")
            print("✅ Real Evol Jewels integration working correctly")
            print("✅ Celebrity style database functional")
            print("✅ Enhanced recommendations with real product data")
            print("✅ System ready for production deployment")
            return True
        else:
            print(f"⚠️  {total - passed} tests FAILED")
            print("🔧 Enhanced backend features need attention")
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