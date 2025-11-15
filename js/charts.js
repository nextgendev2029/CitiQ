// ============================================
// CHARTS & VISUALIZATION FILE
// ============================================

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

// ============================================
// MAP FUNCTIONS - Interactive weather map
// ============================================

// Initialize the Leaflet map
function initializeMap() {
    // Create map centered on London (default)
    map = L.map('weatherMap').setView([51.5074, -0.1278], 10);
    
    // Add OpenStreetMap base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '©️ OpenStreetMap contributors',
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
            attribution: '©️ OpenWeatherMap',
            opacity: 0.6, // Make layer semi-transparent so base map is visible
            maxZoom: 18
        }).addTo(map);
    }
}
