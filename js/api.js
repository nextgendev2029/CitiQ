// ============================================
// API FUNCTIONS FILE
// ============================================

// Fetch current weather data by city name from OpenWeatherMap API
// This function searches for the city and returns weather + coordinates
async function fetchWeatherDataByCity(cityName) {
    // Using your OpenWeatherMap API key
    // The 'q' parameter allows us to search by city name
    const url = https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${WEATHER_KEY};
    
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
    const url = https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY};
    
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
    const url = https://api.api-ninjas.com/v1/airquality?city=${cityName};
    
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
