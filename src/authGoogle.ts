import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";

// Load environment variables from `.env`
dotenv.config();

// File paths
const TOKEN_PATH = path.join(process.cwd(), "token.json");

// OAuth2 client setup from environment variables
const oAuth2Client = (() => {
    try {
        // Get credentials from environment variables
        const client_id = process.env.GOOGLE_CLIENT_ID;
        const client_secret = process.env.GOOGLE_CLIENT_SECRET;
        const redirect_uri = process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob";
        
        if (!client_id || !client_secret) {
            throw new Error("Missing required environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
        }
        
        return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    } catch (error) {
        console.error("❌ Error creating OAuth2 client:", error);
        throw new Error("Failed to create OAuth2 client. Check your environment variables.");
    }
})();

/**
 * Main authentication function that handles token refresh and initial auth
 */
export default async function authenticate() {
    console.log("🔹 Authentication process starting...");
    
    try {
        // Check if we have a token already
        if (fs.existsSync(TOKEN_PATH)) {
            console.log("🔹 Loading saved token...");
            const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
            oAuth2Client.setCredentials(token);
            
            // Check if token needs refresh (if it expires within 10 minutes)
            const tokenExpiryDate = oAuth2Client.credentials.expiry_date;
            const TEN_MINUTES = 10 * 60 * 1000;
            
            if (tokenExpiryDate && Date.now() + TEN_MINUTES >= tokenExpiryDate) {
                console.log("🔄 Token expiring soon, refreshing...");
                await refreshAccessToken();
            } else {
                console.log("✅ Token is valid");
            }
        } else {
            console.log("🔹 No token found, starting new authentication flow...");
            await getNewToken();
        }
        
        return oAuth2Client;
    } catch (error: unknown) {
        console.error("❌ Authentication error:", error);
        // If refresh token is invalid, start a new auth flow
        if (error instanceof Error && error.message?.includes("invalid_grant")) {
            console.log("🔄 Invalid refresh token, starting new authentication...");
            return getNewToken();
        }
        throw error;
    }
}

/**
 * Get a new OAuth2 token by prompting the user
 */
async function getNewToken() {
    console.log("🔹 Generating Google authentication URL...");
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        prompt: "consent" // Force prompt to ensure we get a refresh token
    });

    console.log("🔹 Open this URL in your browser and authenticate:", authUrl);

    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("🔹 Enter the code from that page here: ", async (code) => {
            rl.close();
            try {
                console.log("🔹 Received code:", code);
                const { tokens } = await oAuth2Client.getToken(code);
                
                if (!tokens.refresh_token) {
                    throw new Error("❌ No refresh token received. Ensure 'prompt: consent' is set.");
                }
                
                // Save token and set credentials
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                console.log(`✅ Token saved to ${TOKEN_PATH}`);
                oAuth2Client.setCredentials(tokens);
                resolve(oAuth2Client);
            } catch (error) {
                console.error("❌ Error getting access token:", error);
                reject(error);
            }
        });
    });
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken() {
    try {
        console.log("🔄 Refreshing access token...");
        const { credentials } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(credentials);
        
        // Save the updated token
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
        console.log("✅ Token refreshed and saved");
        return oAuth2Client;
    } catch (error) {
        console.error("❌ Error refreshing access token:", error);
        throw error;
    }
}

// Register token update handler
oAuth2Client.on("tokens", (tokens) => {
    console.log("🔹 Token event received");
    if (tokens.refresh_token) {
        console.log("🔹 New refresh token received, updating stored token");
        
        // Read existing tokens and merge
        const existingTokens = fs.existsSync(TOKEN_PATH) 
            ? JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")) 
            : {};
            
        const updatedTokens = { ...existingTokens, ...tokens };
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
    }
});

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
