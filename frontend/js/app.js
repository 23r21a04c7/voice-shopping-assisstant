// API Configuration
const API_URL = 'https://voice-shopping-assisstant-backend.onrender.com/api';

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

// Auth DOM Elements
const authSection = document.getElementById('authSection');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const regNameFields = document.getElementById('regNameFields');
const regFirstName = document.getElementById('regFirstName');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const toggleAuthBtn = document.getElementById('toggleAuthBtn');
const toggleAuthText = document.getElementById('toggleAuthText');
const authErrorMessage = document.getElementById('authErrorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const homeBtn = document.getElementById('homeBtn');
const mainHeader = document.getElementById('mainHeader');
const mainContent = document.getElementById('mainContent');

// Auth State
let isLoginView = true;
let currentUser = null;

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
        micButton.classList.add('listening');
        statusText.textContent = 'Listening... Speak now!';
        statusText.classList.add('text-red-400');
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
    micButton.classList.remove('listening');
    statusText.classList.remove('text-red-400');
    if (statusText.textContent.includes('Listening')) {
        statusText.textContent = 'Tap to speak';
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

// Feature Selection Tab Logic
const tabVoice = document.getElementById('tabVoice');
const tabTracker = document.getElementById('tabTracker');
const tabShopSmart = document.getElementById('tabShopSmart');
const voiceSection = document.getElementById('voiceSection');
const trackerSection = document.getElementById('trackerSection');
const shopsmartSection = document.getElementById('shopsmartSection');
const welcomeSection = document.getElementById('welcomeSection');
const tabLiveView = document.getElementById('tabLiveView');
const liveViewSection = document.getElementById('liveViewSection');

function resetTabs() {
    [tabVoice, tabTracker, tabShopSmart, tabLiveView].forEach(tab => {
        if (!tab) return;
        tab.classList.remove('border-purple-500', 'border-blue-500', 'border-orange-500', 'border-emerald-500', 'bg-white/5');
        tab.classList.add('border-transparent', 'hover:border-white/20');
    });
    [voiceSection, trackerSection, shopsmartSection, liveViewSection].forEach(section => {
        if (section) section.classList.add('hidden');
    });
    if (welcomeSection) {
        welcomeSection.classList.add('hidden');
    }
}

function showHome() {
    resetTabs();
    welcomeSection.classList.remove('hidden');
    homeBtn.classList.add('hidden');
}

if (homeBtn) {
    homeBtn.addEventListener('click', showHome);
}

if (tabVoice && tabTracker && tabShopSmart) {
    tabVoice.addEventListener('click', () => {
        resetTabs();
        tabVoice.classList.add('border-purple-500', 'bg-white/5');
        tabVoice.classList.remove('border-transparent', 'hover:border-white/20');
        voiceSection.classList.remove('hidden');
        homeBtn.classList.remove('hidden');
    });

    tabTracker.addEventListener('click', () => {
        resetTabs();
        tabTracker.classList.add('border-blue-500', 'bg-white/5');
        tabTracker.classList.remove('border-transparent', 'hover:border-white/20');
        trackerSection.classList.remove('hidden');
        homeBtn.classList.remove('hidden');
    });

    tabShopSmart.addEventListener('click', () => {
        resetTabs();
        tabShopSmart.classList.add('border-orange-500', 'bg-white/5');
        tabShopSmart.classList.remove('border-transparent', 'hover:border-white/20');
        shopsmartSection.classList.remove('hidden');
        homeBtn.classList.remove('hidden');
    });

    if (tabLiveView) {
        tabLiveView.addEventListener('click', () => {
            resetTabs();
            tabLiveView.classList.add('border-emerald-500', 'bg-white/5');
            tabLiveView.classList.remove('border-transparent', 'hover:border-white/20');
            liveViewSection.classList.remove('hidden');
            homeBtn.classList.remove('hidden');
        });
    }
}

// ShopSmart API Logic
const shopsmartUrlInput = document.getElementById('shopsmartUrl');
const compareBtn = document.getElementById('compareBtn');
const shopsmartLoading = document.getElementById('shopsmartLoading');
const shopsmartResults = document.getElementById('shopsmartResults');
const ssErrorMessage = document.getElementById('ssErrorMessage');
const ssCardsContainer = document.getElementById('ssCardsContainer');
const ssProductTitle = document.getElementById('ssProductTitle');

if (compareBtn) {
    compareBtn.addEventListener('click', async () => {
        const url = shopsmartUrlInput.value.trim();
        if (!url) {
            showSsError('Please paste a product URL first.');
            return;
        }

        // Reset UI
        ssErrorMessage.classList.add('hidden');
        shopsmartResults.classList.add('hidden');
        shopsmartLoading.classList.remove('hidden');
        compareBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/compare-price`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to compare prices');
            }

            displayComparison(result.data);
        } catch (error) {
            showSsError(error.message);
        } finally {
            shopsmartLoading.classList.add('hidden');
            compareBtn.disabled = false;
        }
    });

    shopsmartUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') compareBtn.click();
    });
}

function showSsError(message) {
    if (!ssErrorMessage) return;
    ssErrorMessage.querySelector('span').textContent = message;
    ssErrorMessage.classList.remove('hidden');
    shopsmartResults.classList.add('hidden');
}

function displayComparison(data) {
    if (!data || !data.results) return;
    ssProductTitle.textContent = data.title;

    // Find the min price among available products (ensure numeric comparison)
    const availableResults = data.results.filter(r => r.price !== null && r.price > 0 && r.url);
    const prices = availableResults.map(r => Number(r.price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    // Generate cards
    ssCardsContainer.innerHTML = data.results.map(platformConfig => {
        const priceValue = platformConfig.price !== null ? Number(platformConfig.price) : 0;
        const isAvailable = priceValue > 0 && platformConfig.url;

        if (!isAvailable) {
            // Compact, dimmed card for unavailable platforms
            return '<div class="relative rounded-2xl p-4 border border-white/5 bg-white/5 opacity-40 flex flex-col justify-center items-center shadow-inner scale-95">' +
                '<p class="text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-bold">' + platformConfig.platform + '</p>' +
                '<p class="text-xs font-semibold text-slate-500">Not Available</p>' +
                '<div class="mt-2 text-[8px] text-slate-600 italic">No exact match found</div>' +
                '</div>';
        }

        const isLowest = priceValue === minPrice && minPrice > 0;
        const isHigher = priceValue > minPrice && minPrice > 0;

        const colorBorder = isLowest ? 'border-green-500/50 scale-[1.05] shadow-[0_0_20px_rgba(34,197,94,0.2)]' : (isHigher ? 'border-red-500/20' : 'border-white/10');
        const colorBg = isLowest ? 'bg-green-500/10' : (isHigher ? 'bg-red-500/5' : 'bg-white/5');

        // Premium Badges
        let badgeHTML = '';
        if (isLowest) {
            badgeHTML = '<span class="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-black text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-tighter z-20 animate-pulse">Cheapest</span>';
        } else if (isHigher) {
            const diff = priceValue - minPrice;
            badgeHTML = '<span class="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-tighter z-20">+ ₹' + diff.toLocaleString('en-IN') + '</span>';
        }

        const targetUrl = platformConfig.url;

        return '<a href="' + targetUrl + '" target="_blank" class="glass-panel p-6 min-h-[140px] border ' + colorBorder + ' ' + colorBg + ' flex flex-col justify-between transition-all duration-400 group relative hover:scale-[1.08] hover:z-20">' +
            badgeHTML +
            '<div class="flex justify-between items-center mb-4">' +
            '<p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">' + platformConfig.platform + '</p>' +
            '<div class="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-green-500/20 transition-colors">' +
            '<svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-green-400 opacity-60 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>' +
            '</div>' +
            '</div>' +
            '<div>' +
            '<div class="flex items-baseline space-x-1">' +
            '<span class="text-sm font-bold text-slate-400 group-hover:text-green-400">₹</span>' +
            '<p class="text-3xl font-black text-white group-hover:text-green-400 transition-all">' + priceValue.toLocaleString('en-IN') + '</p>' +
            '</div>' +
            '<div class="flex items-center mt-1 space-x-1.5">' +
            '<div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>' +
            '<p class="text-[9px] text-slate-500 uppercase tracking-widest font-medium">Direct Link</p>' +
            '</div>' +
            '</div>' +
            '</a>';
    }).join('');
    shopsmartResults.classList.remove('hidden');
}

// Reviews API Logic (Formerly Live View)
const liveViewUrlInput = document.getElementById('liveViewUrl');
const extractPhotosBtn = document.getElementById('extractPhotosBtn');
const liveViewLoading = document.getElementById('liveViewLoading');
const liveViewResults = document.getElementById('liveViewResults');
const lvErrorMessage = document.getElementById('lvErrorMessage');
const lvPhotoGrid = document.getElementById('lvPhotoGrid');

if (extractPhotosBtn) {
    extractPhotosBtn.addEventListener('click', async () => {
        const url = liveViewUrlInput.value.trim();
        if (!url) {
            showLvError('Please paste a product URL first.');
            return;
        }

        // Reset UI
        lvErrorMessage.classList.add('hidden');
        liveViewResults.classList.add('hidden');
        liveViewLoading.classList.remove('hidden');
        extractPhotosBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/live-view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to extract customer reviews');
            }

            displayReviews(result.reviews);
        } catch (error) {
            showLvError(error.message);
        } finally {
            liveViewLoading.classList.add('hidden');
            extractPhotosBtn.disabled = false;
        }
    });

    liveViewUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') extractPhotosBtn.click();
    });
}

function showLvError(message) {
    if (!lvErrorMessage) return;
    const errorText = document.getElementById('lvErrorText');
    if (errorText) errorText.textContent = message;
    lvErrorMessage.classList.remove('hidden');
    liveViewResults.classList.add('hidden');
}

function displayReviews(reviews) {
    const textFeed = document.getElementById('lvTextFeed');
    const photoFeed = document.getElementById('lvPhotoFeed');
    if (!textFeed || !photoFeed) return;

    const allReviews = reviews || [];

    // ── Separate text reviews from customer photo entries ──
    // New scraper: text entries have text set + image null
    //              photo entries have image set + text null (or "Visual Proof")
    const textOnly = allReviews.filter(r => {
        if (!r.text || r.text.length < 20) return false;
        const lower = r.text.toLowerCase();
        // Exclude placeholder/garbage text
        if (lower === 'visual proof') return false;
        if (lower.includes('customer shared a photo')) return false;
        if (r.text.startsWith('http')) return false;
        return true;
    });

    // Only use entries that have a valid image URL (not null/empty)
    const photosOnly = allReviews
        .map(r => r.image)
        .filter(img => img && img.length > 10 && !img.startsWith('data:'));
    const uniquePhotos = [...new Set(photosOnly)];

    console.log(`[Reviews] ${textOnly.length} text reviews, ${uniquePhotos.length} customer photos`);

    // If both empty → show friendly error
    if (textOnly.length === 0 && uniquePhotos.length === 0) {
        showLvError('No customer reviews or photos found for this product.');
        return;
    }

    // ── 1. Render Written Reviews ──────────────────────────────────────────
    if (textOnly.length === 0) {
        textFeed.innerHTML =
            '<div class="glass-panel p-6 text-center border border-white/5 opacity-40">' +
            '<p class="text-slate-500 text-xs italic">No written reviews found.</p>' +
            '</div>';
    } else {
        textFeed.innerHTML = textOnly.map((review, idx) =>
            '<div class="glass-panel static-glass p-5 border border-white/5 hover:border-blue-500/20 transition-all duration-300 group">' +
            '<div class="flex items-start space-x-3">' +
            '<div class="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">' +
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>' +
            '</svg>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center space-x-2 text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-1.5 opacity-80">' +
            '<span>Verified Buyer</span>' +
            '<span class="text-white/10">•</span>' +
            '<span>Review #' + (idx + 1) + '</span>' +
            '</div>' +
            '<p class="text-slate-300 text-sm leading-relaxed italic break-words">&ldquo;' + review.text + '&rdquo;</p>' +
            '</div>' +
            '</div>' +
            '</div>'
        ).join('');
    }

    // ── 2. Render Customer Photo Gallery ──────────────────────────────────
    if (uniquePhotos.length === 0) {
        photoFeed.innerHTML =
            '<div class="glass-panel p-6 text-center border border-white/5 opacity-40">' +
            '<div class="text-3xl mb-2">📷</div>' +
            '<p class="text-slate-500 text-xs italic">No customer photos posted for this product.</p>' +
            '</div>';
    } else {
        // Show photo count badge above the grid
        const countBadge =
            '<div class="col-span-full mb-2 flex items-center space-x-2">' +
            '<span class="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">' +
            '📸 ' + uniquePhotos.length + ' Customer Photo' + (uniquePhotos.length > 1 ? 's' : '') + ' Found' +
            '</span>' +
            '</div>';

        photoFeed.innerHTML = countBadge + uniquePhotos.map((imgUrl, i) => {
            // Route through backend image proxy to bypass CORS/hotlinking
            const proxiedUrl = `${API_URL}/image-proxy?url=${encodeURIComponent(imgUrl)}`;
            return (
                '<div class="break-inside-avoid relative group mb-4">' +
                '<div class="rounded-2xl overflow-hidden border border-white/10 bg-white/5 ' +
                'transition-all duration-500 group-hover:border-emerald-500/40 ' +
                'group-hover:shadow-xl group-hover:shadow-emerald-500/10">' +
                // Loading skeleton
                '<div class="absolute inset-0 animate-pulse bg-white/5 rounded-2xl" id="skel_' + i + '"></div>' +
                '<img ' +
                'src="' + proxiedUrl + '" ' +
                'data-original="' + imgUrl + '" ' +
                'alt="Customer photo ' + (i + 1) + '" ' +
                'class="relative w-full h-auto object-cover transition-transform duration-500 ' +
                'group-hover:scale-105 min-h-[80px]" ' +
                'loading="lazy" ' +
                'referrerpolicy="no-referrer" ' +
                'onload="var s=document.getElementById(\'skel_' + i + '\');if(s)s.remove();" ' +
                'onerror="' +
                'var s=document.getElementById(\'skel_' + i + '\');if(s)s.remove();' +
                'if(this.src!==this.dataset.original){' +
                'this.onerror=null;' +
                'this.src=this.dataset.original;' +
                '}' +
                '" />' +
                '<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent ' +
                'opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end p-3">' +
                '<span class="text-[9px] text-emerald-300 font-bold uppercase tracking-widest">' +
                '✓ Customer Photo' +
                '</span>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        }).join('');
    }

    liveViewResults.classList.remove('hidden');
}

// Auth Logic
if (toggleAuthBtn) {
    toggleAuthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginView = !isLoginView;

        if (isLoginView) {
            authTitle.textContent = 'Login';
            authSubtitle.textContent = 'Enter your credentials to continue';
            authSubmitBtn.textContent = 'Sign In';
            toggleAuthText.textContent = "Don't have an account?";
            toggleAuthBtn.textContent = 'Create Account';
            regNameFields.classList.add('hidden');
        } else {
            authTitle.textContent = 'Start Shopping';
            authSubtitle.textContent = 'Create your premium account';
            authSubmitBtn.textContent = 'Get Started';
            toggleAuthText.textContent = "Already have an account?";
            toggleAuthBtn.textContent = 'Sign In';
            regNameFields.classList.remove('hidden');
        }
        authErrorMessage.classList.add('hidden');
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authErrorMessage.classList.add('hidden');
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = isLoginView ? 'Signing In...' : 'Creating Account...';

        const email = authEmail.value;
        const password = authPassword.value;
        const firstName = regFirstName.value;

        const endpoint = isLoginView ? '/auth/login' : '/auth/register';
        const body = isLoginView ? { email, password } : { firstName, email, password };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Authentication failed');
            }

            // Success! (Transition to sessionStorage)
            sessionStorage.setItem('token', result.token);
            sessionStorage.setItem('user', JSON.stringify(result.user));

            showApp(result.user);
        } catch (error) {
            authErrorMessage.querySelector('p').textContent = error.message;
            authErrorMessage.classList.remove('hidden');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isLoginView ? 'Sign In' : 'Get Started';
        }
    });
}

function showApp(user) {
    currentUser = user;
    authSection.classList.add('opacity-0', 'translate-y-10');
    setTimeout(() => {
        authSection.classList.add('invisible');
        authSection.classList.add('hidden'); // Ensure it doesn't block interactions
        mainHeader.classList.remove('main-content-hidden');
        mainContent.classList.remove('main-content-hidden');
        mainHeader.classList.add('main-content-visible');
        mainContent.classList.add('main-content-visible');
        logoutBtn.classList.remove('hidden');
    }, 400);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.reload();
    });
}

// Check auth on load for logout button visibility
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('token')) {
        logoutBtn.classList.remove('hidden');
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) currentUser = user;
    }
});
