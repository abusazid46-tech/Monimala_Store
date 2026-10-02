# Monimala Store — Production Deployment on Hostinger

This guide covers complete, step-by-step deployment of the **Monimala Store** platform on Hostinger hosting infrastructure.

---

## 🏛️ Architecture Overview

| Component | Technology | Hostinger Deployment Target |
| :--- | :--- | :--- |
| **Storefront & App Admin** | Next.js 15 (Node.js 20 LTS) | Hostinger Node.js Application Manager (or Hostinger VPS) |
| **Admin & Inventory Backend** | PHP 8.2+ Standalone | Hostinger Subdomain (e.g. `admin.yourdomain.com` -> `admin-php/public`) |
| **Database** | MySQL 8.0+ | Hostinger Managed MySQL via hPanel & phpMyAdmin |
| **Payments** | Razorpay Gateway | Webhook endpoint at `/api/razorpay/webhook` |
| **Transactional Mail** | Hostinger SMTP | `smtp.hostinger.com` (Port 465 SSL) |

---

## 📦 Ready-to-Use Deployment Artifacts

The repository includes pre-built deployment assets:

1. **`prisma/full_install.sql`**: Complete database schema and initial seed data (default admin, categories, initial catalog, and `BIHU10` coupon) ready for 1-click import into Hostinger phpMyAdmin.
2. **`prisma/schema.sql`**: Clean DDL schema without seed data.
3. **`prisma/seed.sql`**: Seed data only.
4. **`hostinger-deploy.zip`**: Compressed standalone Node.js server bundle with all static assets and public media pre-packaged.
5. **`scripts/prepare-hostinger.mjs`**: Script to recompile and package standalone files (`npm run build:hostinger`).
6. **`scripts/deploy-vps.sh`**: 1-click automated setup script for Hostinger VPS (Ubuntu).
7. **`.htaccess`**: LiteSpeed/Apache web server reverse proxy rules.

---

## 🚀 Step 1: Database Setup in Hostinger hPanel

1. Log in to **Hostinger hPanel** (`https://hpanel.hostinger.com`).
2. Go to **Databases** -> **Management** -> **Create a New MySQL Database and Database User**:
   - **Database Name**: e.g., `u123456789_monimala`
   - **Username**: e.g., `u123456789_admin`
   - **Password**: Generate a strong password (minimum 16 characters).
   - Click **Create**.
3. Under the created database, click **Enter phpMyAdmin**.
4. Inside phpMyAdmin:
   - Select your database from the left sidebar.
   - Click the **Import** tab at the top.
   - Click **Choose File** and select `prisma/full_install.sql` from this repository.
   - Click **Go** / **Import**.
5. All 10 tables will be instantly created and seeded!
   - Default Admin Login: `admin@monimalastore.com` / `Admin@12345`.
   - *Tip: You can change this password immediately in `/admin` after login.*

---

## 🌐 Step 2: Deploy Next.js Storefront on Hostinger

### Option A: Via Hostinger Node.js Application Manager (Business & Cloud Web Hosting)

1. In hPanel, go to **Advanced** -> **Node.js** (or search "Node.js" in hPanel search bar).
2. Click **Create Application**:
   - **Node.js Version**: Select `20.x` (or `22.x`).
   - **Application Mode**: `Production`.
   - **Application Root**: `public_html` (or `domains/yourdomain.com/public_html`).
   - **Application URL**: Select your primary domain (e.g. `yourdomain.com`).
   - **Application Startup File**: `start-hostinger.js` (or `server.js`).
3. Upload files:
   - In hPanel, open **File Manager**.
   - Navigate to your application root folder (`public_html`).
   - Upload `hostinger-deploy.zip` and click **Extract**.
   - Ensure the extracted files (`server.js`, `start-hostinger.js`, `package.json`, `.htaccess`, `.next/`, `public/`, `node_modules/`) are directly in the application root.
