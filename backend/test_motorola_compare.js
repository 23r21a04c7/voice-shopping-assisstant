const priceController = require('./controllers/priceController');

// Motorola G35 5G (Guava Red, 128 GB) (4 GB RAM)
const req = {
    body: {
        url: 'https://www.flipkart.com/motorola-g35-5g-guava-red-128-gb/p/itm60f38b907471d'
    }
};

const res = {
    json: (data) => {
        console.log('\n--- FINAL RESULTS ---');
        console.log(JSON.stringify(data, null, 2));
    },
    status: (code) => ({
        json: (data) => console.log(`Error ${code}:`, data)
    })
};

console.log("Testing Motorola G35 Comparison (Flipkart -> Amazon)...");
priceController.comparePrice(req, res).catch(console.error);
