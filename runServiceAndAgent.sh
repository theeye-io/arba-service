#!/bin/bash
curl -s "https://s3.amazonaws.com/theeye.agent/linux/setup.sh" | bash -s "$THEEYE_SUPERVISOR_CLIENT_ID" "$THEEYE_SUPERVISOR_CLIENT_SECRET" "Ypf"
npm start
