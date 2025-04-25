const { Client, LocalAuth } = require('./index');
const axios = require('axios'); // You'll need to install axios: npm install axios

// ReferralCandy API Configuration
const REFERRALCANDY_API_CONFIG = {
    accessID: 'jvfk4dkwamr9t537e0l62bbvh', // Replace with your ReferralCandy Access ID
    secretKey: '3c2565b1d63a6893b4e295c324a005b3', // Replace with your ReferralCandy Secret Key
    baseURL: 'https://my.referralcandy.com/api/v1',
};

// Create a more robust client configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: false,
        defaultViewport: null, // Use the default viewport of the browser
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-running-insecure-content',
            '--disable-notifications'
        ],
        // Increase timeouts to give more time for operations
        timeout: 60000,
        protocolTimeout: 60000
    },
    clientId: 'auto-responder', // Add a unique client ID
    webVersionCache: {
        type: 'local'
    }
});

// Add delay function for controlled waiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to get or create a referral link for a customer
async function getReferralLink(phoneNumber) {
    try {
        // Create a timestamp for the request
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Customer data
        const customerData = {
            email: `${phoneNumber}@whatsapp.referral.example`, // Using phone as unique email
            first_name: `Customer_${phoneNumber}`,
            last_name: 'WhatsApp',
            referral_code: `WA${phoneNumber}`, // Custom referral code prefix with phone number
        };
        
        // Prepare the request parameters
        const params = {
            accessID: REFERRALCANDY_API_CONFIG.accessID,
            timestamp: timestamp,
            first_name: customerData.first_name,
            last_name: customerData.last_name,
            email: customerData.email,
            referral_code: customerData.referral_code,
        };
        
        // Calculate signature (as per ReferralCandy documentation)
        const crypto = require('crypto');
        const stringToSign = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');
        
        const signature = crypto
            .createHmac('sha1', REFERRALCANDY_API_CONFIG.secretKey)
            .update(stringToSign)
            .digest('hex');
        
        // Add signature to params
        params.signature = signature;
        
        // Make API request to create/get referral link
        const response = await axios.post(
            `${REFERRALCANDY_API_CONFIG.baseURL}/referral.json`, 
            null, 
            { params }
        );
        
        console.log('ReferralCandy API Response:', response.data);
        
        if (response.data && response.data.referral && response.data.referral.referral_link) {
            return response.data.referral.referral_link;
        } else {
            throw new Error('Failed to get referral link from API response');
        }
    } catch (error) {
        console.error('Error getting referral link:', error.message);
        // Fallback to a static format if the API call fails
        return `https://mooressence.shop/${phoneNumber}`;
    }
}

// Initialize the client with a more robust approach
const startClient = async () => {
    try {
        // Initialize client
        console.log('Starting client initialization...');
        await client.initialize();
        console.log('Client initialization completed');
    } catch (err) {
        console.error('Failed to initialize client:', err);
        console.log('Attempting to restart in 5 seconds...');
        
        // Wait before trying to restart
        await delay(5000);
        
        // Try to restart
        startClient();
    }
};

// Start the client
startClient();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', async (qr) => {
    console.log('\n=============================');
    console.log('SCAN THIS QR CODE TO LOG IN:');
    console.log('=============================\n');
    console.log(qr);
    console.log('\nScan the QR code with your phone to authenticate');
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED - Login successful');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE:', msg);
});

client.on('ready', () => {
    console.log('✅ READY - The auto-respond bot is active and waiting for messages!');
});

// Auto-respond to incoming messages
client.on('message', async msg => {
    try {
        // Log message without dumping the entire object
        console.log(`MESSAGE RECEIVED: "${msg.body.substring(0, 30)}${msg.body.length > 30 ? '...' : ''}" from ${msg.from}`);

        // Avoid responding to your own messages or creating a loop
        if (msg.fromMe) {
            console.log('Message is from me, ignoring');
            return;
        }

        // Add small delay to ensure stability before processing
        await delay(500);

        // Get sender's phone number
        const senderNumber = msg.from.split('@')[0];
        console.log(`Processing message from sender: ${senderNumber}`);

        // Get referral link from ReferralCandy API
        console.log('Generating referral link for sender...');
        const referralLink = await getReferralLink(senderNumber);
        console.log(`Referral link generated: ${referralLink}`);

        // Template message with referral link containing sender's number
        const autoReplyMessage = `مرحبا 💖
ها هو رابط الإحالة ديالك 👇

${referralLink}

شاركي هاد الفيديو ك Story مع صحاباتك فـ WhatsApp، Instagram، ولا أي بلاصة بغيتي 📲

وديري الرابط ديالك في description 

وأي وحدة تشري من الرابط ديالك، كتربحي معاها 50 درهم 💸💸

كل منتج تجميلي يتباع عن طريقك = 50 درهم فجيبك!

انتواصلوا معاك بمجرد مايدوز ال commande

بالتوفيق 😍`;

        console.log('Sending auto-reply...');
        
        // Send the auto-reply message with retry logic
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                await client.sendMessage(msg.from, autoReplyMessage);
                console.log('✅ Auto-reply sent successfully to:', senderNumber);
                break;
            } catch (error) {
                attempts++;
                console.error(`Failed to send message (attempt ${attempts}/${maxAttempts}):`, error.message);
                
                if (attempts >= maxAttempts) {
                    console.error('Max attempts reached, giving up on this message');
                } else {
                    console.log('Retrying in 2 seconds...');
                    await delay(2000);
                }
            }
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

client.on('disconnected', async (reason) => {
    console.log('Client was disconnected:', reason);
    console.log('Attempting to reconnect in 5 seconds...');
    
    // Clean up
    try {
        await client.destroy();
        console.log('Client destroyed successfully');
    } catch (err) {
        console.error('Error destroying client:', err);
    }
    
    // Wait before trying to restart
    await delay(5000);
    
    // Try to restart
    startClient();
});

// Handle errors globally
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled rejection at:', promise, 'reason:', reason);
});

// Handle termination signals
process.on('SIGINT', async () => {
    console.log('Received SIGINT, cleaning up...');
    try {
        await client.destroy();
        console.log('Client destroyed successfully');
    } catch (err) {
        console.error('Error destroying client:', err);
    }
    process.exit(0);
});

console.log('Auto-respond bot starting up...');