import express from "express";
import cors from "cors";
import fetchSheetData from "./src/fetchSheetData";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173"; // Change for your frontend

// Enable CORS for frontend access
app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        methods: ["GET"],
        allowedHeaders: ["Content-Type"],
    })
);

// Test route to check if the server is running
app.get("/", (req, res) => {
    res.send("✅ Server is running! Use /games to get rankings.");
});

// Fetch game rankings from Google Sheets
app.get("/games", async (req, res) => {
    try {
        console.log("🔹 Fetching game rankings...");
        const data = await fetchSheetData();
        res.json(data);
    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Failed to fetch game data" });
    }
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
