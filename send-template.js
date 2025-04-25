const { Client, Buttons, LocalAuth } = require('./index');

// Initialize the WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: false, // Set to true if you don't want to see the browser window
    }
});

// Initialize client
client.initialize();

// Handle QR code for authentication
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    // You can add code here to display or save the QR code if needed
});

// Handle successful authentication
client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

// Handle authentication failures
client.on('auth_failure', (msg) => {
    console.error('AUTHENTICATION FAILURE', msg);
});

// When client is ready, send the template message
client.on('ready', async () => {
    console.log('READY');
    
    try {
        // Get your own number (will send message to yourself)
        const info = client.info;
        const myNumber = info.wid.user;
        const chatId = `${myNumber}@c.us`;
        
        // Create a template-like message using Buttons
        const button = new Buttons(
            'Hello World', 
            [
                { body: 'Reply' },
                { body: 'Share' },
                { body: 'More Info' }
            ], 
            'Template Message', 
            'Sent using whatsapp-web.js'
        );
        
        // Send the template message
        await client.sendMessage(chatId, button);
        console.log('Template message sent successfully');
        
        // You can uncomment the following line to close the client after sending the message
        // await client.destroy();
    } catch (error) {
        console.error('Failed to send template message:', error);
    }
});

// Handle disconnection
client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
    process.exit(0);
}); 