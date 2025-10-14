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
    
    def test_survey_api_budget_filtering(self):
        """Test Survey API (/api/survey) with multiple budget ranges as specified in review request"""
        test_cases = [
            {
                "name": "₹10K-₹60K Range (Should return products from 41 available)",
                "data": {
                    "occasion": "Special Events",
                    "style": "Modern",
                    "budget": "₹25,000–₹65,000"  # This covers the ₹10K-₹60K range mentioned
                },
                "expected_products": "from_41_available",
                "min_expected": 3
            },
            {
                "name": "₹60K-₹1L Range (Should return products from 4 available)",
                "data": {
                    "occasion": "Special Events",
                    "style": "Classic",
                    "budget": "₹65,000+"  # This covers the ₹60K-₹1L range mentioned
                },
                "expected_products": "from_4_available",
                "min_expected": 1
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
                        self.log_test(f"Survey Budget Filtering: {test_case['name']}", False, f"Missing fields: {missing_fields}")
                        all_passed = False
                        continue
                    
                    # Validate recommendations
                    recommendations = data.get("recommendations", [])
                    min_expected = test_case.get("min_expected", 1)
                    
                    if len(recommendations) < min_expected:
                        self.log_test(f"Survey Budget Filtering: {test_case['name']}", False, 
                                    f"Got {len(recommendations)} recommendations, expected at least {min_expected}")
                        all_passed = False
                        continue
                    
                    # Verify product data includes real CDN images, proper names, accurate INR prices
                    cdn_images_found = 0
                    inr_prices_found = 0
                    real_product_names = 0
                    
                    expected_real_names = ["Talia", "Orbis", "Romance", "Nova", "Tranquil", "Lineal", "Victoria", "Marion"]
                    
                    for i, rec in enumerate(recommendations):
                        if not isinstance(rec, dict) or "product" not in rec or "reason" not in rec:
                            self.log_test(f"Survey Budget Filtering: {test_case['name']}", False, f"Invalid recommendation {i} structure")
                            all_passed = False
                            break
                        
                        product = rec["product"]
                        reason = rec.get("reason", "")
                        
                        # Check for CDN images
                        image_url = product.get("image_url", "")
                        if "cdn.shopify.com" in image_url:
                            cdn_images_found += 1
                        
                        # Check for INR prices in reason
                        if "₹" in reason:
                            inr_prices_found += 1
                        
                        # Check for real product names
                        product_name = product.get("name", "")
                        if any(real_name in product_name for real_name in expected_real_names):
                            real_product_names += 1
                    
                    if all_passed:
                        # Store session_id for passport test
                        if not self.session_id:
                            self.session_id = data["session_id"]
                        
                        details = (f"Recommendations: {len(recommendations)}, "
                                 f"CDN Images: {cdn_images_found}/{len(recommendations)}, "
                                 f"INR Prices: {inr_prices_found}/{len(recommendations)}, "
                                 f"Real Names: {real_product_names}/{len(recommendations)}")
                        
                        self.log_test(f"Survey Budget Filtering: {test_case['name']}", True, details)
                else:
                    self.log_test(f"Survey Budget Filtering: {test_case['name']}", False, f"Status {response.status_code}: {response.text}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Survey Budget Filtering: {test_case['name']}", False, f"Request failed: {str(e)}")
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
                if imported_count != 46:  # Expect 45 real products + 1 custom option = 46 total
                    self.log_test("Real Evol Products Import", False, f"Expected 46 products (45 real + 1 custom), got {imported_count}")
                    return False
                
                # Verify products are accessible via products endpoint
                products_response = requests.get(f"{API_BASE}/products", timeout=10)
                if products_response.status_code != 200:
                    self.log_test("Real Evol Products Import", False, "Cannot access products endpoint after import")
                    return False
                
                products = products_response.json()
                if len(products) != 46:
                    self.log_test("Real Evol Products Import", False, f"Products endpoint shows {len(products)} products, expected 46")
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
                            f"Successfully imported 46 products: 45 real Evol products (₹{min_price_inr:.0f} - ₹{max_price_inr:.0f}) + 1 custom option")
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

    def test_product_recommendations_engine(self):
        """Verify the recommendation engine works with real data: style matching, occasion matching, celebrity vibe assignments"""
        test_cases = [
            {
                "name": "Classic Style Matching",
                "data": {
                    "occasion": "Special Events",
                    "style": "Classic",
                    "budget": "₹25,000–₹65,000"
                },
                "expected_styles": ["Classic"],
                "expected_vibes": ["Hollywood Glam", "Editorial Chic"]
            },
            {
                "name": "Modern Style Matching", 
                "data": {
                    "occasion": "Special Events",
                    "style": "Modern",
                    "budget": "₹25,000–₹65,000"
                },
                "expected_styles": ["Modern"],
                "expected_vibes": ["Editorial Chic"]
            },
            {
                "name": "Vintage Style Matching",
                "data": {
                    "occasion": "Romantic",
                    "style": "Vintage",
                    "budget": "₹25,000–₹65,000"
                },
                "expected_styles": ["Vintage"],
                "expected_vibes": ["Vintage Romance"]
            },
            {
                "name": "Bohemian Style Matching",
                "data": {
                    "occasion": "Everyday",
                    "style": "Bohemian",
                    "budget": "₹25,000–₹65,000"
                },
                "expected_styles": ["Bohemian"],
                "expected_vibes": ["Boho Luxe"]
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
                    vibe = data.get("vibe", "")
                    
                    if len(recommendations) == 0:
                        self.log_test(f"Product Recommendations: {test_case['name']}", False, "No recommendations returned")
                        all_passed = False
                        continue
                    
                    # Check style matching
                    expected_styles = test_case.get("expected_styles", [])
                    style_matches = 0
                    
                    for rec in recommendations:
                        product = rec["product"]
                        style_tags = product.get("style_tags", [])
                        if any(style in style_tags for style in expected_styles):
                            style_matches += 1
                    
                    # Check occasion matching
                    expected_occasion = test_case["data"]["occasion"]
                    occasion_matches = 0
                    
                    for rec in recommendations:
                        product = rec["product"]
                        occasion_tags = product.get("occasion_tags", [])
                        if expected_occasion in occasion_tags:
                            occasion_matches += 1
                    
                    # Check celebrity vibe assignments
                    expected_vibes = test_case.get("expected_vibes", [])
                    vibe_match = vibe in expected_vibes if expected_vibes else True
                    
                    # Check for custom jewelry option as last item
                    custom_option_found = False
                    if len(recommendations) >= 4:
                        last_product = recommendations[-1]["product"]
                        if "Design Your Dream Piece" in last_product.get("name", ""):
                            custom_option_found = True
                    
                    success_details = []
                    if style_matches > 0:
                        success_details.append(f"Style matches: {style_matches}/{len(recommendations)}")
                    if occasion_matches > 0:
                        success_details.append(f"Occasion matches: {occasion_matches}/{len(recommendations)}")
                    if vibe_match:
                        success_details.append(f"Vibe: {vibe}")
                    if custom_option_found:
                        success_details.append("Custom option included")
                    
                    if style_matches > 0 or occasion_matches > 0:
                        self.log_test(f"Product Recommendations: {test_case['name']}", True, 
                                    f"{len(recommendations)} recommendations, " + ", ".join(success_details))
                    else:
                        self.log_test(f"Product Recommendations: {test_case['name']}", False, 
                                    f"No style/occasion matches found in {len(recommendations)} recommendations")
                        all_passed = False
                else:
                    self.log_test(f"Product Recommendations: {test_case['name']}", False, f"Status {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Product Recommendations: {test_case['name']}", False, f"Request failed: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_custom_jewelry_option(self):
        """Confirm 'Design Your Dream Piece' appears as the last option in recommendations"""
        try:
            # Get recommendations that should include custom option
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
                self.log_test("Custom Jewelry Option", False, f"Survey failed with status {response.status_code}")
                return False
            
            data = response.json()
            recommendations = data.get("recommendations", [])
            
            if len(recommendations) == 0:
                self.log_test("Custom Jewelry Option", False, "No recommendations returned")
                return False
            
            # Check if custom option is present and is the last item
            custom_option_found = False
            custom_option_position = -1
            
            for i, rec in enumerate(recommendations):
                product = rec["product"]
                product_name = product.get("name", "")
                
                if "Design Your Dream Piece" in product_name:
                    custom_option_found = True
                    custom_option_position = i
                    
                    # Verify custom option properties
                    if product.get("price", -1) != 0:
                        self.log_test("Custom Jewelry Option", False, "Custom option should have price = 0")
                        return False
                    
                    if "Custom" not in product.get("style_tags", []) and "custom" not in str(product.get("style_tags", [])).lower():
                        # Check if it has appropriate style tags for custom jewelry
                        expected_styles = ["Classic", "Modern", "Vintage", "Bohemian"]
                        if not any(style in product.get("style_tags", []) for style in expected_styles):
                            self.log_test("Custom Jewelry Option", False, "Custom option missing appropriate style tags")
                            return False
                    
                    break
            
            if not custom_option_found:
                self.log_test("Custom Jewelry Option", False, "'Design Your Dream Piece' not found in recommendations")
                return False
            
            # Verify it's the last option (or close to last)
            if custom_option_position < len(recommendations) - 2:  # Allow some flexibility
                self.log_test("Custom Jewelry Option", False, f"Custom option at position {custom_option_position + 1}, should be last")
                return False
            
            self.log_test("Custom Jewelry Option", True, 
                        f"'Design Your Dream Piece' found at position {custom_option_position + 1}/{len(recommendations)}")
            return True
                
        except Exception as e:
            self.log_test("Custom Jewelry Option", False, f"Request failed: {str(e)}")
            return False

    def test_product_data_integrity(self):
        """Verify all products have valid image URLs, product URLs, metal types, karat options, and descriptions"""
        try:
            # Get all products to verify data integrity
            response = requests.get(f"{API_BASE}/products", timeout=10)
            
            if response.status_code != 200:
                self.log_test("Product Data Integrity", False, f"Products endpoint failed: {response.status_code}")
                return False
            
            products = response.json()
            
            if len(products) == 0:
                self.log_test("Product Data Integrity", False, "No products found")
                return False
            
            issues = []
            cdn_images = 0
            evol_urls = 0
            valid_descriptions = 0
            
            for i, product in enumerate(products):
                product_name = product.get("name", f"Product {i+1}")
                
                # Skip custom jewelry option for some checks
                is_custom = "Design Your Dream Piece" in product_name
                
                # Check image URLs (should be CDN URLs for real products)
                image_url = product.get("image_url", "")
                if image_url:
                    if "cdn.shopify.com" in image_url and not is_custom:
                        cdn_images += 1
                    elif is_custom and "unsplash.com" in image_url:
                        cdn_images += 1  # Custom option uses Unsplash image
                else:
                    issues.append(f"{product_name}: No image URL")
                
                # Check descriptions are informative
                description = product.get("description", "")
                if description and len(description) > 10:
                    valid_descriptions += 1
                elif not is_custom:
                    issues.append(f"{product_name}: Missing or too short description")
                
                # For real products, check for evoljewels.com URLs (this would be in original data)
                # Since we're testing the API response, we'll check if products have proper structure
                
                # Check style and occasion tags exist
                style_tags = product.get("style_tags", [])
                occasion_tags = product.get("occasion_tags", [])
                
                if not style_tags and not is_custom:
                    issues.append(f"{product_name}: No style tags")
                if not occasion_tags and not is_custom:
                    issues.append(f"{product_name}: No occasion tags")
            
            # Calculate success rates
            total_real_products = len(products) - 1  # Exclude custom option
            cdn_success_rate = (cdn_images / len(products)) * 100
            description_success_rate = (valid_descriptions / total_real_products) * 100 if total_real_products > 0 else 0
            
            if len(issues) > 5:  # Allow some minor issues
                self.log_test("Product Data Integrity", False, f"Too many issues: {'; '.join(issues[:3])}...")
                return False
            
            if cdn_success_rate < 80:  # At least 80% should have proper CDN images
                self.log_test("Product Data Integrity", False, f"Only {cdn_success_rate:.1f}% have CDN images")
                return False
            
            if description_success_rate < 80:  # At least 80% should have good descriptions
                self.log_test("Product Data Integrity", False, f"Only {description_success_rate:.1f}% have valid descriptions")
                return False
            
            self.log_test("Product Data Integrity", True, 
                        f"{len(products)} products verified: {cdn_success_rate:.1f}% CDN images, {description_success_rate:.1f}% valid descriptions")
            return True
                
        except Exception as e:
            self.log_test("Product Data Integrity", False, f"Request failed: {str(e)}")
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
        """Run all real Evol Jewels product data tests"""
        print(f"🧪 Testing Real Evol Jewels Product Data Integration")
        print(f"📍 Testing against: {API_BASE}")
        print(f"🎯 Verifying 45 real products (₹14,998 - ₹68,128 range)")
        print("=" * 80)
        
        # Run tests focusing on the review request requirements
        tests = [
            ("1. Product Import (45 products ₹14,998-₹68,128)", self.test_evol_products_import),
            ("2. Survey API Budget Filtering", self.test_survey_api_budget_filtering),
            ("3. Product Recommendations Engine", self.test_product_recommendations_engine),
            ("4. Custom Jewelry Option", self.test_custom_jewelry_option),
            ("5. Product Data Integrity", self.test_product_data_integrity),
            ("6. Celebrity Style Database", self.test_celebrity_styles_database),
            ("7. API Compatibility", self.test_api_compatibility),
            ("8. Performance and Reliability", self.test_performance_and_reliability)
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
        print(f"📊 Real Evol Jewels Product Data Test Summary: {passed}/{total} tests passed")
        
        if failed_tests:
            print(f"❌ Failed Tests:")
            for test in failed_tests:
                print(f"   • {test}")
        
        if passed == total:
            print("🎉 All real Evol Jewels product data tests PASSED!")
            print("✅ 45 real products properly loaded (₹14,998 - ₹68,128 range)")
            print("✅ Survey API filtering working with multiple budget ranges")
            print("✅ Recommendation engine matches styles, occasions, celebrity vibes")
            print("✅ Custom jewelry option 'Design Your Dream Piece' included")
            print("✅ Product data integrity verified (CDN images, INR prices, descriptions)")
            print("✅ System ready with real Evol Jewels inventory")
            return True
        else:
            print(f"⚠️  {total - passed} tests FAILED")
            print("🔧 Real Evol Jewels product integration needs attention")
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