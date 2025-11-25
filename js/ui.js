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
        insights.push(`☔ <strong>It\'s raining!</strong> Carry an umbrella and wear waterproof clothing. Roads may be slippery.`);
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
