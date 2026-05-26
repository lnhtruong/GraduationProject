#!/usr/bin/env bash
# Integration tests for forgot-password rate-limit + OTP lockout + mail rate-limit.
# Targets locally running api_gateway (8000), auth_service (8001), mail_service (3009),
# Redis on 6379, MySQL on 3306. Requires a non-Google account that exists in DB.
#
# Run: bash test_forgot_password_limits.sh

set -uo pipefail

GW="${GW:-http://localhost:8000}"
MAIL="${MAIL:-http://localhost:3009}"
EMAIL="${EMAIL:-testa@graduation.test}"
REDIS_CLI="${REDIS_CLI:-redis-cli}"

pass() { printf "  \033[32mPASS\033[0m  %s\n" "$1"; }
fail() { printf "  \033[31mFAIL\033[0m  %s\n" "$1"; FAILED=1; }
section() { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }

reset_redis_keys() {
  # Best-effort cleanup; no error if redis-cli is missing.
  if command -v "$REDIS_CLI" >/dev/null 2>&1; then
    "$REDIS_CLI" --no-raw DEL "RATE_LIMIT:FORGOT_PASSWORD:IP:::ffff:127.0.0.1" >/dev/null
    "$REDIS_CLI" --no-raw DEL "RATE_LIMIT:FORGOT_PASSWORD:IP:127.0.0.1" >/dev/null
    "$REDIS_CLI" --no-raw DEL "RATE_LIMIT:MAIL_OTP:$EMAIL" >/dev/null
    "$REDIS_CLI" --no-raw DEL "OTP_FAIL:$EMAIL" >/dev/null
    "$REDIS_CLI" --no-raw DEL "OTP_LOCK:$EMAIL" >/dev/null
    "$REDIS_CLI" --no-raw DEL "MAIL_OTP:$EMAIL" >/dev/null
  else
    printf "  (redis-cli not installed; tests may be polluted by prior keys)\n"
  fi
}

FAILED=0

section "T1: per-IP rate limit on /api/auth/forgot-password (5 / 15min)"
reset_redis_keys
for i in 1 2 3 4 5; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$GW/api/auth/forgot-password" \
    -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")
  if [[ "$status" =~ ^(200|400)$ ]]; then
    pass "request $i → $status (allowed)"
  else
    fail "request $i → $status (expected 200/400)"
  fi
done
# 6th must be 429 with body shape + Retry-After header.
resp=$(curl -s -D /tmp/headers6.txt -o /tmp/body6.json -w "%{http_code}" \
  -X POST "$GW/api/auth/forgot-password" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")
if [[ "$resp" == "429" ]]; then
  pass "request 6 → 429"
else
  fail "request 6 → $resp (expected 429)"
fi
if grep -qi "^retry-after:" /tmp/headers6.txt; then
  pass "Retry-After header present ($(grep -i '^retry-after:' /tmp/headers6.txt | tr -d '\r'))"
else
  fail "Retry-After header missing"
fi
if grep -q '"message":"Too many requests"' /tmp/body6.json && grep -q '"retryAfter"' /tmp/body6.json; then
  pass "body shape { success:false, message:'Too many requests', retryAfter:N }"
else
  fail "body shape unexpected: $(cat /tmp/body6.json)"
fi

section "T2: per-email lockout on /api/auth/check-otp (5 wrong OTPs → 30min lock)"
reset_redis_keys
# Seed a valid OTP we will never send; we want all 5 attempts to be wrong.
if command -v "$REDIS_CLI" >/dev/null 2>&1; then
  "$REDIS_CLI" SET "MAIL_OTP:$EMAIL" 999999 EX 300 >/dev/null
fi
for i in 1 2 3 4; do
  status=$(curl -s -o /tmp/body_cot.json -w "%{http_code}" -X POST "$GW/api/auth/check-otp" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"otp\":\"000000\",\"newPassword\":\"newpassword\"}")
  if [[ "$status" == "400" ]]; then
    pass "wrong OTP attempt $i → 400"
  else
    fail "wrong OTP attempt $i → $status (expected 400). body: $(cat /tmp/body_cot.json)"
  fi
done
# 5th wrong attempt: trigger lockout, expect 423.
status=$(curl -s -o /tmp/body_lock.json -w "%{http_code}" -X POST "$GW/api/auth/check-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"otp\":\"000000\",\"newPassword\":\"newpassword\"}")
if [[ "$status" == "423" ]]; then
  pass "5th wrong OTP → 423 (lockout fired)"
else
  fail "5th wrong OTP → $status (expected 423). body: $(cat /tmp/body_lock.json)"
fi
if grep -q "Account locked" /tmp/body_lock.json; then
  pass "lockout body contains 'Account locked'"
else
  fail "lockout body unexpected: $(cat /tmp/body_lock.json)"
fi
# While locked, forgot-password for this email must 429.
reset_ip_only=1
if command -v "$REDIS_CLI" >/dev/null 2>&1; then
  # Clear only IP rate limit; keep the lock.
  "$REDIS_CLI" DEL "RATE_LIMIT:FORGOT_PASSWORD:IP:::ffff:127.0.0.1" >/dev/null
  "$REDIS_CLI" DEL "RATE_LIMIT:FORGOT_PASSWORD:IP:127.0.0.1" >/dev/null
fi
status=$(curl -s -o /tmp/body_fp_locked.json -w "%{http_code}" -X POST "$GW/api/auth/forgot-password" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")
if [[ "$status" == "429" ]]; then
  pass "forgot-password while locked → 429"
else
  fail "forgot-password while locked → $status (expected 429). body: $(cat /tmp/body_fp_locked.json)"
fi
if grep -q "Account temporarily locked" /tmp/body_fp_locked.json; then
  pass "forgot-password lock body contains 'Account temporarily locked'"
else
  fail "forgot-password lock body unexpected: $(cat /tmp/body_fp_locked.json)"
fi

section "T3: mail_service per-email rate limit on /mail/otp (3 / 5min)"
reset_redis_keys
for i in 1 2 3; do
  status=$(curl -s -o /tmp/body_mail.json -w "%{http_code}" -X POST "$MAIL/mail/otp" \
    -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")
  # Don't require 200 (SMTP may not be configured locally) — any non-429 means the
  # limiter let it through.
  if [[ "$status" != "429" ]]; then
    pass "request $i → $status (allowed by limiter)"
  else
    fail "request $i → 429 (limiter triggered too early)"
  fi
done
status=$(curl -s -D /tmp/headers_mail4.txt -o /tmp/body_mail4.json -w "%{http_code}" \
  -X POST "$MAIL/mail/otp" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}")
if [[ "$status" == "429" ]]; then
  pass "request 4 → 429"
else
  fail "request 4 → $status (expected 429). body: $(cat /tmp/body_mail4.json)"
fi
if grep -qi "^retry-after:" /tmp/headers_mail4.txt; then
  pass "Retry-After header present"
else
  fail "Retry-After header missing"
fi

reset_redis_keys

printf "\n"
if [[ "$FAILED" == "0" ]]; then
  printf "\033[32mALL TESTS PASSED\033[0m\n"
  exit 0
else
  printf "\033[31mSOME TESTS FAILED\033[0m\n"
  exit 1
fi
