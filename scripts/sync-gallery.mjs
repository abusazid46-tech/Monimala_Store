import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const conn = new Client();
const remoteDir = "/home/u967105144/domains/lightskyblue-swan-841286.hostingersite.com/public_html/uploads/products";
const localDir = path.resolve("public/uploads/products");

if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

conn.on("ready", () => {
  console.log("Connected to Hostinger SSH for gallery sync...");
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.readdir(remoteDir, async (readErr, list) => {
      if (readErr) throw readErr;
      const imageFiles = list.filter((item) => /\.(jpe?g|png|webp|gif)$/i.test(item.filename));
      console.log(`Found ${imageFiles.length} gallery images on Hostinger.`);
      for (const item of imageFiles) {
        const dest = path.join(localDir, item.filename);
        if (!fs.existsSync(dest)) {
          await new Promise((resolve) => {
            sftp.fastGet(`${remoteDir}/${item.filename}`, dest, (getErr) => {
              if (getErr) console.error(`Error getting ${item.filename}:`, getErr);
              else console.log(`Downloaded: ${item.filename}`);
              resolve();
            });
          });
        }
      }
      console.log("Local gallery synchronization complete!");
      conn.end();
    });
  });
}).connect({
  host: "93.127.208.117",
  port: 65002,
  username: "u967105144",
  password: "Akjhlkl0-898pok[",
  readyTimeout: 30000
});
