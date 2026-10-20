//html elements
const searchInput = document.getElementById("search_input");
const searchButton = document.getElementById("search_button");
const resultsList = document.getElementById("results");
const nowSection = document.getElementById("now");
const gpsButton = document.getElementById("gps_button");
const unitSelector = document.getElementById("units");
let currentCelsius = null;
let currentWind = null;
let currentName = "";
const hourlySec = document.getElementById("hourly");
let hTimes = [];
let hCelsius = [];
const dailySec = document.getElementById("daily");
let dDates = [];
let dMax = [];
let dMin = [];




//functions
async function citySearch() {
    const name = searchInput.value.trim();
    if (name === "") return; //empty input handled.
    const url = "https://geocoding-api.open-meteo.com/v1/search?name=" + name + "&count=5";
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    //bugfix: old results had to be cleared before putting the new data into the display list
    resultsList.innerHTML = "";

    if (!data.results) {
        resultsList.innerHTML = "<li>City not found</li>";
        return;
    }

    const place = data.results[0]; //This is the best match for the city search
    weatherDisplay(place);

}

async function weatherDisplay(place) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude + "&current=temperature_2m,wind_speed_10m&hourly=temperature_2m&timezone=auto&daily=temperature_2m_max,temperature_2m_min";
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);

    nowSection.innerHTML =
        currentCelsius = data.current.temperature_2m;
        currentWind = data.current.wind_speed_10m;
        currentName = place.name;

        //hourly 
        hTimes = [];
        hCelsius = [];
        //This loop fills in the two arrays with the timestamps with their temperature data accordingly. 
        for (let i = 0; i < data.hourly.time.length; i++) {
            if (data.hourly.time[i] > data.current.time && hTimes.length < 24) {
                hTimes.push(data.hourly.time[i]);
                hCelsius.push(data.hourly.temperature_2m[i]);
            }
        }

        //daily
        dDates = data.daily.time;
        dMax = data.daily.temperature_2m_max;
        dMin = data.daily.temperature_2m_min;
        showNow();
        showHourly();
        showDaily();
}

function useGPS() {
    navigator.geolocation.getCurrentPosition(successfulGPS, errorGPS); //This line is the built in geolocation API.
}

function errorGPS() {
    nowSection.innerHTML = "<p>Could not get your location. Please give permission to browser accessing your location for this function.</p>";
}

function successfulGPS(position) {
    const place = {
        name: "My Location: reverse geolocation reading soon to be added" /*+ position.name*/,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
    weatherDisplay(place);
}

function tempConverter(celsius) {
    const unit = unitSelector.value;
    if (unit === "F") {
        return celsius * 9/5 + 32; //calculation is according to this site: https://www.calculatorsoup.com/calculators/conversions/celsius-to-fahrenheit.php
    }

    if (unit ==="K") {
        return celsius + 273,15; //calculation source: https://www.calculatorsoup.com/calculators/conversions/celsius-to-kelvin.php
    }

    return celsius; //Base case where the temperature is Celsius by default.
}

function showNow() {
    let label = getLabels();

    const temperature = tempConverter(currentCelsius);

    nowSection.innerHTML =
        "<h2>" + currentName + "</h2>" + "<p>" + temperature.toFixed(1) + " " + label + "</p>" + "<p>Wind: " + currentWind + " km/h</p>";
}

function getLabels() {
    if (unitSelector.value === "F") {
        return "°F";
    }
    if (unitSelector.value === "K") {
        return "K";
    }
    return "°C";
}

function showHourly() {
    let hourlyContent = "";
    for (let i = 0; i < hTimes.length; i++) {
        const time = hTimes[i];
        const temp = tempConverter(hCelsius[i]);
        hourlyContent += "<div class='hour'>" + time + "<br>" + temp.toFixed(0) + " " + getLabels() + "</div>";
    }

    hourlySec.innerHTML = hourlyContent;
}


//I needed this function to update the UI every time the temperature units change, so that both the curretn weather section and the hourly section updates at the same time.
function changeUI() {
    showNow();
    showHourly();
    showDaily();

}

function showDaily() {
    let dailyContent = "";
    for (let i = 0; i < dDates.length; i++) {
        const date = new Date(dDates[i]);
        const dayText = date.toLocaleDateString("en-GB", {weekday: "short"});
        const max = tempConverter(dMax[i]);
        const min = tempConverter(dMin[i]);

        dailyContent += "<div class='day'>" + dayText + " " + min.toFixed(0) + "/" + max.toFixed(0) + " " + getLabels() + "</div>";
    }

    dailySec.innerHTML = dailyContent;
}


//button functionalities
searchButton.addEventListener('click' , citySearch);
gpsButton.addEventListener('click', useGPS);
unitSelector.addEventListener('change', changeUI);
