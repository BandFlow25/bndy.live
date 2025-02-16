const express = require("express");
const next = require("next");
const https = require("https");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
};

app.prepare().then(() => {
  const server = express();

  // Handle all requests with Next.js
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Start HTTPS server on port 3000
  https.createServer(httpsOptions, server).listen(3000, (err) => {
    if (err) throw err;
    console.log("🚀 Server running on **https://localhost:3000**");
  });
});
