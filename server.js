const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();

if (process.env.NODE_ENV !== "production") {
    // Only use HTTPS locally
    const https = require("https");
    const options = {
        key: fs.readFileSync(path.join(__dirname, "localhost-key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "localhost.pem")),
    };

    https.createServer(options, app).listen(3000, () => {
        console.log("Server running on https://localhost:3000");
    });
} else {
    // Production uses Vercel’s built-in HTTPS
    app.listen(3000, () => {
        console.log("Server running on standard port 3000 (Vercel handles HTTPS)");
    });
}
