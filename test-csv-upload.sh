#!/bin/bash

# Test script for manual CSV upload to verify the endpoint works
echo "Testing CSV upload to /api/jobs/import-csv"

# Step 1: Login to get a session cookie
echo "Logging in as admin..."
curl -c cookie.txt -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"mhdtbz5@gmail.com","password":"password"}' \
  http://localhost:5000/api/login

# Step 2: Submit the CSV file with the session cookie
echo "Uploading CSV file..."
curl -v -X POST \
  -b cookie.txt \
  -F "file=@temp/test-csv.csv" \
  http://localhost:5000/api/jobs/import-csv

echo ""
echo "Upload test complete"