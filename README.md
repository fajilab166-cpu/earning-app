# Earning App — Telegram Mini App

Starter implementation for a Telegram bot + Mini App using Monetag, AdsGram, Supabase and Vercel.

## Included in this first phase
- Telegram webhook with /start and /help, protected by Telegram webhook secret.
- Telegram Mini App initData HMAC validation on the server.
- Supabase user records and wallet balance.
- Monetag rewarded-interstitial SDK loader and server-side postback endpoint.
- Idempotent Monetag reward crediting through a PostgreSQL RPC function.
- Daily ad limit and cooldown checks.
- AdsGram Reward/Interstitial SDK loader and ad display integration.

## Important reward security
- Monetag wallet credits are issued only after a valid server-side valued postback, not from a browser callback. Duplicate postbacks cannot credit the same ymid twice.
- AdsGram's documented SDK returns a client-side done result. This starter displays AdsGram ads but deliberately does not add cash to the wallet from that browser result because a client request can be forged. Do not enable cash rewards until a trusted provider-verifiable server-side completion mechanism is available and tested for your publisher account.

## Deploy
1. Create a Supabase project and run supabase/schema.sql in SQL Editor.
2. Import this repository into Vercel.
3. Add all values from .env.example as Vercel Environment Variables. Keep service-role keys and bot tokens server-only.
4. The provided Monetag SDK URL and Zone ID are prefilled in .env.example. Confirm these values in your publisher dashboard before production.
5. Set WEBAPP_URL to your deployed HTTPS origin.
6. Set Telegram webhook: https://api.telegram.org/botTOKEN/setWebhook?url=https://YOUR_DOMAIN/api/webhook&secret_token=YOUR_TELEGRAM_WEBHOOK_SECRET. URL-encode values as needed.
7. In Monetag SSP, set the postback URL to: https://YOUR_DOMAIN/api/monetag-postback?secret=YOUR_MONETAG_POSTBACK_SECRET&ymid={ymid}&event_type={event_type}&reward_event_type={reward_event_type}&zone_id={zone_id}&estimated_price={estimated_price}
8. Get AdsGram's Reward block ID from your publisher account and set ADSGRAM_BLOCK_ID.
9. Set your bot's Main Mini App URL to the deployed HTTPS URL in BotFather.

## Environment
See .env.example. Never commit real tokens, keys, or secrets.

## Not yet implemented
Referral commissions, user-facing withdrawal requests, admin dashboard, task approval, payment processing, and complete audit/reporting flows are not part of this first phase. The current wallet should be treated as a development starter, not a production-ready earning/payment service. Set reward amount, daily limit, cooldown and minimum withdrawal only after confirming actual ad revenue, publisher terms and payout budget.
