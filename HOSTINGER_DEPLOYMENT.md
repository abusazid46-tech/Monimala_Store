# Monimala Store production deployment

## Architecture

- `store.example.com`: Next.js 15 Node.js application.
- `backend.monimal.com`: PHP 8.2+ admin and inventory backend, with document root set to `admin-php/public`.
- MySQL 8 is the only catalog, customer, order, payment and inventory source of truth.
- Razorpay talks only to the Node application at `/api/razorpay/webhook`.

Do not expose the MySQL user remotely. Create separate least-privilege users for Node and PHP, use long random passwords, and enable Hostinger backups before launch.

## Database

1. Create a MySQL database and users in hPanel.
2. Copy `.env.example` to `.env` locally and set the production `DATABASE_URL`.
3. Run `npx prisma migrate deploy` during deployment. Never use `prisma db push` in production.
4. Set `SEED_ADMIN_EMAIL` and a unique 16+ character `SEED_ADMIN_PASSWORD`, seed once, then remove those seed variables from the runtime environment.

Create and commit a migration from a development MySQL database before the first production deployment:

```text
npx prisma migrate dev --name production_mysql_baseline
```

## Node.js application

In Hostinger's Node.js panel set Node 20 LTS or newer, the application root to this repository, and these commands:

```text
Install: npm ci
Build: npm run build
Start: npm run start
```

Add every variable from `.env.example` in hPanel. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS URL. Configure the Razorpay webhook to `https://store.example.com/api/razorpay/webhook` and subscribe to `payment.captured`.

## PHP admin

Upload `admin-php`, copy `admin-php/.env.example` to `admin-php/.env`, and point `backend.monimal.com` to `admin-php/public`. Keep `APP_BASE_PATH` empty because the admin runs at the subdomain root. The `.env` and `src` directory must remain outside the public document root. PHP requires `pdo_mysql`, `openssl`, `mbstring`, `fileinfo`, and sessions.

The admin uses secure, HTTP-only, SameSite=Strict sessions; CSRF tokens; prepared PDO statements; role checks; hierarchical category/subcategory creation; product creation; transactional inventory adjustments; non-negative-stock enforcement; and an inventory movement ledger.

## Launch gates

- Replace all demo contact/social values and all placeholder product photography.
- Change the seeded admin password and remove it from public documentation.
- Test successful, failed, duplicated, and delayed Razorpay webhooks in test mode.
- Add a scheduled job to expire unpaid inventory reservations and return their stock.
- Configure transactional email/SMS, shipping provider, tax invoices, returns and privacy/terms pages.
- Enable daily database backups, uptime monitoring, error reporting, rate limiting/WAF, and an incident contact.
