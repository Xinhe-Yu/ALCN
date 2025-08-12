#!/usr/bin/env python3
"""
Simple API testing script for the Greco-Roman Dictionary API
"""

import requests
import json

BASE_URL = "http://localhost:8000"


def test_api():
    """Test the API endpoints"""
    print("🚀 Testing Greco-Roman Dictionary API")
    print("=" * 50)
    
    # Test root endpoint
    print("\n1. Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Test health check
    print("\n2. Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test authentication - login
    print("\n3. Testing authentication - login...")
    login_data = {"email": "test@example.com"}
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test authentication - verify (using dev code 123456)
    print("\n4. Testing authentication - verify...")
    verify_data = {"email": "test@example.com", "code": "123456"}
    response = requests.post(f"{BASE_URL}/api/v1/auth/verify", json=verify_data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data["access_token"]
        print(f"✅ Got access token: {access_token[:20]}...")
        
        # Test authenticated endpoint
        print("\n5. Testing authenticated endpoint...")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # Test creating an entry
        print("\n6. Testing entry creation...")
        entry_data = {
            "primary_name": "Αφροδίτη",
            "language_code": "grc",
            "entry_type": "personal_name",
            "definition": "Greek goddess of love and beauty",
            "etymology": "From Greek ἀφρός (aphros, foam) + δίτης"
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/entries/", 
            json=entry_data, 
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            entry = response.json()
            print(f"✅ Created entry: {entry['primary_name']}")
            entry_id = entry['id']
            
            # Test creating an entry with multiple language codes
            print("\n7. Testing entry with multiple languages...")
            multilang_entry_data = {
                "primary_name": "Arthur",
                "language_code": "en",
                "other_language_codes": ["fr", "de"],
                "entry_type": "personal_name",
                "definition": "A legendary British leader",
                "etymology": "From Latin Artorius"
            }
            response = requests.post(
                f"{BASE_URL}/api/v1/entries/", 
                json=multilang_entry_data, 
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                multilang_entry = response.json()
                print(f"✅ Created multilingual entry: {multilang_entry['primary_name']}")
                print(f"   Primary language: {multilang_entry['language_code']}")
                print(f"   Other languages: {multilang_entry['other_language_codes']}")
                
                # Test searching by other language codes
                print("\n8. Testing search by other language codes...")
                search_params = {"other_language_code": "fr"}
                response = requests.get(
                    f"{BASE_URL}/api/v1/entries/",
                    params=search_params,
                    headers=headers
                )
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    results = response.json()
                    print(f"Found {len(results)} entries with French as other language")
                    for result in results:
                        print(f"  - {result['primary_name']} (other_languages: {result.get('other_language_codes', [])})")
                
                # Test searching by any language
                print("\n9. Testing search by any language...")
                response = requests.get(
                    f"{BASE_URL}/api/v1/entries/search/by-language/fr",
                    headers=headers
                )
                print(f"Status: {response.status_code}")
                if response.status_code == 200:
                    results = response.json()
                    print(f"Found {len(results)} entries associated with French")
                    for result in results:
                        print(f"  - {result['primary_name']} (primary: {result['language_code']}, other: {result.get('other_language_codes', [])})")
            
            # Test trigram search
            print("\n10. Testing trigram search...")
            search_params = {"q": "Afrodite", "threshold": 0.2}
            response = requests.get(
                f"{BASE_URL}/api/v1/entries/search/trigram",
                params=search_params,
                headers=headers
            )
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                results = response.json()
                print(f"Found {len(results)} similar entries")
                for result in results:
                    print(f"  - {result['primary_name']}")
            
        else:
            print(f"❌ Failed to create entry: {response.json()}")
    else:
        print(f"❌ Authentication failed: {response.json()}")
    
    print("\n" + "=" * 50)
    print("📚 API Documentation available at:")
    print(f"   Swagger UI: {BASE_URL}/docs")
    print(f"   ReDoc: {BASE_URL}/redoc")


if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API server.")
        print("Make sure the server is running with: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")