// --- Configuration ---
const apiKey = ""; 
const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
// In a production environment, uncomment the line below and replace with your Java server URL
// const javaBackendUrl = '/api/weather?city=';

// --- DOM Elements ---
const searchButton = document.getElementById('searchButton');
const spinner = document.getElementById('spinner');
const buttonText = document.getElementById('buttonText');
const cityInput = document.getElementById('cityInput');
const weatherResults = document.getElementById('weather-app');
const messageBox = document.getElementById('messageBox');
const hourlyForecastEl = document.getElementById('hourly-forecast');
const dailyForecastEl = document.getElementById('daily-forecast');
const currentTempEl = document.getElementById('current-temp');
const currentIconEl = document.getElementById('current-icon');
const currentConditionEl = document.getElementById('current-condition');
const precipEl = document.getElementById('precip');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const locationDisplayEl = document.getElementById('location-display');
const dateTimeEl = document.getElementById('date-time');

// --- Icons (Mapped to the image's style) ---
const weatherIcons = {
    'sun': '☀️', 'clear': '☀️', 'sunny': '☀️', 'cloud': '☁️', 'overcast': '🌥️',
    'rain': '🌧️', 'shower': '🌧️', 'drizzle': '🌦️', 'storm': '⛈️', 'thunder': '⛈️', 
    'snow': '❄️', 'mist': '🌫️', 'fog': '🌫️', 'partly': '⛅'
};

/**
 * Returns a suitable emoji icon based on the weather description.
 * @param {string} description - The weather condition description (e.g., "Light rain").
 * @returns {string} The corresponding emoji.
 */
function getIcon(description) {
    const lowerDesc = description.toLowerCase();
    for (const [key, icon] of Object.entries(weatherIcons)) {
        if (lowerDesc.includes(key)) {
            return icon;
        }
    }
    // Specific icon matching the image for cloudy/rain
    if (lowerDesc.includes('light rain')) return '🌧️';
    return '❓'; 
}

// --- Utility: API Retry ---
async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 429 && i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    console.warn(`Rate limit hit. Retrying in ${(delay / 1000).toFixed(1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            console.warn(`Fetch failed. Retrying in ${(delay / 1000).toFixed(1)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Displays a message box for errors or success notifications.
 * @param {string} text - The message content.
 * @param {string} className - Tailwind classes for styling the box (e.g., 'bg-red-100...').
 */
function showMessage(text, className) {
    messageBox.textContent = text;
    messageBox.className = `mt-4 p-3 rounded-lg mx-6 ${className}`;
    messageBox.classList.remove('hidden');
}

// --- Rendering Functions ---

/**
 * Renders the current weather conditions.
 */
function renderCurrentWeather(city, current) {
    // Updates the location and 'Choose area' link
    const locationText = `${city}, India · <a href="#" class="text-blue-600 hover:underline">Choose area</a>`;
    locationDisplayEl.innerHTML = locationText;
    
    // Sets the current date based on the user's local machine
    const now = new Date();
    dateTimeEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Updates the primary weather details
    currentTempEl.textContent = `${current.temp}°`;
    currentConditionEl.textContent = current.condition;
    currentIconEl.textContent = getIcon(current.condition);
    precipEl.textContent = current.precip;
    humidityEl.textContent = current.humidity;
    windEl.textContent = current.wind;
}

/**
 * Renders the hourly forecast data into the horizontal scroller.
 */
function renderHourlyForecast(hourlyData) {
    hourlyForecastEl.innerHTML = ''; // Clear previous data
    
    hourlyData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'flex flex-col items-center p-2 min-w-[70px]';
        div.innerHTML = `
            <p class="text-sm font-medium text-gray-500">${item.time}</p>
            <p class="text-xs text-blue-600 font-semibold my-1">${item.precip}</p>
            <span class="text-2xl my-1">${getIcon(item.condition)}</span>
            <p class="text-lg font-semibold text-gray-700">${item.temp}°</p>
        `;
        hourlyForecastEl.appendChild(div);
    });
}

/**
 * Renders the 7-day daily forecast data into the grid.
 */
