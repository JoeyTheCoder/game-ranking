import { google } from "googleapis";
import readline from "readline";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from `.env`
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:3000"; // Ensure this matches your Google Cloud Console settings

const __filename = import.meta.url.replace("file://", "");
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.resolve("token.json"); // Ensures it's saved in the project root

console.log("🔹 OAuth2 client being created...");
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function getAccessToken() {
    console.log("🔹 Generating Google authentication URL...");
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    console.log("🔹 Copy and paste this URL into your browser:");
    console.log(authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question("🔹 Enter the code from that page here: ", async (code) => {
            rl.close();
            try {
                console.log("🔹 Received code:", code);
                console.log("🔹 Requesting access token...");
                const { tokens } = await oAuth2Client.getToken(code);

                console.log("✅ Token received:", tokens);

                // SAVE TOKEN TO FILE
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                console.log(`✅ Token saved to ${TOKEN_PATH}`);

                resolve(tokens);
            } catch (error) {
                console.error("❌ Error getting access token:", error);
            }
        });
    });
}

async function authenticate() {
    console.log("🔹 Checking for existing token...");

    try {
        if (fs.existsSync(TOKEN_PATH)) {
            console.log(`🔹 Found token file at ${TOKEN_PATH}`);
            const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
            oAuth2Client.setCredentials(token);
            console.log("✅ Using existing token.");
            return oAuth2Client;
        } else {
            console.log("⚠️ No token found. Requesting a new one...");
            const newToken = await getAccessToken();
            oAuth2Client.setCredentials(newToken);
            console.log("✅ New token acquired.");
            return oAuth2Client;
        }
    } catch (error) {
        console.error("❌ Error reading token file:", error);
    }
}

// 🚀 Ensure the script runs when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    authenticate().then(() => {
        console.log("🔹 Authentication complete. You can now run your app.");
        process.exit(0);
    }).catch(error => {
        console.error("❌ Authentication failed:", error);
        process.exit(1);
    });
}

export default authenticate;

