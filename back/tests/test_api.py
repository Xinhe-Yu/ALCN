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
