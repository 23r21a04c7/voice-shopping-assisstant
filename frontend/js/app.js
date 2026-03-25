// API Configuration
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const micButton = document.getElementById('micButton');
const micIcon = document.getElementById('micIcon');
const statusText = document.getElementById('status');
const transcriptBox = document.getElementById('transcriptBox');
const transcriptText = document.getElementById('transcript');
const productUrlInput = document.getElementById('productUrl');
const trackBtn = document.getElementById('trackBtn');
const loadingState = document.getElementById('loadingState');
const priceDisplay = document.getElementById('priceDisplay');
const errorMessage = document.getElementById('errorMessage');
const chartContainer = document.getElementById('chartContainer');
const searchHistory = document.getElementById('searchHistory');
const historyList = document.getElementById('historyList');

// State
let recognition = null;
let isListening = false;
let priceChart = null;

// Platform URLs
const PLATFORMS = {
    amazon: 'https://www.amazon.in/s?k=',
    flipkart: 'https://www.flipkart.com/search?q=',
    myntra: 'https://www.myntra.com/',
    ajio: 'https://www.ajio.com/search/?text='
};

// Initialize Speech Recognition
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Speech recognition is not supported in this browser. Please use Chrome.');
        micButton.disabled = true;
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('animate-pulse', 'bg-red-600');
        micButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        statusText.textContent = 'Listening... Speak now!';
        statusText.classList.add('text-red-600');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMsg = 'Error: ';
        switch (event.error) {
            case 'not-allowed':
                errorMsg += 'Microphone access denied. Please allow microphone access.';
                break;
            case 'no-speech':
                errorMsg += 'No speech detected. Please try again.';
                break;
            case 'network':
                errorMsg += 'Network error. Please check your connection.';
                break;
            default:
                errorMsg += event.error;
        }
        statusText.textContent = errorMsg;
        resetMicButton();
    };

    recognition.onend = () => {
        resetMicButton();
    };

    return true;
}

// Reset microphone button state
function resetMicButton() {
    isListening = false;
    micButton.classList.remove('animate-pulse', 'bg-red-600');
    micButton.classList.add('bg-purple-600', 'hover:bg-purple-700');
    statusText.classList.remove('text-red-600');
    if (statusText.textContent.includes('Listening')) {
        statusText.textContent = 'Click the microphone to start';
    }
}

// Handle microphone button click
micButton.addEventListener('click', () => {
    if (!recognition) {
        showError('Speech recognition not initialized');
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        transcriptBox.classList.add('hidden');
        recognition.start();
    }
});

// Handle voice command
function handleVoiceCommand(transcript) {
    console.log('Transcript:', transcript);

    // Display transcript
    transcriptText.textContent = transcript;
    transcriptBox.classList.remove('hidden');
    statusText.textContent = 'Processing your request...';

    // Parse the command
    const lowerTranscript = transcript.toLowerCase();
    let product = '';
    let platform = '';

    // Detect platform
    if (lowerTranscript.includes('amazon')) {
        platform = 'amazon';
        product = lowerTranscript.split(/in amazon|on amazon/)[0].trim();
    } else if (lowerTranscript.includes('flipkart')) {
        platform = 'flipkart';
        product = lowerTranscript.split(/in flipkart|on flipkart/)[0].trim();
    } else if (lowerTranscript.includes('myntra')) {
        platform = 'myntra';
        product = lowerTranscript.split(/in myntra|on myntra/)[0].trim();
    } else if (lowerTranscript.includes('ajio')) {
        platform = 'ajio';
        product = lowerTranscript.split(/in ajio|on ajio/)[0].trim();
    } else {
        // No platform specified, use the entire transcript as product
        product = lowerTranscript;
    }

    // Clean up product name
    product = product.replace(/search for|find|show me|i want|buy/gi, '').trim();

    if (product) {
        if (platform) {
            // Open specific platform
            openPlatform(platform, product);
            addToSearchHistory(product, platform, transcript);
            statusText.textContent = `Opening ${platform} with "${product}"`;
        } else {
            // Show all platforms
            showAllPlatforms(product, transcript);
            statusText.textContent = `Showing results for "${product}"`;
        }
    } else {
        statusText.textContent = 'Could not understand the product name. Please try again.';
    }
}

// Open platform with search
function openPlatform(platform, product) {
    const searchQuery = encodeURIComponent(product);
    const url = PLATFORMS[platform] + searchQuery;
    window.open(url, '_blank');
}

// Show all platforms
function showAllPlatforms(product, originalTranscript) {
    addToSearchHistory(product, 'all', originalTranscript);
}

