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
    currentWeatherDisplay(place);

}

async function currentWeatherDisplay(place) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude + "&current=temperature_2m,wind_speed_10m";
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);

    nowSection.innerHTML =
        currentCelsius = data.current.temperature_2m;
        currentWind = data.current.wind_speed_10m;
        currentName = place.name;
        showNow();
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
    currentWeatherDisplay(place);
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
    if (currentCelsius === null) return;
    let label = "°C";
    if (unitSelector.value === "K") {
        label = "K";
    }
    if (unitSelector.value === "F") {
        label = "°F";
    }

    const temperature = tempConverter(currentCelsius);

    nowSection.innerHTML =
        "<h2>" + currentName + "</h2>" + "<p>" + temperature.toFixed(1) + " " + label + "</p>" + "<p>Wind: " + currentWind + " km/h</p>";
}


//button functionalities
searchButton.addEventListener('click' , citySearch);
gpsButton.addEventListener('click', useGPS);
unitSelector.addEventListener('change', showNow);
