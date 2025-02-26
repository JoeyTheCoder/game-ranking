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

const TOKEN_PATH = path.resolve("token.json"); // Ensures it's saved in the project root

console.log("🔹 OAuth2 client being created...");
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

/**
 * Request a new access token from Google API by prompting user.
 */
async function getAccessToken() {
    console.log("🔹 Generating Google authentication URL...");
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        prompt: "consent", // Ensures refresh token is generated
    });

    console.log("🔹 Open this URL in your browser and authenticate:", authUrl);

    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("🔹 Enter the code from that page here: ", async (code) => {
            rl.close();
            try {
                console.log("🔹 Received code:", code);
                const tokenResponse = await oAuth2Client.getToken(code);
                const tokens = tokenResponse.tokens;

                if (!tokens.refresh_token) {
                    throw new Error("❌ No refresh token received. Ensure you are using 'access_type: offline' in your OAuth2 settings.");
                }

                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                console.log(`✅ Token saved to ${TOKEN_PATH}`);

                oAuth2Client.setCredentials(tokens);
                resolve(oAuth2Client);
            } catch (error) {
                console.error("❌ Error getting access token:", error);
            }
        });
    });
}

/**
 * Refresh the access token using the stored refresh token.
 */
async function refreshAccessToken() {
    try {
        console.log("🔄 Refreshing access token...");

        const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
        if (!tokenData.refresh_token) {
            throw new Error("❌ No refresh token available. Please reauthenticate.");
        }

        oAuth2Client.setCredentials(tokenData);
        const refreshedTokenResponse = await oAuth2Client.refreshAccessToken();
        const refreshedTokens = refreshedTokenResponse.credentials;

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(refreshedTokens, null, 2));
        console.log("✅ Token refreshed and saved.");

        oAuth2Client.setCredentials(refreshedTokens);
        return oAuth2Client;
    } catch (error) {
        console.error("❌ Error refreshing token:", error);
        throw error;
    }
}

/**
 * Authenticate the user by checking existing token or generating a new one.
 */
async function authenticate() {
    console.log("🔹 Checking for existing token...");

    try {
        if (fs.existsSync(TOKEN_PATH)) {
            console.log(`🔹 Found token file at ${TOKEN_PATH}`);
            const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

            if (!tokenData.access_token) {
                console.log("⚠️ No access token found, requesting a new one...");
                return await getAccessToken();
            }

            oAuth2Client.setCredentials(tokenData);

            // Check if access token is expired
            if (Date.now() >= tokenData.expiry_date) {
                console.log("⚠️ Access token expired. Refreshing...");
                return await refreshAccessToken();
            }

            console.log("✅ Using existing valid token.");
            return oAuth2Client;
        } else {
            console.log("⚠️ No token found. Requesting a new one...");
            return await getAccessToken();
        }
    } catch (error) {
        console.error("❌ Error reading token file:", error);
    }
}

// 🚀 Ensure the script runs when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    authenticate()
        .then(() => {
            console.log("🔹 Authentication complete. You can now run your app.");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Authentication failed:", error);
            process.exit(1);
        });
}

export default authenticate;
