#!/usr/bin/env python3
import requests
import json
import base64
import os
import uuid
import time
from typing import Dict, Any, List, Optional

# Get the backend URL from the frontend .env file
def get_backend_url():
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                return line.strip().split('=')[1].strip('"\'')
    raise ValueError("Could not find REACT_APP_BACKEND_URL in frontend/.env")

# Base URL for API requests
BASE_URL = f"{get_backend_url()}/api"
print(f"Using backend URL: {BASE_URL}")

# Test data
SAMPLE_TEMPLATE = {
    "name": "Certificate of Achievement",
    "width": 800,
    "height": 600,
    "backgroundImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "inputs": [
        {
            "id": str(uuid.uuid4()),
            "x": 100,
            "y": 150,
            "width": 300,
            "height": 50,
            "placeholder": "Recipient Name",
            "fontSize": 24,
            "fontFamily": "Times New Roman",
            "color": "#000080"
        },
        {
            "id": str(uuid.uuid4()),
            "x": 100,
            "y": 250,
            "width": 500,
            "height": 50,
            "placeholder": "Achievement Description",
            "fontSize": 18,
            "fontFamily": "Arial",
            "color": "#333333"
        }
    ]
}

# Helper functions
def print_separator():
    print("\n" + "="*80 + "\n")

def print_response(response, message="Response"):
    print(f"{message} Status Code: {response.status_code}")
    try:
        print(f"{message} JSON: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"{message} Text: {response.text}")

# Test functions
def test_root_endpoint():
    print_separator()
    print("Testing Root Endpoint")
    response = requests.get(f"{BASE_URL}/")
    print_response(response)
    assert response.status_code == 200
    assert "message" in response.json()
    print("✅ Root endpoint test passed")
    return True

def test_create_template():
    print_separator()
    print("Testing Create Template Endpoint")
    response = requests.post(
        f"{BASE_URL}/templates",
        json=SAMPLE_TEMPLATE
    )
    print_response(response)
    assert response.status_code == 200
    assert "id" in response.json()
    assert response.json()["name"] == SAMPLE_TEMPLATE["name"]
    assert len(response.json()["inputs"]) == len(SAMPLE_TEMPLATE["inputs"])
    print("✅ Create template test passed")
    return response.json()["id"]

def test_get_templates():
    print_separator()
    print("Testing Get All Templates Endpoint")
    response = requests.get(f"{BASE_URL}/templates")
    print_response(response)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    print(f"Found {len(response.json())} templates")
    print("✅ Get all templates test passed")
    return response.json()

def test_get_template_by_id(template_id):
    print_separator()
    print(f"Testing Get Template by ID Endpoint (ID: {template_id})")
    response = requests.get(f"{BASE_URL}/templates/{template_id}")
    print_response(response)
    assert response.status_code == 200
    assert response.json()["id"] == template_id
    print("✅ Get template by ID test passed")
    return response.json()

def test_get_nonexistent_template():
    print_separator()
    print("Testing Get Nonexistent Template Endpoint")
    fake_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/templates/{fake_id}")
    print_response(response)
    assert response.status_code == 404
    print("✅ Get nonexistent template test passed (404 error received)")
    return True

def test_generate_certificate(template_id):
    print_separator()
    print(f"Testing Generate Certificate Endpoint (Template ID: {template_id})")
    
    # Get the template to extract input IDs
    template_response = requests.get(f"{BASE_URL}/templates/{template_id}")
    template = template_response.json()
    
    # Create input values for each input in the template
    input_values = {}
    for input_item in template["inputs"]:
        input_values[input_item["id"]] = f"Test value for {input_item['placeholder']}"
    
    certificate_data = {
        "templateId": template_id,
        "inputValues": input_values
    }
    
    response = requests.post(
        f"{BASE_URL}/certificates/generate",
        json=certificate_data
    )
    print_response(response)
    assert response.status_code == 200
    assert "template" in response.json()
    assert "inputValues" in response.json()
    print("✅ Generate certificate test passed")
    return response.json()

def test_generate_certificate_nonexistent_template():
    print_separator()
    print("Testing Generate Certificate with Nonexistent Template")
    fake_id = str(uuid.uuid4())
    certificate_data = {
        "templateId": fake_id,
        "inputValues": {"dummy": "value"}
    }
    
    response = requests.post(
        f"{BASE_URL}/certificates/generate",
        json=certificate_data
    )
    print_response(response)
    assert response.status_code == 404
    print("✅ Generate certificate with nonexistent template test passed (404 error received)")
    return True

def test_delete_template(template_id):
    print_separator()
    print(f"Testing Delete Template Endpoint (ID: {template_id})")
    response = requests.delete(f"{BASE_URL}/templates/{template_id}")
    print_response(response)
    assert response.status_code == 200
    
    # Verify template is deleted
    verify_response = requests.get(f"{BASE_URL}/templates/{template_id}")
    assert verify_response.status_code == 404
    print("✅ Delete template test passed")
    return True

def test_delete_nonexistent_template():
    print_separator()
    print("Testing Delete Nonexistent Template Endpoint")
    fake_id = str(uuid.uuid4())
    response = requests.delete(f"{BASE_URL}/templates/{fake_id}")
    print_response(response)
    assert response.status_code == 404
    print("✅ Delete nonexistent template test passed (404 error received)")
    return True

def run_all_tests():
    try:
        print("\n🔍 STARTING BACKEND API TESTS 🔍\n")
        
        # Test root endpoint
        test_root_endpoint()
        
        # Test template creation and retrieval
        template_id = test_create_template()
        templates = test_get_templates()
        template = test_get_template_by_id(template_id)
        test_get_nonexistent_template()
        
        # Test certificate generation
        certificate = test_generate_certificate(template_id)
        test_generate_certificate_nonexistent_template()
        
        # Test template deletion
        test_delete_template(template_id)
        test_delete_nonexistent_template()
        
        print_separator()
        print("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉")
        return True
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR DURING TESTING: {str(e)}")
        return False

if __name__ == "__main__":
    run_all_tests()