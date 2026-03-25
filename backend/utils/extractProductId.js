module.exports = function (url) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }

    // Amazon URL patterns: /dp/{productId}
    const amazonMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    if (amazonMatch) {
        return { platform: 'amazon', id: amazonMatch[1] };
    }

    // Flipkart URL patterns:
    // Pattern 1: /product-name/p/itm{productId}
    // Pattern 2: /{product-name}/p/{productId}
    // Pattern 3: /p/{productId}
    const flipkartMatch = url.match(/\/p\/(?:itm)?([a-zA-Z0-9]+)(?:\?|$)/);
    if (flipkartMatch && url.includes('flipkart.com')) {
        return { platform: 'flipkart', id: flipkartMatch[1] };
    }

    // Myntra URL patterns:
    // Pattern 1: /{product-name}/buy?pid={productId}
    // Pattern 2: /{productId}/{product-name}
    const myntraMatch = url.match(/(?:pid=|myntra\.com\/)(\d+)/);
    if (myntraMatch && url.includes('myntra.com')) {
        return { platform: 'myntra', id: myntraMatch[1] };
    }

    // Ajio URL patterns:
    // Pattern 1: /p/{productId}
    // Pattern 2: /{product-name}/p/{productId}
    const ajioMatch = url.match(/\/p\/([a-zA-Z0-9-]+)(?:\?|$)/);
    if (ajioMatch && url.includes('ajio.com')) {
        return { platform: 'ajio', id: ajioMatch[1] };
    }

    throw new Error('Unsupported URL format. Please provide a valid Amazon, Flipkart, Myntra, or Ajio product URL.');
};