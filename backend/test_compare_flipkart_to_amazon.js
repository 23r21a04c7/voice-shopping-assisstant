const priceController = require('./controllers/priceController');

const req = {
    body: {
        url: 'https://www.flipkart.com/yonex-mavis-350-nylon-shuttle-yellow/p/itm699f6270a0491'
    }
};

const res = {
    json: (data) => console.log('Final Result:', JSON.stringify(data, null, 2)),
    status: (code) => ({
        json: (data) => console.log(`Error ${code}:`, data)
    })
};

priceController.comparePrice(req, res).catch(console.error);
