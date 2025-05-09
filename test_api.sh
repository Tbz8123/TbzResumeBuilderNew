#!/bin/bash

# Get the API URL from the Replit environment
# Adjust the name of the workflow if needed
API_URL="https://${REPL_SLUG}.${REPL_OWNER}.repl.co"

# Test the job descriptions API with a specific job title ID
echo "Testing job descriptions API with job title ID 156 (Tbz23)"
curl -s "${API_URL}/api/jobs/descriptions?jobTitleId=156" | grep -c "id" || echo "Error or no results"

echo ""
echo "Testing job descriptions API with job title ID 28 (Manager)"
curl -s "${API_URL}/api/jobs/descriptions?jobTitleId=28" | grep -c "id" || echo "Error or no results"