function renderDailyForecast(dailyData) {
    dailyForecastEl.innerHTML = ''; // Clear previous data
    
    // Day names array for display
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    dailyData.forEach((item, index) => {
        const div = document.createElement('div');
        // Apply 'selected' class to the first day (Today)
        div.className = `daily-box flex flex-col items-center text-sm ${index === 0 ? 'selected' : ''}`;
        
        let dayOfWeek = 'Day N/A';
        try {
            // Get the day name (Sun, Mon, etc.)
            dayOfWeek = dayNames[new Date(item.date).getDay()];
        } catch (e) {
            // If date parsing fails, use the fallback
            // console.error("Could not parse date:", item.date);
        }

        div.innerHTML = `
            <p class="text-xs font-semibold text-gray-600 mb-1">${dayOfWeek}</p>
            <span class="text-2xl my-1">${getIcon(item.condition)}</span>
            <p class="text-base font-semibold text-gray-800">${item.high}°/<span class="text-gray-500">${item.low}°</span></p>
        `;
        dailyForecastEl.appendChild(div);
    });
}

/**
 * Orchestrates the rendering of all forecast components.
 */
function renderAllData(city, data) {
    renderCurrentWeather(city, data.current);
    renderHourlyForecast(data.hourly.slice(0, 8)); // Only show 8 hours to match the visual style
    renderDailyForecast(data.daily.slice(0, 7)); // Show 7 days

    // Hide the input box after the initial successful load
    document.getElementById('cityInput').parentElement.classList.add('hidden');
}


// --- Main Fetch Function ---
async function fetchWeather() {
    // Use the default city from the image if the input is empty
    const city = cityInput.value.trim() || 'Amritpur, Uttarakhand'; 
    messageBox.classList.add('hidden');
    
    // Set loading state
    searchButton.disabled = true;
    buttonText.textContent = 'Loading...';
    // The spinner element is assumed to contain the SVG markup for the loading icon
    spinner.classList.remove('hidden'); 
    
    // Display temporary loading placeholders
    hourlyForecastEl.innerHTML = '<div class="text-center text-gray-400 p-2">Fetching hourly data...</div>';
    dailyForecastEl.innerHTML = '<div class="col-span-7 text-gray-400 p-4">Fetching daily forecast...</div>';


    try {
        // --- REAL WORLD SCENARIO: CALLING THE JAVA BACKEND ---
        /* If running a Spring Boot server, you would replace the code below with:
        const response = await fetchWithRetry(`${javaBackendUrl}${city}`);
        const data = await response.json();
        renderAllData(city, data);
        */
        
        // --- DIRECT GEMINI API CALL (Used for immediate functionality in this environment) ---
        const userQuery = `Provide the current weather, 8-hour hourly forecast, and 7-day daily forecast for ${city}. Ensure the response is a single JSON object that strictly adheres to the provided schema.`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            // Request structured JSON response
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        current: {
                            type: "OBJECT",
                            description: "Current conditions and details.",
                            properties: {
                                temp: { type: "INTEGER" },
                                condition: { type: "STRING" },
                                precip: { type: "STRING" },
                                humidity: { type: "STRING" },
                                wind: { type: "STRING" }
                            }
                        },
                        hourly: {
                            type: "ARRAY",
                            description: "8-hour forecast.",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    time: { type: "STRING" },
                                    temp: { type: "INTEGER" },
                                    precip: { type: "STRING" },
                                    condition: { type: "STRING" }
                                }
                            }
                        },
                        daily: {
                            type: "ARRAY",
                            description: "7-day forecast.",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    date: { type: "STRING" },
                                    high: { type: "INTEGER" },
                                    low: { type: "INTEGER" },
                                    condition: { type: "STRING" }
                                }
                            }
                        }
                    }
                }
            },
            tools: [{ "google_search": {} }],
            systemInstruction: {
                parts: [{ text: "You are a weather data parser. Based on the user's city, generate only the required JSON structure containing current, 8-hour, and 7-day weather details. Temperatures should be in Celsius (matching the image) unless specified otherwise by the search results." }]
            },
        };

        const response = await fetchWithRetry(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonText) {
            throw new Error("Failed to get structured data from API.");
        }
        
        const data = JSON.parse(jsonText);
        // --- END DIRECT GEMINI API CALL ---

        renderAllData(city, data);

    } catch (error) {
        console.error('Error fetching or parsing weather data:', error);
        showMessage(`Could not load weather data for ${city}. Please check the city name. Error: ${error.message}`, 'bg-red-100 border-red-400 text-red-700');
    } finally {
        // Reset loading state
        searchButton.disabled = false;
        buttonText.textContent = 'Load Data';
        spinner.classList.add('hidden');
    }
}

// Initial fetch and Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
    // Start by fetching the default city data on load
    fetchWeather();
    
    // Tab functionality (only cosmetic for this demo, no content switching implemented)
    document.querySelectorAll('#nav-tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('#nav-tabs .tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Enable search via Enter key
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchWeather();
        }
    });
});
