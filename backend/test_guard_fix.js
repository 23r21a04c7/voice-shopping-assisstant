const { tokenize, universalBrandGuard } = require('./controllers/priceController');

async function testBrandGuard() {
    const source = "MOTOROLA g35 5G (Guava Red, 128 GB) (4 GB RAM)";
    const target = "Jockey Men's Cotton Innerwear";
    
    console.log(`Source: ${source}`);
    console.log(`Target: ${target}`);
    
    const result = universalBrandGuard(source, target);
    console.log(`Brand Guard Result: ${result}`);
    
    if (result === false) {
        console.log("SUCCESS: Brand Guard correctly rejected the mismatch.");
    } else {
        console.log("FAILURE: Brand Guard incorrectly allowed the mismatch.");
    }
}

testBrandGuard().catch(console.error);
