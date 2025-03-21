import express from "express";
import cors from "cors";
import fetchSheetData from "./src/fetchSheetData";
import authenticate from "./src/authGoogle";

const app = express();
const PORT = 3001;

// Enable CORS for frontend access
app.use(cors());

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

// Keep Express server running
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
