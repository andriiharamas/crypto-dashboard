#!/bin/bash

API_KEY="62efaa5c8b97f753a9fc4ea215366102"
API_SECRET="c0005d10aabe8cf7c6de381513e0ec8a4c0e7e92e0653f847f02d4a2d230d152"
TIMESTAMP=$(date +%s)

SIGN=$(echo -en "GET\n/api/v4/wallet/total_balance\n$TIMESTAMP\n" | \
  openssl dgst -sha512 -hmac "$API_SECRET" | cut -d " " -f2)

curl -v --socks5-hostname 127.0.0.1:9050 https://api.gate.io/api/v4/wallet/total_balance \
  -H "KEY: $API_KEY" \
  -H "Timestamp: $TIMESTAMP" \
  -H "SIGN: $SIGN" \
  -H "Content-Type: application/json"
