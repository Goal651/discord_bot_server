#!/bin/bash

# Usage: ./upload-secrets.sh ci.env

ENV_FILE="${1:-ci.env}"

if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: File '$ENV_FILE' not found."
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  # Remove leading/trailing whitespace
  line="$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  # Skip empty lines and comments
  if [[ -z "$line" || "$line" == \#* ]]; then
    continue
  fi
  # Split on first '=' only
  name="${line%%=*}"
  value="${line#*=}"
  # Remove whitespace from name
  name="$(echo "$name" | sed -e 's/[[:space:]]*$//')"
  if [[ -n "$name" ]]; then
    echo "Setting secret: $name"
    gh secret set "$name" -b"$value"
  fi
done < "$ENV_FILE"