// Add to search history
function addToSearchHistory(product, platform, originalTranscript) {
    searchHistory.classList.remove('hidden');

    const historyItem = document.createElement('div');
    historyItem.className = 'bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200';

    if (platform === 'all') {
        // Show all platform options
        historyItem.innerHTML = `
            <div class="mb-4">
                <p class="text-sm text-gray-600 mb-1">You searched for:</p>
                <p class="text-xl font-semibold text-gray-800">"${originalTranscript}"</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                ${Object.keys(PLATFORMS).map(p => `
                    <button 
                        onclick="window.open('${PLATFORMS[p]}${encodeURIComponent(product)}', '_blank')"
                        class="px-4 py-3 bg-white rounded-lg hover:bg-purple-100 transition-colors font-medium text-gray-700 capitalize shadow-sm hover:shadow-md"
                    >
                        🛍️ ${p}
                    </button>
                `).join('')}
            </div>
        `;
    } else {
        // Show single platform result
        const platformEmoji = {
            amazon: '📦',
            flipkart: '🛒',
            myntra: '👗',
            ajio: '👔'
        };

        historyItem.innerHTML = `
            <div class="mb-3">
                <p class="text-sm text-gray-600 mb-1">You searched for:</p>
                <p class="text-xl font-semibold text-gray-800">"${originalTranscript}"</p>
            </div>
            <button 
                onclick="window.open('${PLATFORMS[platform]}${encodeURIComponent(product)}', '_blank')"
                class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg capitalize"
            >
                ${platformEmoji[platform]} Open in ${platform}
            </button>
        `;
    }

    historyList.insertBefore(historyItem, historyList.firstChild);
}

// Price Tracking
trackBtn.addEventListener('click', async () => {
    const url = productUrlInput.value.trim();

    if (!url) {
        showError('Please enter a product URL');
        return;
    }

    if (!url.includes('amazon.in') && !url.includes('flipkart.com') && !url.includes('myntra.com') && !url.includes('ajio.com')) {
        showError('Please provide a valid Amazon, Flipkart, Myntra, or Ajio URL');
        return;
    }

    await trackPrice(url);
});

// Track price function
async function trackPrice(url) {
    try {
        // Show loading state
        loadingState.classList.remove('hidden');
        priceDisplay.classList.add('hidden');
        errorMessage.classList.add('hidden');
        chartContainer.classList.add('hidden');

        // Make API request
        const response = await fetch(`${API_URL}/track-price`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch price data');
        }

        if (result.success && result.data) {
            displayPriceData(result.data);
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Error tracking price:', error);
        showError(error.message || 'Failed to track price. Please try again.');
    } finally {
        loadingState.classList.add('hidden');
    }
}

// Display price data
function displayPriceData(data) {
    // Update product info
    document.getElementById('productTitle').textContent = data.title || 'Product';
    document.getElementById('productPlatform').textContent = data.platform || 'Unknown';
    document.getElementById('productAvailability').textContent = data.availability || 'Check availability';

    // Update prices
    document.getElementById('currentPrice').textContent = `₹${formatPrice(data.currentPrice)}`;
    document.getElementById('lowestPrice').textContent = `₹${formatPrice(data.lowestPrice || data.currentPrice)}`;

    // Show price display
    priceDisplay.classList.remove('hidden');

    // Display chart if price history exists
    if (data.priceHistory && data.priceHistory.length > 0) {
        displayPriceChart(data.priceHistory);
    }
}

// Display price chart
function displayPriceChart(priceHistory) {
    chartContainer.classList.remove('hidden');

    const ctx = document.getElementById('priceChart').getContext('2d');

    // Destroy existing chart if it exists
    if (priceChart) {
        priceChart.destroy();
    }

    // Prepare data
    const labels = priceHistory.map(item => item.date);
    const prices = priceHistory.map(item => item.price);

    // Create chart
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price (₹)',
                data: prices,
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(147, 51, 234)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function (context) {
                            return 'Price: ₹' + formatPrice(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return '₹' + formatPrice(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Format price with commas
function formatPrice(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Show error message
function showError(message) {
    errorMessage.classList.remove('hidden');
    errorMessage.querySelector('p').textContent = message;

    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Voice Shopping Assistant initialized');

    // Initialize speech recognition
    if (initSpeechRecognition()) {
        console.log('Speech recognition ready');
    }

    // Check backend connection
    checkBackendConnection();
});

// Check backend connection
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend connected');
        } else {
            console.warn('⚠️ Backend responded with error');
        }
    } catch (error) {
        console.error('❌ Backend server not running. Please start the backend server.');
        showError('Backend server not running. Price tracking will not work.');
    }
}

// Allow Enter key to submit URL
productUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        trackBtn.click();
    }
});
