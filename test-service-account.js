const { google } = require('googleapis');
const fs = require('fs');

const SHEET_ID = "1uOusljyQQXZJ-3EqjjOomSB8N8XS-8gd0jnA-Ht73xE";
const SERVICE_ACCOUNT_PATH = "./service-account-key.json";

async function testServiceAccount() {
  try {
    console.log("Testing service account authentication...");
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    console.log("Fetching spreadsheet info...");
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });
    
    console.log("Success! Spreadsheet title:", response.data.properties.title);
    return true;
  } catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes("permission")) {
      console.error("This is likely a permission issue. Make sure you shared the spreadsheet with the service account email address.");
    }
    return false;
  }
}

testServiceAccount(); 