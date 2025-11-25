// ============================================
// GLOBAL VARIABLES AND CONFIGURATION
// ============================================

// API Keys - Your personal keys for accessing weather and air quality data
const WEATHER_KEY = "78347bcb290e1b188463c4f05bbe1aeb"; // OpenWeatherMap API key
const AQI_KEY = "7BzLpUOUorQPyzPaOjn/EA==Dn4RLcCKEriCQ7Be"; // API Ninjas key for AQI

// Store chart instances globally so we can update them later
let tempChart = null;
let aqChart = null;

// Store current city name globally
let currentCityName = 'London'; // Default city

// Map variables
let map = null; // Leaflet map instance
let cityMarker = null; // Marker for current city
let weatherLayer = null; // Current weather overlay layer
let currentLayer = 'none'; // Track active layer

// ============================================
// INITIALIZATION - Runs when page loads
// ============================================

// Wait for the entire page to load before running code
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing CitiQ dashboard...');
    
    // Set default city in search box
    document.getElementById('citySearch').value = currentCityName;
    
    // Load data for the default city (London)
    loadCityData();
    
    // Initialize the map after a short delay to ensure DOM is ready
    setTimeout(() => {
        try {
            initializeMap();
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Map initialization error:', error);
        }
    }, 500);
    
    // Add event listener to search button
    document.getElementById('searchBtn').addEventListener('click', function() {
        const cityName = document.getElementById('citySearch').value.trim();
        if (cityName) {
            currentCityName = cityName;
            loadCityData();
        } else {
            alert('Please enter a city name!');
        }
    });
    
    // Add event listener for Enter key in search box
    document.getElementById('citySearch').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const cityName = document.getElementById('citySearch').value.trim();
            if (cityName) {
                currentCityName = cityName;
                loadCityData();
            }
        }
    });
    
    // Add event listener to refresh button - reloads current city
    document.getElementById('refreshBtn').addEventListener('click', loadCityData);
    
    // Add event listeners to quick city buttons
    const quickCityButtons = document.querySelectorAll('.quick-city');
    quickCityButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cityName = this.getAttribute('data-city');
            currentCityName = cityName;
            document.getElementById('citySearch').value = cityName;
            loadCityData();
        });
    });
});

// ============================================
// MAIN FUNCTION - Loads all city data
// ============================================

async function loadCityData() {
    // Get the city name from the global variable
    const cityName = currentCityName;
    
    console.log('Loading data for city:', cityName);
    
    // Show loading spinner, hide dashboard and error
    showLoading(true);
    hideError();
    
    try {
        // First, fetch weather data to get coordinates (OpenWeatherMap can search by city name)
        // This is called "geocoding" - converting city name to coordinates
        const weatherData = await fetchWeatherDataByCity(cityName);
        
        // Extract coordinates from weather data
        const lat = weatherData.coord.lat;
        const lon = weatherData.coord.lon;
        
        // Now fetch forecast and air quality data using the coordinates
        // Using 2 different APIs: OpenWeatherMap for weather, API Ninjas for AQI
        const [forecastData, airQualityData] = await Promise.all([
            fetchForecastData(lat, lon),
            fetchAirQualityData(cityName) // API Ninjas uses city name
        ]);
        
        // Update all dashboard sections with the fetched data
        updateWeatherCard(weatherData);
        updateAirQualityCard(airQualityData);
        updateCityInfoCard(weatherData, lat, lon);
        updateInsightsSection(weatherData, airQualityData, forecastData);
        updateTemperatureChart(forecastData);
        updateAirQualityChart(airQualityData);
        updateWeatherMap(lat, lon, weatherData.name);
        updateLastUpdateTime();
        
        // Hide loading spinner and show dashboard
        showLoading(false);
        document.getElementById('dashboard').style.display = 'flex';
        
    } catch (error) {
        // If any error occurs, show error message
        console.error('Error loading city data:', error);
        console.error('Error details:', error.message, error.stack);
        showError(`Failed to load data for "${cityName}". Error: ${error.message}`);
        showLoading(false);
    }
}

// ============================================
// API FUNCTIONS - Fetch data from external APIs
// ============================================

