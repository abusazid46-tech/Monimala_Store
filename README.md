# Monimala Store

Premium mobile-first eCommerce website for an Assamese traditional jewellery brand.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Shadcn-style local UI primitives with Radix
- Framer Motion
- Prisma + SQLite development database
- JWT cookie authentication
- Razorpay order and webhook API routes
- PWA manifest and service worker

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

The seed creates an administrator only when `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` are explicitly configured. No public default password is used.

## Environment

Set these before production deployment:

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="use-a-long-random-secret"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_WHATSAPP_NUMBER="91XXXXXXXXXX"
RAZORPAY_KEY_ID="rzp_live_xxxxx"
RAZORPAY_KEY_SECRET="xxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxx"
SEED_ADMIN_NAME="Store Owner"
SEED_ADMIN_EMAIL="owner@your-domain.com"
SEED_ADMIN_PASSWORD="use-a-unique-16-plus-character-password"
```

## Deployment

1. Replace SQLite with a production database provider in `prisma/schema.prisma`.
2. Configure production environment variables on Vercel or your host.
3. Run `npm run db:generate` and apply migrations.
4. Add Razorpay webhook URL: `/api/razorpay/webhook`.
5. Deploy with `npm run build`.

## Included Commerce Surface

- Homepage sections requested in the brief
- Product listing with search and filters
- Wishlist and cart state
- Product page with image gallery, zoom, reviews, related products and WhatsApp inquiry
- Authentication APIs
- Order creation and tracking API
- Razorpay order creation and signed webhook verification
- Admin dashboard for products, categories, orders, customers, coupons, analytics, inventory and banners
- Product and store structured data for SEO
- PWA manifest and service worker
