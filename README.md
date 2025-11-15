#  CitiQ - Smart City Data Dashboard

A real-time data visualization dashboard that displays weather, air quality, and city information for any city around the world.

## 📋 Features

- **Real-time Weather Data**: Current temperature, weather conditions, wind speed, and humidity
- **Air Quality Monitoring**: AQI (Air Quality Index) with PM2.5 and PM10 pollutant data
- **Interactive Charts**: 
  - 5-day temperature forecast (line chart)
  - Air quality components visualization (bar chart)
- **Interactive Weather Map**: 
  - Live map with city location marker
  - Multiple weather layer overlays (precipitation, clouds, wind, temperature)
  - Zoom and pan to explore surrounding areas
- **Universal City Search**: Search for ANY city in the world by name
- **Quick Access Buttons**: Popular cities for one-click access
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Auto-refresh**: Manual refresh button to get latest data
- **Smart Search**: Press Enter or click Search button to load city data

## 🛠️ Technologies Used

- **HTML5**: Structure and layout
- **CSS3**: Dark blue theme with gradients, animations, and responsive design
- **JavaScript (ES6+)**: Async/await, fetch API, DOM manipulation
- **Chart.js**: Data visualization library for charts
- **Leaflet.js**: Interactive map library
- **OpenWeatherMap API**: Weather data and map tile layers
- **API Ninjas**: Air quality data

## 🚀 How to Run

1. **Download all files** to a folder on your computer:
   - `index.html`
   - `style.css`
   - `script.js`

2. **Open the project**:
   - Simply double-click on `index.html` to open it in your browser
   - OR right-click → Open with → Your preferred browser

3. **That's it!** The dashboard will automatically load data for London

## 🔍 How to Use

1. **Search any city**: Type any city name in the search box (e.g., "Mumbai", "Berlin", "Sydney")
2. **Press Enter** or click the "Search" button
3. **Quick access**: Click any popular city button for instant results
4. **Explore the map**: 
   - Click layer buttons to view precipitation, clouds, wind, or temperature overlays
   - Zoom in/out and pan around to explore the area
   - Red marker shows the current city location
5. **Refresh**: Click the refresh button to update data for the current city

## 🔑 API Information

The project uses **TWO different APIs** to demonstrate multi-API integration:

1. **OpenWeatherMap API** - For weather and forecast data
2. **API Ninjas** - For air quality (AQI) data

Your API keys are already configured in `script.js`:
```javascript
const WEATHER_KEY = "78347bcb290e1b188463c4f05bbe1aeb"; // OpenWeatherMap
const AQI_KEY = "7BzLpUOUorQPyzPaOjn/EA==Dn4RLcCKEriCQ7Be"; // API Ninjas
```

## 📊 Data Sources

- **Weather Data**: OpenWeatherMap Current Weather API
- **Forecast Data**: OpenWeatherMap 5-Day Forecast API  
- **Air Quality**: API Ninjas Air Quality API (US EPA standard)
- **Map Tiles**: OpenStreetMap (base layer) + OpenWeatherMap (weather overlays)

## 🎨 Customization

### Add More Quick Access Cities

Edit the quick cities section in `index.html`:

```html
<button class="quick-city" data-city="YourCity">Your City</button>
```

No need to add coordinates - the app automatically finds any city!

### Change Colors

Edit the gradient colors in `style.css`:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 🐛 Troubleshooting

**Data not loading?**
- Check your internet connection
- Make sure you're not blocking API requests
- Open browser console (F12) to see error messages

**Charts not showing?**
- Ensure Chart.js CDN is loading (check internet connection)
- Clear browser cache and refresh

## 📝 Project Structure

```
CitiQ/
│
├── index.html              # Main HTML file with structure
├── style.css               # All styling and responsive design
│
├── js/                     # JavaScript modules (divided for team work)
│   ├── config.js          # Configuration & global variables
│   ├── api.js             # API calls & data fetching
│   ├── charts.js          # Charts, maps & visualization
│   └── ui.js              # UI updates & event handlers
│
└── README.md               # Project documentation
```

## 🎓 Learning Points

This project demonstrates:
- API integration and data fetching
- Asynchronous JavaScript (async/await)
- DOM manipulation
- Data visualization with Chart.js
- Responsive web design
- Error handling
- Modern CSS (flexbox, grid, animations)

## 📄 License

Free to use for educational purposes.

## 👨‍💻 About CitiQ

CitiQ is a smart city data dashboard that brings real-time urban insights to your fingertips. Monitor weather conditions and air quality for any city worldwide with beautiful, interactive visualizations.
