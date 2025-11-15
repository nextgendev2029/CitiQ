// ============================================
// CONFIGURATION FILE
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
