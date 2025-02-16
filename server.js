const express = require("express");
const next = require("next");
const fs = require("fs");
const https = require("https");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;

// Only enable HTTPS in development if SSL certificates exist
const useHttps = dev && fs.existsSync(path.join(__dirname, "localhost-key.pem")) && fs.existsSync(path.join(__dirname, "localhost.pem"));

app.prepare().then(() => {
    const server = express();

    // Serve Next.js pages and API routes
    server.all("*", (req, res) => {
        return handle(req, res);
    });

    if (useHttps) {
        const options = {
            key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
            cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
        };

        https.createServer(options, server).listen(PORT, () => {
            console.log(`🔒 HTTPS Server running at https://localhost:${PORT}`);
        });
    } else {
        server.listen(PORT, () => {
            console.log(`🌍 Server running at http://localhost:${PORT}`);
        });
    }
});
