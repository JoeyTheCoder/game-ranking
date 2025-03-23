import express from "express";
import cors from "cors";
import fetchSheetData from "./src/fetchSheetData";
import authenticate from "./src/authGoogle";
import { scheduleJob } from 'node-schedule';
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

const app = express();
const PORT = 3014;

// Enable CORS for frontend access
app.use(cors());

// Schedule regular token refresh (every 12 hours)
scheduleJob('0 */12 * * *', async () => {
  console.log('🔄 Scheduled token refresh');
  try {
    await authenticate();
    console.log('✅ Token refreshed successfully');
  } catch (error) {
    console.error('❌ Scheduled token refresh failed:', error);
  }
});

// Add a test route to check if the server is running
app.get("/", (req, res) => {
    res.send("✅ Server is running! Use /games to get rankings.");
});

// Add middleware to ensure fresh token for API calls
const ensureAuth = async (req, res, next) => {
    try {
        await authenticate(); // This will refresh if needed
        next();
    } catch (error) {
        console.error("❌ Authentication error in middleware:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
};

// Apply middleware to routes that need authentication
app.get("/games", ensureAuth, async (req, res) => {
    try {
        console.log("🔹 Fetching game rankings...");
        const data = await fetchSheetData();
        res.json(data);
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Failed to fetch game data" });
    }
});

// Add a health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Add this to your server.ts
app.get("/auth-status", async (req, res) => {
    try {
        const auth = await authenticate();
        res.json({
            authenticated: true,
            tokenExpiry: auth.credentials.expiry_date,
            expiresIn: Math.floor((auth.credentials.expiry_date - Date.now()) / 1000),
        });
    } catch (error) {
        res.status(500).json({
            authenticated: false,
            error: error.message
        });
    }
});

// Add a robust auth health check endpoint
app.get("/auth-health", async (req, res) => {
  try {
    const auth = await authenticate();
    
    // Test if token actually works by making a simple API call
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.get({ 
      spreadsheetId: "1uOusljyQQXZJ-3EqjjOomSB8N8XS-8gd0jnA-Ht73xE" 
    });
    
    // Get token expiry details if available (OAuth2 only)
    const expiryInfo = auth.credentials?.expiry_date ? {
      tokenExpiry: auth.credentials.expiry_date,
      expiresIn: Math.floor((auth.credentials.expiry_date - Date.now()) / 1000),
    } : { tokenExpiry: "n/a", expiresIn: "n/a" };
    
    res.json({
      status: "ok",
      authenticated: true,
      authType: useServiceAccount ? "service-account" : "oauth2",
      ...expiryInfo
    });
  } catch (error) {
    console.error("❌ Auth health check failed:", error);
    
    // Force re-authentication by removing token if using OAuth2
    if (!useServiceAccount && fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
      console.log("🗑️ Removed invalid token during health check");
    }
    
    res.status(500).json({
      status: "error",
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Keep Express server running
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
