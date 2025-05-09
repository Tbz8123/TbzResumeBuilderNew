#!/bin/bash

# Test script for manual CSV upload to verify the endpoint works
echo "Testing CSV upload to /api/jobs/import-csv"

curl -v -X POST \
  -H "Content-Type: multipart/form-data" \
  -F "file=@temp/test-csv.csv" \
  http://localhost:5000/api/jobs/import-csv

echo ""
echo "Upload test complete"