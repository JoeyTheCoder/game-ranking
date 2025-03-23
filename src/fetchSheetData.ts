import { google } from "googleapis";
import authenticate from "./authGoogle";

const SHEET_ID = "1uOusljyQQXZJ-3EqjjOomSB8N8XS-8gd0jnA-Ht73xE";
const SHEET_NAME = "Ranking!A1:Z1000"; // Ensure this is correct

async function fetchSheetData() {
    console.log("🔹 Starting data fetch...");

    try {
        console.log("🔹 Authenticating with Google API...");
        const auth = await authenticate();

        // Create a sheets API instance with the auth client
        console.log("✅ Authentication successful, creating Sheets API instance...");
        // Use type assertion to tell TypeScript that auth is a valid auth client
        const sheets = google.sheets({ 
            version: "v4", 
            auth: auth as any // Type assertion to bypass type checking
        });

        console.log(`🔹 Fetching data from Google Sheets: ${SHEET_NAME}`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: SHEET_NAME,
        });

        console.log("✅ API Response Received:", response.data);

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            console.log("⚠️ No data found or empty response.");
            return [];
        }

        // Convert rows into structured JSON
        const headers = rows[0];
        const jsonData = rows.slice(1).map((row) =>
            headers.reduce((acc, header, index) => {
                acc[header] = row[index] || "";
                return acc;
            }, {} as Record<string, string>)
        );

        console.log("✅ Data fetched successfully:", jsonData.length, "entries.");
        return jsonData;
    } catch (error) {
        console.error("❌ Error fetching data:", error);
        throw error;
    }
}

export default fetchSheetData;