4. Set Environment Variables:
   - In the Node.js application settings or by creating a `.env` file in `public_html`:
     ```env
     NODE_ENV=production
     DATABASE_URL=mysql://u123456789_admin:YOUR_DB_PASSWORD@127.0.0.1:3306/u123456789_monimala
     JWT_SECRET=GENERATE_A_MINIMUM_32_BYTE_RANDOM_SECRET
     NEXT_PUBLIC_SITE_URL=https://yourdomain.com
     NEXT_PUBLIC_WHATSAPP_NUMBER=919282713731
     NEXT_PUBLIC_FACEBOOK_URL=https://www.facebook.com/share/1Dk9XwxTnw/
     NEXT_PUBLIC_YOUTUBE_URL=https://www.youtube.com/@Monimala-AssameseJewellery
     NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/monimalastore?stkn=MW8xa2l4OHp4bWN2dA==
     RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
     RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
     RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
     ADMIN_PANEL_URL=https://admin.yourdomain.com
     SMTP_HOST=smtp.hostinger.com
     SMTP_PORT=465
     SMTP_SECURE=true
     SMTP_USER=no-reply@yourdomain.com
     SMTP_PASSWORD=YOUR_EMAIL_PASSWORD
     MAIL_FROM=Monimala Store <no-reply@yourdomain.com>
     ```
5. Click **Run NPM Install** (if prompted) or click **Restart Application**.
6. Visit `https://yourdomain.com` — your store is live!

---

### Option B: Via Hostinger VPS (Ubuntu)

If using a Hostinger KVM VPS:

1. Connect to your VPS via SSH:
   ```bash
   ssh root@YOUR_VPS_IP
   ```
2. Clone your repository:
   ```bash
   git clone https://github.com/abusazid46-tech/Monimala_Store.git /var/www/monimala
   cd /var/www/monimala
   ```
3. Run the automated VPS setup script:
   ```bash
   chmod +x scripts/deploy-vps.sh
   ./scripts/deploy-vps.sh
   ```
4. Configure your `.env` file with production credentials.
5. Setup Nginx reverse proxy to port `3000` and run `certbot --nginx` for free SSL.

---

## 🛠️ Step 3: Deploy Standalone PHP Admin (`admin-php/`)

For the PHP administration and warehouse inventory backend:

1. In hPanel, go to **Domains** -> **Subdomains**.
2. Create a subdomain, e.g., `admin.yourdomain.com` (or `backend.yourdomain.com`).
   - Set **Custom folder for subdomain**: `public_html/admin-php/public` (or upload `admin-php` into the subdomain's directory).
3. In File Manager:
   - Upload the `admin-php` folder to your hosting.
   - Point the subdomain's document root specifically to `admin-php/public`.
   - Copy `admin-php/.env.example` to `admin-php/.env` and update:
     ```env
     APP_ENV=production
     APP_URL=https://admin.yourdomain.com
     APP_BASE_PATH=
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=u123456789_monimala
     DB_USERNAME=u123456789_admin
     DB_PASSWORD=YOUR_DB_PASSWORD
     SESSION_SECURE=true
     ```
   - Note: Keeping `src/` and `.env` outside or protected by `.htaccess` ensures database credentials remain secure.
4. Visit `https://admin.yourdomain.com` — log in with `admin@monimalastore.com` / `Admin@12345`.

---

## 💳 Step 4: Razorpay Webhook Configuration

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings** -> **Webhooks** -> **Add New Webhook**.
3. **Webhook URL**: `https://yourdomain.com/api/razorpay/webhook`
4. **Secret**: Enter the exact secret string you put in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**: Check `payment.captured`.
6. Save Webhook.

---

## 🔒 Step 5: Post-Deployment Verification Checklist

- [ ] **SSL / HTTPS**: Verify that the SSL lock displays on `https://yourdomain.com` and `https://admin.yourdomain.com` (enable free SSL in Hostinger hPanel -> Security -> SSL).
- [ ] **Admin Login**: Log in to `/admin` on Next.js and change the default password.
- [ ] **Catalog Display**: Confirm products, images, and category filters render properly.
- [ ] **Cart & Checkout**: Test adding a product to cart and initiating checkout.
- [ ] **Inventory Movement**: Perform a test stock adjustment in `/admin/inventory` and verify it logs to `InventoryMovement`.
- [ ] **Automated Backups**: Enable Daily Backups in Hostinger hPanel (**Files** -> **Backups**).
