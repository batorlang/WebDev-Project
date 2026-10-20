//html elements
const searchInput = document.getElementById("search_input");
const searchButton = document.getElementById("search_button");
const resultsList = document.getElementById("results");
const nowSection = document.getElementById("now");
const gpsButton = document.getElementById("gps_button");

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
        "<h2>" + place.name + "<h2>" + "<p>" + data.current.temperature_2m + " °C</p>" + "<p>" + data.current.wind_speed_10m + " km/h<p>";

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


//button functionalities
searchButton.addEventListener('click' , citySearch);
gpsButton.addEventListener('click', useGPS);
