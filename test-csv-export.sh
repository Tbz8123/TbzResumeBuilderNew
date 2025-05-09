#!/bin/bash

# Test script for manual CSV export to verify the endpoint works
echo "Testing CSV export from /api/jobs/export-csv"

# Step 1: Login to get a session cookie
echo "Logging in as admin..."
curl -c cookie.txt -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_test","password":"admin123"}' \
  http://localhost:5000/api/login

# Step 2: Download the CSV file with the session cookie
echo "Downloading CSV file..."
curl -b cookie.txt \
  -H "Accept: text/csv" \
  http://localhost:5000/api/jobs/export-csv \
  -o exported-job-data.csv

# Step 3: Show the first few lines of the CSV file
echo "Showing the first few lines of the CSV file:"
head -n 5 exported-job-data.csv

# Step 4: Check for our test entries
echo -e "\nChecking for 'Tbz test upload' entries:"
grep "Tbz test upload" exported-job-data.csv

echo ""
echo "Export test complete. Full data saved to exported-job-data.csv"