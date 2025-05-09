#!/bin/bash

# Test script for manual CSV upload to verify the endpoint works
echo "Testing CSV upload to /api/jobs/import-csv"

# Step 1: Register an admin user if not already registered
echo "Registering an admin user for testing..."
curl -c cookie.txt -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_test","password":"admin123","isAdmin":true}' \
  http://localhost:5000/api/register

# Step 2: Login to get a session cookie
echo "Logging in as admin..."
curl -c cookie.txt -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_test","password":"admin123"}' \
  http://localhost:5000/api/login

# Step 2: Submit the CSV file with the session cookie
echo "Uploading CSV file..."
curl -v -X POST \
  -b cookie.txt \
  -F "file=@temp/test-csv.csv" \
  http://localhost:5000/api/jobs/import-csv

echo ""
echo "Upload test complete"