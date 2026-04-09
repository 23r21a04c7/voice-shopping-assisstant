function tokenize(title) {
    if (!title) return [];
    const cleaned = title.toLowerCase().replace(/[-_,|/:()\[\]{}'"]/g, ' ');
    return cleaned.split(/\s+/).filter(w => w.length > 0);
}

function universalBrandGuard(sourceTitle, targetTitle) {
    if (!sourceTitle || !targetTitle) return true;
    const sTokens = tokenize(sourceTitle);
    const tTokens = tokenize(targetTitle);
    
    if (sTokens.length === 0 || tTokens.length === 0) return true;
    
    const fluff = ['buy', 'new', 'the', 'original', 'latest', 'online', 'genuine'];
    const sRelevant = sTokens.filter(t => !fluff.includes(t));
    const tRelevant = tTokens;
    
    if (sRelevant.length === 0) return true;
    
    const primaryBrand = sRelevant[0];
    const secondaryToken = sRelevant.length > 1 ? sRelevant[1] : null;

    const brandOk = tRelevant.includes(primaryBrand) || (secondaryToken && tRelevant.includes(secondaryToken));
    
    return brandOk;
}

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
