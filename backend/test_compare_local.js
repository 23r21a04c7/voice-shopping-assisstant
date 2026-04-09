const priceController = require('./controllers/priceController');

// Mock req, res
const req = {
    body: {
        url: 'https://www.amazon.in/Yonex-Mavis-Nylon-Shuttlecocks-Yellow/dp/B00E96VOW6'
    }
};

const res = {
    json: (data) => console.log('Final Result:', JSON.stringify(data, null, 2)),
    status: (code) => ({
        json: (data) => console.log(`Error ${code}:`, data)
    })
};

priceController.comparePrice(req, res).catch(console.error);
