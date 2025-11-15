// ============================================
// UI & DOM MANIPULATION FILE
// ============================================

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
