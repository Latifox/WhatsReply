const { Client, LocalAuth, MessageMedia, Buttons } = require('./index');

// Client configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        defaultViewport: null,
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
        timeout: 60000,
        protocolTimeout: 60000
    },
    clientId: 'auto-responder',
    webVersionCache: { type: 'local' }
});

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Start client
const startClient = async () => {
    try {
        console.log('Starting client initialization...');
        await client.initialize();
        console.log('Client initialization completed');
    } catch (err) {
        console.error('Failed to initialize client:', err);
        console.log('Restarting in 5 seconds...');
        await delay(5000);
        startClient();
    }
};

startClient();

// Events
client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    console.log('\n=============================');
    console.log('SCAN THIS QR CODE TO LOG IN:');
    console.log('=============================\n');
    console.log(qr);
});

client.on('authenticated', () => {
    console.log('✅ AUTHENTICATED - Login successful');
});

client.on('auth_failure', msg => {
    console.error('❌ AUTHENTICATION FAILURE:', msg);
});

client.on('ready', () => {
    console.log('✅ READY - Auto-responder bot is active!');
});

// Main message handling
client.on('message', async msg => {
    try {
        console.log(`MESSAGE RECEIVED: "${msg.body.substring(0, 30)}${msg.body.length > 30 ? '...' : ''}" from ${msg.from}`);

        if (msg.fromMe) {
            console.log('Message is from me, ignoring.');
            return;
        }

        await delay(500);

        const senderNumber = msg.from.split('@')[0];
        const encodedNumber = Buffer.from(senderNumber).toString('base64');
        console.log(`Processing sender: ${senderNumber} (encoded: ${encodedNumber})`);

        const caption = `مرحباً،

هذا هو رابط الإحالة الخاص بك 👇
🔗 https://mooressence.shop/products/serum?ref=${encodedNumber}

🎥 شاركي الفيديو اللي تحت فـ WhatsApp Story ديالك.

الواتساب Story هو أسهل طريقة باش تحققي مبيعات أولية بسرعة.

📲 من بعد، شاركيه فـ Instagram، Facebook، أو أي بلاصة تفضليها.

✍ ماتنسايش تحطي الرابط ديالك فـ وصف الـ Story باش الناس يقدرو يشريو مباشرة.

💰 كل عملية شراء من خلال الرابط = تربحي 20 درهم.
كل منتج تجميلي يتباع عن طريقك = دخل إضافي مضمون.

📦 غادي نتواصلو معك مباشرة منين توصلنا أي طلبية من رابطك.

شكراً لمشاركتك، وبالتوفيق!`;

        const videoPath = './video.mp4';
        console.log('Preparing to send video as document...');

        const media = await MessageMedia.fromFilePath(videoPath);

        // Send video as document
        await client.sendMessage(msg.from, media, {
            caption: caption,
            sendMediaAsDocument: true,
            mimetype: 'video/mp4'
        });

        console.log('✅ Video document sent successfully to:', senderNumber);

        console.log('✅ Message processing completed for:', senderNumber);

    } catch (err) {
        console.error('❌ Error handling message:', err);
    }
});

// Handle disconnection
client.on('disconnected', async (reason) => {
    console.error('❌ Disconnected:', reason);
    console.log('Reconnecting in 5 seconds...');
    try {
        await client.destroy();
        console.log('Client destroyed successfully');
    } catch (err) {
        console.error('Error during destroy:', err);
    }
    await delay(5000);
    startClient();
});

// Global error handling
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    try {
        await client.destroy();
        console.log('Client destroyed successfully');
    } catch (err) {
        console.error('Error during shutdown:', err);
    }
    process.exit(0);
});

console.log('🚀 Auto-responder bot starting up...');
