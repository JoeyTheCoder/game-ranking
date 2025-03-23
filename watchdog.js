const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');

const API_URL = 'http://localhost:3014';  // Update if your port is different

async function checkHealth() {
  try {
    console.log('🔍 Running health check...');
    const response = await axios.get(`${API_URL}/auth-health`);
    
    if (response.data.status === 'ok') {
      console.log('✅ Health check passed');
      console.log(`🔹 Auth type: ${response.data.authType}`);
      if (response.data.expiresIn !== 'n/a') {
        console.log(`🔹 Token expires in: ${response.data.expiresIn} seconds`);
      }
    } else {
      throw new Error('Health check returned unexpected response');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('🔄 Restarting server...');
    
    exec('pm2 restart game-backend', (error) => {
      if (error) {
        console.error('Failed to restart server:', error);
      } else {
        console.log('✅ Server restart initiated');
      }
    });
  }
}

// Check every hour
setInterval(checkHealth, 60 * 60 * 1000);
console.log('🚀 Watchdog started - will check health every hour');
checkHealth(); 