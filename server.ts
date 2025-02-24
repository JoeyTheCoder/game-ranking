import express from "express";
import cors from "cors";
import fetchSheetData from "./src/fetchSheetData";

const app = express();
const PORT = 3000;

// Enable CORS for frontend access
app.use(cors());

// Add a test route to check if the server is running
app.get("/", (req, res) => {
    res.send("✅ Server is running! Use /games to get rankings.");
});

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

// Keep Express server running
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
