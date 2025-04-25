// ReferralCandy API Status Checker
const axios = require('axios');
const crypto = require('crypto');

// ReferralCandy API Configuration - Replace with your actual credentials
const REFERRALCANDY_API_CONFIG = {
    accessID: 'jvfk4dkwamr9t537e0l62bbvh',
    secretKey: '3c2565b1d63a6893b4e295c324a005b3',
    baseURL: 'https://my.referralcandy.com/api/v1',
};

async function checkReferralCandyStatus() {
    try {
        console.log('Checking ReferralCandy API status...');
        
        const timestamp = Math.floor(Date.now() / 1000);

        const params = {
            accessID: REFERRALCANDY_API_CONFIG.accessID,
            timestamp: timestamp
        };

        const stringToSign = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        const signature = crypto
            .createHmac('sha1', REFERRALCANDY_API_CONFIG.secretKey)
            .update(stringToSign)
            .digest('hex');

        params.signature = signature;

        console.log('Making API request with params:', params);

        // ✅ Correct endpoint: Show campaign details
        const response = await axios.get(
            `${REFERRALCANDY_API_CONFIG.baseURL}/campaigns/show.json`,
            { params }
        );

        console.log('\n===== API STATUS =====');
        console.log('Status Code:', response.status);
        console.log('\n===== API RESPONSE =====');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n✅ API is working correctly!');

        return true;

    } catch (error) {
        console.log('\n===== ERROR =====');
        console.log('Status Code:', error.response?.status);
        console.log('Error Message:', error.message);

        if (error.response) {
            console.log('\n===== ERROR DETAILS =====');
            console.log('Response Data:', error.response.data);
            console.log('Response Headers:', error.response.headers);
        }

        console.log('\n===== TROUBLESHOOTING STEPS =====');
        console.log('1. Verify Access ID and Secret Key');
        console.log('2. Ensure correct API endpoint');
        console.log('3. Confirm timestamp and signature formatting');
        console.log('4. If issue persists, contact ReferralCandy support');

        return false;
    }
}

checkReferralCandyStatus().then((isWorking) => {
    if (!isWorking) {
        console.log('\nStatus check failed. See error details above.');
    }
});
