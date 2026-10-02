import { Client } from "ssh2";

const conn = new Client();
const remoteBase = "/home/u967105144/domains/lightskyblue-swan-841286.hostingersite.com/public_html";

conn.on("ready", () => {
  console.log("SSH Connection established successfully!");
  conn.exec(`ls -la ${remoteBase} && ls -la ${remoteBase}/assets`, (err, stream) => {
    if (err) throw err;
    let out = "";
    stream.on("close", (code) => {
      console.log("Exit code:", code);
      console.log(out);
      conn.end();
    }).on("data", (data) => {
      out += data.toString();
    }).stderr.on("data", (errData) => {
      console.error("STDERR:", errData.toString());
    });
  });
}).connect({
  host: "93.127.208.117",
  port: 65002,
  username: "u967105144",
  password: "Akjhlkl0-898pok[",
  readyTimeout: 30000
});
