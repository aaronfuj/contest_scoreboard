#!/usr/bin/env bash
# A helper script to start running the software (using a mac) with a shortcut
# Switch to the correct/current directory
cd -- "$(dirname "$0")"

# Build the server
npm build

# Run the server
npm run start