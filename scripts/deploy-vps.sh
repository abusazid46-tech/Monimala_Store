#!/usr/bin/env bash
# ==============================================================================
# Monimala Store - Hostinger VPS Automated Setup & Deployment Script
# Target OS: Ubuntu 22.04 / 24.04 LTS (Hostinger KVM VPS)
# ==============================================================================

set -e

echo "========================================================="
echo "   Monimala Store - Hostinger VPS Deployment Script     "
echo "========================================================="

# 1. Update and Upgrade System
echo "[1/7] Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw unzip software-properties-common nginx

# 2. Install Node.js 20 LTS & PM2
echo "[2/7] Installing Node.js 20 LTS and PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
pm2 startup systemd -u $USER --hp /home/$USER || true

# 3. Install PHP 8.2 + PHP-FPM & Extensions for admin-php
echo "[3/7] Installing PHP 8.2 and required extensions..."
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-curl php8.2-xml php8.2-zip php8.2-gd

# 4. Install MySQL 8 Server
echo "[4/7] Installing MySQL 8 Server..."
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# 5. Build and Prepare Next.js Application
echo "[5/7] Building Next.js application..."
if [ -f "package.json" ]; then
    npm ci
    npm run build
    node scripts/prepare-hostinger.mjs
fi

# 6. PM2 Process Launch
echo "[6/7] Starting application with PM2..."
cd .next/standalone || cd .
pm2 delete monimala-store || true
pm2 start start-hostinger.js --name monimala-store --env production
pm2 save

# 7. Configure Firewall
echo "[7/7] Configuring UFW firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "========================================================="
echo " Hostinger VPS Setup Completed Successfully!           "
echo " Next steps:                                             "
echo " 1. Setup your domain in /etc/nginx/sites-available/     "
echo " 2. Run 'sudo certbot --nginx' to provision free SSL.    "
echo " 3. Import prisma/full_install.sql into MySQL.          "
echo "========================================================="
