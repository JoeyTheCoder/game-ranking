import axios from "axios";

const SHEET_ID = "1aBcDefGhIjKLmnopQrstUvWxYZ"; // Replace with your Sheet ID
const API_KEY = "YOUR_GOOGLE_SHEETS_API_KEY"; // Replace with your API Key
const SHEET_NAME = "Sheet1"; // Change if you renamed your sheet

export const fetchSheetData = async () => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const rows = response.data.values;

    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) =>
      headers.reduce((acc, header, index) => {
        acc[header] = row[index] || "";
        return acc;
      }, {} as Record<string, string>)
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
};
