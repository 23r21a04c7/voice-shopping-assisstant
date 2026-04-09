const axios = require('axios');

async function testCompare() {
    try {
        console.log('Sending request to /api/compare-price...');
        
        // Amazon URL for Yonex Mavis 350
        const testUrl = 'https://www.amazon.in/Yonex-Mavis-Nylon-Shuttlecocks-Yellow/dp/B00E96VOW6';
        
        const response = await axios.post('http://localhost:3000/api/compare-price', {
            url: testUrl
        });

        console.log('\n--- RESPONSE STATUS ---');
        console.log(response.status);
        
        console.log('\n--- RESPONSE DATA ---');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testCompare();
