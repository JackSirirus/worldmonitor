#!/bin/sh
# Docker entrypoint script

# Copy dist files to shared volume on startup
if [ -d /app/dist ] && [ "$(ls -A /app/dist 2>/dev/null)" ]; then
    echo "[Entry] Copying dist files to shared volume..."
    cp -r /app/dist/* /app/dist-shared/ 2>/dev/null || true
fi

# Start the server with tsx (runs TypeScript directly)
exec npx tsx index.ts
