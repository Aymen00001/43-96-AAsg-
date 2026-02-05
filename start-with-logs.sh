#!/bin/bash

# Path to your app
APP_PATH="/home5/makseb/api-statistics.makseb.fr/app.js"

# Logs folder
LOG_DIR="/home5/makseb/api-statistics.makseb.fr/logs"

# Ensure log folder exists
mkdir -p "$LOG_DIR"

# Log files
OUT_LOG="$LOG_DIR/out.log"
ERR_LOG="$LOG_DIR/error.log"

# Start app and redirect stdout & stderr
node "$APP_PATH" >> "$OUT_LOG" 2>> "$ERR_LOG"