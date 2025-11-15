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
    // Set default city in search box
    document.getElementById('citySearch').value = currentCityName;
    
    // Initialize the map
    initializeMap();
    
    // Load data for the default city (London)
    loadCityData();
    
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
        showError(`Failed to load data for "${cityName}". Please check the city name and try again.`);
        showLoading(false);
    }
}

// ============================================
// API FUNCTIONS - Fetch data from external APIs
// ============================================

// Fetch current weather data by city name from OpenWeatherMap API
// This function searches for the city and returns weather + coordinates
async function fetchWeatherDataByCity(cityName) {
    // Using your OpenWeatherMap API key
    // The 'q' parameter allows us to search by city name
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${WEATHER_KEY}`;
    
    // Fetch data from API
    const response = await fetch(url);
    
    // Check if request was successful
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('City not found. Please check the spelling.');
        }
        throw new Error('Weather API request failed');
    }
    
    // Convert response to JSON format
    return await response.json();
}

// Fetch 5-day weather forecast from OpenWeatherMap API
async function fetchForecastData(lat, lon) {
    // Using your OpenWeatherMap API key for forecast data
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Forecast API request failed');
    }
    return await response.json();
}

// Fetch air quality data from API Ninjas
// API Ninjas uses city name instead of coordinates
async function fetchAirQualityData(cityName) {
    // Using your API Ninjas key for air quality data
    const url = `https://api.api-ninjas.com/v1/airquality?city=${encodeURIComponent(cityName)}`;
    
    // API Ninjas requires the key to be sent in the header
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Api-Key': AQI_KEY // API Ninjas uses X-Api-Key header
        }
    });
    
    if (!response.ok) {
        throw new Error('Air Quality API request failed');
    }
    return await response.json();
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
    // API Ninjas returns overall_aqi (US EPA standard, 0-500 scale)
    const aqi = Math.round(data.overall_aqi);
    
    // Determine AQI status based on US EPA standards
    // 0-50: Good, 51-100: Moderate, 101-150: Unhealthy for Sensitive, 151-200: Unhealthy, 201+: Very Unhealthy
    let aqiStatus = '';
    let aqiColor = '';
    
    if (aqi <= 50) {
        aqiStatus = 'Good';
        aqiColor = '#2ecc71';/
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
    document.getElementById('pm25').textContent = data.PM2_5 ? data.PM2_5.concentration.toFixed(2) : 'N/A';
    document.getElementById('pm10').textContent = data.PM10 ? data.PM10.concentration.toFixed(2) : 'N/A';
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

// Update temperature trend chart (line chart)
function updateTemperatureChart(data) {
    // Extract forecast data - take one reading per day (every 8th item = 24 hours)
    const labels = [];
    const temperatures = [];
    
    // Loop through forecast data (every 8th item = once per day)
    for (let i = 0; i < data.list.length; i += 8) {
        const item = data.list[i];
        // Format date as "Mon 15"
        const date = new Date(item.dt * 1000);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
        temperatures.push(Math.round(item.main.temp));
    }
    
    // Get canvas element for chart
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    // If chart already exists, destroy it before creating new one
    if (tempChart) {
        tempChart.destroy();
    }
    
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
                tension: 0.4 // Makes the line curved
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
                    ticks: {
                        callback: function(value) {
                            return value + '°C';
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
    if (data.CO) {
        labels.push('CO');
        concentrations.push(data.CO.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.NO2) {
        labels.push('NO₂');
        concentrations.push(data.NO2.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.O3) {
        labels.push('O₃');
        concentrations.push(data.O3.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.PM2_5) {
        labels.push('PM2.5');
        concentrations.push(data.PM2_5.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.PM10) {
        labels.push('PM10');
        concentrations.push(data.PM10.concentration);
        colors.push(colorPalette[colorIndex].bg);
        borderColors.push(colorPalette[colorIndex].border);
        colorIndex++;
    }
    if (data.SO2) {
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
}

// Update map location and marker when city changes
function updateWeatherMap(lat, lon, cityName) {
    if (!map) return;
    
    // Update map center and zoom
    map.setView([lat, lon], 10);
    
    // Update marker position
    if (cityMarker) {
        cityMarker.setLatLng([lat, lon]);
        cityMarker.bindPopup(`<b>${cityName}</b><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`).openPopup();
    }
    
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
