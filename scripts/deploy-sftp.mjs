import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const conn = new Client();
const remoteRoot = "/home/u967105144/domains/lightskyblue-swan-841286.hostingersite.com/public_html";

conn.on("ready", () => {
  console.log("Connected to Hostinger SSH!");
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error("SFTP error:", err);
      conn.end();
      return;
    }
    
    console.log("SFTP subsystem opened successfully.");
    
    const uploadFile = (localPath, remotePath) => {
      return new Promise((resolve, reject) => {
        console.log(`Uploading ${localPath} -> ${remotePath}...`);
        sftp.fastPut(localPath, remotePath, (putErr) => {
          if (putErr) {
            console.error(`Failed to fastPut ${localPath}:`, putErr);
            // fallback to streaming
            const readStream = fs.createReadStream(localPath);
            const writeStream = sftp.createWriteStream(remotePath);
            writeStream.on("close", () => {
              console.log(`Streamed ${localPath} successfully.`);
              resolve();
            });
            writeStream.on("error", reject);
            readStream.pipe(writeStream);
          } else {
            console.log(`Uploaded ${localPath} successfully.`);
            resolve();
          }
        });
      });
    };

    const filesToUpload = [
      {
        local: path.resolve("admin-php/public/index.php"),
        remote: `${remoteRoot}/index.php`
      },
      {
        local: path.resolve("admin-php/public/assets/admin.css"),
        remote: `${remoteRoot}/assets/admin.css`
      }
    ];

    (async () => {
      for (const item of filesToUpload) {
        await uploadFile(item.local, item.remote);
      }
      
      console.log("All files transferred! Verifying with php -l on remote server...");
      conn.exec(`php -l ${remoteRoot}/index.php && ls -la ${remoteRoot}/index.php ${remoteRoot}/assets/admin.css`, (execErr, stream) => {
        if (execErr) throw execErr;
        let out = "";
        stream.on("close", (code) => {
          console.log("Remote verification exit code:", code);
          console.log(out);
          conn.end();
        }).on("data", (d) => { out += d.toString(); })
          .stderr.on("data", (d) => { console.error("REMOTE STDERR:", d.toString()); });
      });
    })().catch((e) => {
      console.error("Upload workflow failed:", e);
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