// Fetch current weather data by city name from OpenWeatherMap API
// This function searches for the city and returns weather + coordinates
async function fetchWeatherDataByCity(cityName) {
    try {
        // Using your OpenWeatherMap API key
        // The 'q' parameter allows us to search by city name
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${WEATHER_KEY}`;
        
        console.log('Fetching weather data from:', url.replace(WEATHER_KEY, 'API_KEY'));
        
        // Fetch data from API
        const response = await fetch(url);
        
        // Check if request was successful
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            }
            throw new Error(`Weather API request failed with status: ${response.status}`);
        }
        
        // Convert response to JSON format
        const data = await response.json();
        console.log('Weather data received successfully');
        return data;
    } catch (error) {
        console.error('Error in fetchWeatherDataByCity:', error);
        throw error;
    }
}

// Fetch 5-day weather forecast from OpenWeatherMap API
async function fetchForecastData(lat, lon) {
    try {
        // Using your OpenWeatherMap API key for forecast data
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`;
        
        console.log('Fetching forecast data...');
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Forecast API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Forecast data received successfully');
        return data;
    } catch (error) {
        console.error('Error in fetchForecastData:', error);
        throw error;
    }
}

// Fetch air quality data from API Ninjas
// API Ninjas uses city name instead of coordinates
async function fetchAirQualityData(cityName) {
    try {
        // Using your API Ninjas key for air quality data
        const url = `https://api.api-ninjas.com/v1/airquality?city=${cityName}`;
        
        console.log('Fetching air quality data...');
        
        // API Ninjas requires the key to be sent in the header
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Api-Key': AQI_KEY // API Ninjas uses X-Api-Key header
            }
        });
        
        if (!response.ok) {
            throw new Error(`Air Quality API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Air quality data received successfully');
        return data;
    } catch (error) {
        console.error('Error in fetchAirQualityData:', error);
        throw error;
    }
}

// ============================================
// UPDATE FUNCTIONS - Update dashboard with data
// ============================================

// Update the weather card with current weather data
function updateWeatherCard(data) {
    // Extract temperature and round to 1 decimal place
    const temp = Math.round(data.main.temp * 10) / 10;
    
    // Update DOM elements with weather data
    document.getElementById('temperature').textContent = `${temp}°C`;
    document.getElementById('weatherDesc').textContent = data.weather[0].description.toUpperCase();
    document.getElementById('windSpeed').textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    document.getElementById('humidity').textContent = data.main.humidity;
}

// Update the air quality card with API Ninjas data
function updateAirQualityCard(data) {
    console.log('Air quality data received:', data);
    
    // API Ninjas returns overall_aqi (US EPA standard, 0-500 scale)
    const aqi = Math.round(data.overall_aqi);
    
    // Determine AQI status based on US EPA standards
    // 0-50: Good, 51-100: Moderate, 101-150: Unhealthy for Sensitive, 151-200: Unhealthy, 201+: Very Unhealthy
    let aqiStatus = '';
    let aqiColor = '';
    
    if (aqi <= 50) {
        aqiStatus = 'Good';
        aqiColor = '#2ecc71';
    } else if (aqi <= 100) {
        aqiStatus = 'Moderate';
        aqiColor = '#f39c12';
    } else if (aqi <= 150) {
        aqiStatus = 'Unhealthy for Sensitive';
        aqiColor = '#e67e22';
    } else if (aqi <= 200) {
        aqiStatus = 'Unhealthy';
        aqiColor = '#e74c3c';
    } else {
        aqiStatus = 'Very Unhealthy';
        aqiColor = '#8e44ad';
    }
    
    // Update DOM elements
    document.getElementById('aqi').textContent = aqi;
    document.getElementById('aqi').style.color = aqiColor;
    document.getElementById('aqiStatus').textContent = aqiStatus;
    
    // API Ninjas provides PM2.5 and PM10 concentration
    // Check different possible property names
    let pm25Value = 'N/A';
    let pm10Value = 'N/A';
    
    if (data['PM2.5'] && data['PM2.5'].concentration !== undefined) {
        pm25Value = data['PM2.5'].concentration.toFixed(2);
    } else if (data.PM2_5 && data.PM2_5.concentration !== undefined) {
        pm25Value = data.PM2_5.concentration.toFixed(2);
    }
    
    if (data.PM10 && data.PM10.concentration !== undefined) {
        pm10Value = data.PM10.concentration.toFixed(2);
    }
    
    document.getElementById('pm25').textContent = pm25Value;
    document.getElementById('pm10').textContent = pm10Value;
    
    console.log('PM2.5:', pm25Value, 'PM10:', pm10Value);
}

// Update city information card
function updateCityInfoCard(weatherData, lat, lon) {
    // Get city name and country from weather data
    const cityName = weatherData.name;
    const country = weatherData.sys.country;
    
    document.getElementById('cityName').textContent = `${cityName}, ${country}`;
    document.getElementById('latitude').textContent = lat.toFixed(4);
    document.getElementById('longitude').textContent = lon.toFixed(4);
    
    // Calculate local time using timezone offset from API
    // weatherData.timezone is in seconds, convert to milliseconds
    const timezoneOffset = weatherData.timezone * 1000;
    const localTime = new Date(Date.now() + timezoneOffset);
    const hours = localTime.getUTCHours().toString().padStart(2, '0');
    const minutes = localTime.getUTCMinutes().toString().padStart(2, '0');
    
    document.getElementById('localTime').textContent = `${hours}:${minutes}`;
}

// Update insights section with personalized recommendations
function updateInsightsSection(weatherData, airQualityData, forecastData) {
    const aqi = Math.round(airQualityData.overall_aqi);
    const temp = Math.round(weatherData.main.temp);
    const humidity = weatherData.main.humidity;
    const windSpeed = Math.round(weatherData.wind.speed * 3.6);
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    const weatherDesc = weatherData.weather[0].description;
    
    // Check if rain is expected in forecast
    let rainExpected = false;
    if (forecastData && forecastData.list) {
        // Check next 24 hours (8 data points)
        for (let i = 0; i < Math.min(8, forecastData.list.length); i++) {
            if (forecastData.list[i].weather[0].main.toLowerCase().includes('rain')) {
                rainExpected = true;
                break;
            }
        }
    }
    
    const insights = [];
    let overallStatus = '';
    let statusIcon = '';
    let statusColor = '';
    
    // Determine overall outdoor activity recommendation
    if (aqi > 150 || weatherMain.includes('thunderstorm') || (weatherMain.includes('rain') && windSpeed > 40)) {
        overallStatus = 'Stay Indoors';
        statusIcon = '🏠';
        statusColor = '#e74c3c';
    } else if (aqi > 100 || temp > 38 || temp < 0 || windSpeed > 50) {
        overallStatus = 'Limit Outdoor Activities';
        statusIcon = '⚠️';
        statusColor = '#f39c12';
    } else if (aqi > 50 || weatherMain.includes('rain') || weatherMain.includes('snow')) {
        overallStatus = 'Caution Advised';
        statusIcon = '⚡';
        statusColor = '#3498db';
    } else {
        overallStatus = 'Good to Go Outside';
        statusIcon = '✅';
        statusColor = '#2ecc71';
    }
    
    // Air Quality insights
    if (aqi <= 50) {
        insights.push('🌿 <strong>Air quality is excellent!</strong> Perfect for outdoor activities and exercise.');
    } else if (aqi <= 100) {
        insights.push('😷 <strong>Moderate air quality.</strong> Sensitive individuals should consider limiting prolonged outdoor activities.');
    } else if (aqi <= 150) {
        insights.push('⚠️ <strong>Unhealthy for sensitive groups.</strong> Children, elderly, and people with respiratory issues should stay indoors.');
    } else if (aqi <= 200) {
        insights.push('🚨 <strong>Unhealthy air quality!</strong> Everyone should avoid outdoor activities. Wear a mask if you must go out.');
    } else {
        insights.push('☠️ <strong>Very unhealthy air!</strong> Stay indoors, close windows, and use air purifiers if available.');
    }
    
    // Weather-based insights
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
        insights.push('☔ <strong>It\'s raining!</strong> Carry an umbrella and wear waterproof clothing. Roads may be slippery.');
    } else if (rainExpected) {
        insights.push('🌧️ <strong>Rain expected soon.</strong> Carry an umbrella just in case.');
    }
    
    if (weatherMain.includes('thunderstorm')) {
        insights.push('⛈️ <strong>Thunderstorm alert!</strong> Stay indoors and avoid open areas. Unplug electronics.');
    }
    
    if (weatherMain.includes('snow')) {
        insights.push('❄️ <strong>Snowy conditions.</strong> Drive carefully, wear warm layers, and watch for ice.');
    }
    
    if (weatherMain.includes('fog') || weatherMain.includes('mist')) {
        insights.push('🌫️ <strong>Low visibility.</strong> Drive slowly and use fog lights if traveling.');
    }
    
    // Temperature insights
    if (temp > 35) {
        insights.push('🔥 <strong>Extreme heat!</strong> Stay hydrated, avoid direct sunlight, and limit outdoor activities during peak hours.');
    } else if (temp > 30) {
        insights.push('☀️ <strong>Hot weather.</strong> Drink plenty of water, wear sunscreen, and seek shade when possible.');
    } else if (temp < 0) {
        insights.push('🥶 <strong>Freezing temperatures!</strong> Dress in warm layers, cover exposed skin, and limit time outdoors.');
    } else if (temp < 10) {
        insights.push('🧥 <strong>Cold weather.</strong> Wear a jacket and warm clothing when going out.');
    }
    
    // Humidity insights
    if (humidity > 80) {
        insights.push('💦 <strong>High humidity.</strong> It may feel muggy and uncomfortable. Stay cool and hydrated.');
    } else if (humidity < 30) {
        insights.push('🏜️ <strong>Low humidity.</strong> Skin may feel dry. Use moisturizer and drink water.');
    }
    
    // Wind insights
    if (windSpeed > 50) {
        insights.push('💨 <strong>Very windy!</strong> Secure loose objects and be cautious when driving or walking.');
    } else if (windSpeed > 30) {
        insights.push('🌬️ <strong>Windy conditions.</strong> Hold onto hats and umbrellas!');
    }
    
    // Build the insights HTML
    let insightsHTML = `
        <div class="overall-status" style="background-color: ${statusColor}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">${statusIcon} ${overallStatus}</h2>
        </div>
        <div class="insights-list">
    `;
    
    insights.forEach(insight => {
        insightsHTML += `<div class="insight-item">${insight}</div>`;
    });
    
    insightsHTML += '</div>';
    
    document.getElementById('insightsContent').innerHTML = insightsHTML;
}

// Update temperature trend chart (line chart)
function updateTemperatureChart(data) {
    // Extract forecast data - take one reading per day (every 8th item = 24 hours)
    const labels = [];
    const temperatures = [];
    
    // Validate that we have forecast data
    if (!data.list || data.list.length === 0) {
        console.error('No forecast data available');
        return;
    }
    
    // Loop through forecast data (every 8th item = once per day)
    for (let i = 0; i < data.list.length; i += 8) {
        const item = data.list[i];
        
        // Validate that temperature data exists and is valid
        if (item && item.main && typeof item.main.temp === 'number' && !isNaN(item.main.temp)) {
            // Format date as "Mon 15"
            const date = new Date(item.dt * 1000);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
            temperatures.push(Math.round(item.main.temp * 10) / 10); // Round to 1 decimal
        }
    }
    
    // If no valid data points, don't create chart
    if (temperatures.length === 0) {
        console.error('No valid temperature data points');
        return;
    }
    
    // Get canvas element for chart
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    // If chart already exists, destroy it before creating new one
    if (tempChart) {
        tempChart.destroy();
    }
    
    // Calculate min and max temperatures for better Y-axis range
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    
    // Add padding to the range (5 degrees on each side)
    const tempRange = maxTemp - minTemp;
    const padding = Math.max(5, tempRange * 0.2); // At least 5 degrees padding
    
    const yMin = Math.floor(minTemp - padding);
    const yMax = Math.ceil(maxTemp + padding);
    
    // Create new line chart using Chart.js
    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Makes the line curved
                spanGaps: false // Don't connect points if there are gaps
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: yMin,
                    max: yMax,
                    ticks: {
                        stepSize: 1, // Show every 1 degree
                        callback: function(value) {
                            return Math.round(value) + '°C';
                        }
                    }
                }
            }
        }
    });
}

// Update air quality components chart (bar chart) with API Ninjas data
function updateAirQualityChart(data) {
    // Get canvas element
    const ctx = document.getElementById('aqChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (aqChart) {
        aqChart.destroy();
    }
    
    // API Ninjas provides detailed pollutant data with AQI and concentration
    // Extract concentration values for each pollutant
    const labels = [];
    const concentrations = [];
    const colors = [];
    const borderColors = [];
    
    // Define color palette for different pollutants
    const colorPalette = [
        { bg: 'rgba(255, 99, 132, 0.7)', border: 'rgba(255, 99, 132, 1)' },
        { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgba(54, 162, 235, 1)' },
        { bg: 'rgba(255, 206, 86, 0.7)', border: 'rgba(255, 206, 86, 1)' },
        { bg: 'rgba(75, 192, 192, 0.7)', border: 'rgba(75, 192, 192, 1)' },
        { bg: 'rgba(153, 102, 255, 0.7)', border: 'rgba(153, 102, 255, 1)' },
        { bg: 'rgba(255, 159, 64, 0.7)', border: 'rgba(255, 159, 64, 1)' }
    ];
    
    let colorIndex = 0;
    
    // Check which pollutants are available and add them to the chart
    if (data.CO && data.CO.concentration !== undefined) {
        labels.push('CO');
        concentrations.push(data.CO.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.NO2 && data.NO2.concentration !== undefined) {
        labels.push('NO₂');
        concentrations.push(data.NO2.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.O3 && data.O3.concentration !== undefined) {
        labels.push('O₃');
        concentrations.push(data.O3.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    // Check both PM2.5 and PM2_5 property names
    if (data['PM2.5'] && data['PM2.5'].concentration !== undefined) {
        labels.push('PM2.5');
        concentrations.push(data['PM2.5'].concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    } else if (data.PM2_5 && data.PM2_5.concentration !== undefined) {
        labels.push('PM2.5');
        concentrations.push(data.PM2_5.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.PM10 && data.PM10.concentration !== undefined) {
        labels.push('PM10');
        concentrations.push(data.PM10.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.SO2 && data.SO2.concentration !== undefined) {
        labels.push('SO₂');
        concentrations.push(data.SO2.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
    }
    
    // Create bar chart showing different air pollutants from API Ninjas
    aqChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Concentration (μg/m³)',
                data: concentrations,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        // Custom tooltip to show concentration values
                        label: function(context) {
                            return context.parsed.y.toFixed(2) + ' μg/m³';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Concentration (μg/m³)'
                    }
                }
            }
        }
    });
}

// Update the "last updated" timestamp
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// ============================================
// UTILITY FUNCTIONS - Helper functions
// ============================================

// Show or hide loading spinner
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Show error message
function showError(message) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('dashboard').style.display = 'none';
}

// Hide error message
function hideError() {
    document.getElementById('error').style.display = 'none';
}

// ============================================
// MAP FUNCTIONS - Interactive weather map
// ============================================

// Initialize the Leaflet map
function initializeMap() {
    // Check if map container exists
    const mapContainer = document.getElementById('weatherMap');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }
    
    // If map already exists, don't reinitialize
    if (map) {
        console.log('Map already initialized');
        return;
    }
    
    try {
        // Create map centered on London (default)
        map = L.map('weatherMap').setView([51.5074, -0.1278], 10);
        
        // Add OpenStreetMap base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Add initial marker for London
        cityMarker = L.marker([51.5074, -0.1278]).addTo(map);
        cityMarker.bindPopup('<b>London</b><br>Loading weather data...').openPopup();
        
        // Force map to refresh its size
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
        
        // Add event listeners to layer buttons
        const layerButtons = document.querySelectorAll('.layer-btn');
        layerButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                layerButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get selected layer
                const layer = this.getAttribute('data-layer');
                currentLayer = layer;
                
                // Update weather layer
                updateWeatherLayer(layer);
            });
        });
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Update map location and marker when city changes
function updateWeatherMap(lat, lon, cityName) {
    // Initialize map if it doesn't exist yet
    if (!map) {
        console.log('Map not initialized, initializing now...');
        initializeMap();
        // Wait a bit for map to initialize
        setTimeout(() => {
            updateWeatherMap(lat, lon, cityName);
        }, 500);
        return;
    }
    
    // Update map center and zoom
    map.setView([lat, lon], 10);
    
    // Update marker position
    if (cityMarker) {
        cityMarker.setLatLng([lat, lon]);
        cityMarker.bindPopup(`<b>${cityName}</b><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`).openPopup();
    }
    
    // Refresh map size in case container was hidden
    map.invalidateSize();
    
    // Refresh weather layer if one is active
    if (currentLayer !== 'none') {
        updateWeatherLayer(currentLayer);
    }
}

// Update weather overlay layer on the map
function updateWeatherLayer(layerType) {
    // Remove existing weather layer if present
    if (weatherLayer) {
        map.removeLayer(weatherLayer);
        weatherLayer = null;
    }
    
    // If "none" selected, just remove the layer
    if (layerType === 'none') {
        return;
    }
    
    // OpenWeatherMap tile layer URLs for different weather data
    // These layers show weather conditions as colored overlays on the map
    let layerUrl = '';
    
    switch(layerType) {
        case 'precipitation':
            // Precipitation layer - shows rainfall intensity
            layerUrl = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${WEATHER_KEY}`;
            break;
        case 'clouds':
            // Cloud coverage layer - shows cloud density
            layerUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${WEATHER_KEY}`;
            break;
        case 'wind':
            // Wind speed layer - shows wind patterns
            layerUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${WEATHER_KEY}`;
            break;
        case 'temp':
            // Temperature layer - shows temperature distribution
            layerUrl = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${WEATHER_KEY}`;
            break;
    }
    
    // Add the selected weather layer to the map
    if (layerUrl) {
        weatherLayer = L.tileLayer(layerUrl, {
            attribution: '© OpenWeatherMap',
            opacity: 0.6, // Make layer semi-transparent so base map is visible
            maxZoom: 18
        }).addTo(map);
    }
}
