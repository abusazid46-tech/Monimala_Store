import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const publicDir = path.join(rootDir, "public");
const staticDir = path.join(rootDir, ".next", "static");

console.log("=== Preparing Hostinger Standalone Deployment Package ===");

if (!fs.existsSync(standaloneDir)) {
  console.error("Error: .next/standalone does not exist. Please run 'next build' first.");
  process.exit(1);
}

// 1. Copy public/ folder to .next/standalone/public
if (fs.existsSync(publicDir)) {
  const destPublic = path.join(standaloneDir, "public");
  console.log(`Copying public assets -> ${destPublic}`);
  fs.cpSync(publicDir, destPublic, { recursive: true, force: true });
}

// 2. Copy .next/static folder to .next/standalone/.next/static
if (fs.existsSync(staticDir)) {
  const destStatic = path.join(standaloneDir, ".next", "static");
  console.log(`Copying compiled static chunks -> ${destStatic}`);
  fs.cpSync(staticDir, destStatic, { recursive: true, force: true });
}

// 3. Ensure prisma schema is available for runtime if needed
const prismaDir = path.join(rootDir, "prisma");
if (fs.existsSync(prismaDir)) {
  const destPrisma = path.join(standaloneDir, "prisma");
  if (!fs.existsSync(destPrisma)) {
    fs.mkdirSync(destPrisma, { recursive: true });
  }
  fs.copyFileSync(
    path.join(prismaDir, "schema.prisma"),
    path.join(destPrisma, "schema.prisma")
  );
  console.log("Copied prisma/schema.prisma to standalone");
}

// 4. Create sample .env for Hostinger
const envExample = path.join(rootDir, ".env.example");
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(standaloneDir, ".env.example"));
}

// 5. Generate .htaccess for Hostinger LiteSpeed / Apache Node.js reverse proxy
const htaccessContent = `# Hostinger LiteSpeed / Apache Configuration for Next.js
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve static files and public assets directly if they exist
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Route all other traffic to Node.js application port (default 3000)
  # Replace 3000 with your assigned Hostinger Node port if custom
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
`;

fs.writeFileSync(path.join(standaloneDir, ".htaccess"), htaccessContent, "utf8");
console.log("Generated .htaccess in standalone directory");

// 6. Create start-hostinger.js entry point to gracefully handle PORT and HOSTNAME
const startScript = `// Hostinger Node.js Entry Wrapper
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

console.log(\`[Monimala Store] Starting standalone server on \${process.env.HOSTNAME}:\${process.env.PORT}...\`);
require('./server.js');
`;
fs.writeFileSync(path.join(standaloneDir, "start-hostinger.js"), startScript, "utf8");
console.log("Generated start-hostinger.js wrapper");

console.log("\n Successfully packaged Next.js standalone app for Hostinger!");
console.log(`Directory ready for upload: ${standaloneDir}`);
