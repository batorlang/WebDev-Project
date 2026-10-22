//html elements
const searchInput = document.getElementById("search_input");
const searchButton = document.getElementById("search_button");
const resultsList = document.getElementById("results");
const nowSection = document.getElementById("now");
const gpsButton = document.getElementById("gps_button");
const unitSelector = document.getElementById("units");
const hourlySec = document.getElementById("hourly");
const dailySec = document.getElementById("daily");
const favSelector = document.getElementById("favorites");
const favButton = document.getElementById("add_favorite");
const compSec = document.getElementById("compare");

//global variables
let currentCelsius = null;
let currentWind = null;
let currentName = "";
let hTimes = [];
let hCelsius = [];
let dDates = [];
let dMax = [];
let dMin = [];
let currentWCode = 0;
let dWCodes = [];
let hWCodes = [];
let currentPlace = null;
let favs = [];
let metCelsius = [];
let utcTime = 0;
let chart = null;
let isDay = 1;
const OWM_KEY = ""; //Paste Open Weather API Key here
let owmCelsius = [];




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

    const place = data.results[0];
    weatherDisplay(place);

}

async function weatherDisplay(place) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude + "&current=temperature_2m,wind_speed_10m,weather_code,is_day&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto";
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
    currentPlace = place; //This is needed to save the currently displayed place, so saving iot is easier. By saving the place object, also the gps set place can be saved, with the rigth coordinates.

    nowSection.innerHTML =
        currentCelsius = data.current.temperature_2m;
        currentWind = data.current.wind_speed_10m;
        currentName = place.name;
        currentWCode = data.current.weather_code;
        isDay = data.current.is_day;
        utcTime = data.utc_offset_seconds;

        //hourly 
        hTimes = [];
        hCelsius = [];
        hWCodes = []; 
        for (let i = 0; i < data.hourly.time.length; i++) {
            if (data.hourly.time[i] > data.current.time && hTimes.length < 24) {
                hTimes.push(data.hourly.time[i]);
                hCelsius.push(data.hourly.temperature_2m[i]);
                hWCodes.push(data.hourly.weather_code[i]);
            }
        }

        //daily
        dDates = data.daily.time;
        dMax = data.daily.temperature_2m_max;
        dMin = data.daily.temperature_2m_min;
        dWCodes = data.daily.weather_code;
        await loadMetNorway(place);
        await loadOW(place);
        showNow();
        theme();
        showHourly();
        showDaily();
        showComp();
        drawChart();
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
        return celsius + 273.15; //calculation source: https://www.calculatorsoup.com/calculators/conversions/celsius-to-kelvin.php
    }

    return celsius;
}

function showNow() {
    let label = getLabels();

    const temperature = tempConverter(currentCelsius);

    nowSection.innerHTML =
        "<h2>" + currentName + "</h2>" + "<p>" + getWeatherIcon(currentWCode) + temperature.toFixed(1) + " " + label + "</p>" + "<p>Wind: " + currentWind + " km/h</p>";
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
        const time = hTimes[i].slice(11,16);
        const temp = tempConverter(hCelsius[i]);
        hourlyContent += "<div class='hour'>" + time + "<br>" + getWeatherIcon(hWCodes[i]) + temp.toFixed(0) + " " + getLabels() + "</div>";
    }

    hourlySec.innerHTML = hourlyContent;
}


//I needed this function to update the UI every time the temperature units change, so that both the curretn weather section and the hourly section updates at the same time.
function changeUI() {
    showNow();
    showHourly();
    showDaily();
    showComp();
    drawChart();

}

function showDaily() {
    let dailyContent = "";
    for (let i = 0; i < dDates.length; i++) {
        const date = new Date(dDates[i]);
        const dayText = date.toLocaleDateString("en-GB", {weekday: "short"});
        const max = tempConverter(dMax[i]);
        const min = tempConverter(dMin[i]);

        dailyContent += "<div class='day'>" + dayText + getWeatherIcon(dWCodes[i]) + " " + min.toFixed(0) + "/" + max.toFixed(0) + " " + getLabels() + "</div>";
    }

    dailySec.innerHTML = dailyContent;
}

//Emojis have been selected by the WMO interprettion codes.
function getWeatherIcon(code) {
    if (code === 0) return "☀️"; //Clear sky
    if (code === 1) return "🌤️"; //Mainly clear
    if (code === 2) return "🌥️"; //Partly cloudy
    if (code === 3) return "☁️"; //Overcast
    if (code <= 48) return "🌫️"; //Fog
    if (code <= 57) return "🌦️"; //Drizzle or lighter rain
    if (code <= 67) return "🌧️"; //Rain
    if (code <= 77) return "🌨️"; //Snow 
    if (code <= 82) return "☔"; //Heavy rain
    if (code <= 86) return "❄️"; //Snow shovers and freezin cold
    return "⛈️" //Tunderstorm
}

function saveFavs() {
    //localStorage is the default storage of a browser, that survives a page reload, so fav locations can be saved for later use.
    localStorage.setItem("favorites", JSON.stringify(favs));
}

function loadFavs() {
    const saved = localStorage.getItem("favorites");
    if (saved != null) { //bugfix: needed a null check for the favs array
        favs = JSON.parse(saved);
    }
}

function showFavs() {
    let options = "<option value=''>Favorites</option>";
    for (let option = 0; option < favs.length; option++) {
        options += "<option value='" + option + "'>" + favs[option].name + "</option>";
    }
    favSelector.innerHTML = options;
}

function addFavs() {
    if (currentPlace === null) return; //bugfix: nothing is on the screen
    for (let i = 0; i < favs.length; i++) {
        if (favs[i].name === currentPlace.name) return;
    }
    favs.push({
        name: currentPlace.name,
        latitude: currentPlace.latitude,
        longitude: currentPlace.longitude
    });
    saveFavs();
    showFavs();
}

function chooseFav() {
    weatherDisplay(favs[favSelector.value]);
}

async function loadMetNorway(place) {
    metCelsius = [];
    //bugfix: Met Norway API rejects coordinates over 4 decimals, toFixed had to be used
    const url = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=" + place.latitude.toFixed(4) + "&lon=" + place.longitude.toFixed(4);
    const res = await fetch(url);
    const data = await res.json();
    const series = data.properties.timeseries;
    console.log(data);
    console.log(series);

    //I need this lookup, to get hourly temperature, but MET Norway uses utc time intead of regional timezones
    //I have used Claude's assistance in this function
    const lookup = {};
    for (let i = 0; i < series.length; i++) {
        const period = Date.parse(series[i].time);
        lookup[period] = series[i].data.instant.details.air_temperature;
    }
    for (let i = 0; i < hTimes.length; i++) {
        const period = Date.parse(hTimes[i] + "Z") - utcTime * 1000;
        if (lookup[period] != undefined) {
            metCelsius.push(lookup[period]);
        } else {
            metCelsius.push(null);
        }
    }

}

function showComp() {
    let content = "";
    for (let i = 0; i < hTimes.length; i++) {
        const omTemp = tempConverter(hCelsius[i]);
        let metText = "no data arrived";
        let owmText = "no data arrived";
        if (metCelsius[i] != null) {
            metText = tempConverter(metCelsius[i]).toFixed(1) + " " + getLabels();
        }
        if (owmCelsius[i] != null) {
            owmText = tempConverter(owmCelsius[i]).toFixed(1) + " " + getLabels();
        }
        content += "<div>" + hTimes[i] + " Open-Meteo: " + omTemp.toFixed(1) + " " + getLabels() + " MET Norway: " + metText + " OpenWeatherMap: " + owmText + "</div>";
    }
    compSec.innerHTML = content;
}

function drawChart() {
    const labels = [];
    const omData = [];
    const metData = [];
    const owmData = [];

    for (let i = 0; i < hTimes.length; i++) {
        labels.push(hTimes[i].slice(11, 16));
        omData.push(tempConverter(hCelsius[i]).toFixed(1));
        if (metCelsius[i] != null) {
            metData.push(tempConverter(metCelsius[i]).toFixed(1));
        } else {
            metData.push(omData[i]);
        }

        if (owmCelsius[i] != null) {
            owmData.push(tempConverter(owmCelsius[i]).toFixed(1));
        } else {
            owmData.push(omData[i]);
        }
    }

    const datasets = [{name: "Open-Meteo", values: omData}];
    if (metCelsius.length > 0) {
        datasets.push({name: "MET Norway", values: metData});
    }
    if (owmCelsius.length > 0) {
        datasets.push({name: "OpenWeatherMap", values: owmData});
    }
    
    document.getElementById("chart").innerHTML = "";
    chart = new frappe.Chart("#chart", {
        title: "Temperature in the next 24 hours (" + getLabels() + ")",
        data: {
            labels: labels,
            datasets: datasets
        },
        type: "line",
        colors: ["green", "red", "purple"],
        axisOptions: {xIsSeries: true},
        lineOptions: {hideDots: 0}
    });
}
function theme() {
    let hue = 220 - (currentCelsius+20) / 60*220;
    if (hue < 0) hue = 0;
    if (hue > 220) hue = 220;
    let saturation = 40;
    if (currentWCode <= 1) saturation = 70;
    let color1, color2;
    if (isDay === 1) {
        color1 = "hsl(" + hue + ", " + saturation + "%, 55%)";
        color2 = "hsl(" + (hue + 30) + ", " + saturation + "%, 35%)";
    } else {
        color1 = "hsl(" + hue + ", 40%, 18%)";
        color2 = "hsl(" + hue + ", 50%, 8%)";
    }
    document.body.style.setProperty("--background1", color1);
    document.body.style.setProperty("--background2", color2);
}

async function loadOW(place) {
    owmCelsius = [];
    const url = "https://api.openweathermap.org/data/2.5/forecast?lat=" + place.latitude + "&lon=" + place.longitude + "&units=metric&appid=" + OWM_KEY;
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
    const lookup = {};
    //Looks like the same lookup as in the MET Norway load
    for (let i = 0; i < data.list.length; i++) {
        const time = data.list[i].dt * 1000;
        lookup[time] = data.list[i].main.temp;
    }
    for (let i = 0; i < hTimes.length; i++) {
        const hour = Date.parse(hTimes[i]+"Z") - utcTime*1000;
        let found = null;
        for (let j = 0; j <= 2; j++) {
            const guess = hour - j*60*60*1000; //This is supposed to be going backwards in time one hour at an iteration to find the right time
            if (lookup[guess] !== undefined) {
                found = lookup[guess];
                break;
            }
        }
        owmCelsius.push(found);
    }
}


loadFavs();
showFavs();

//button functionalities
searchButton.addEventListener('click' , citySearch);
gpsButton.addEventListener('click', useGPS);
unitSelector.addEventListener('change', changeUI);
favButton.addEventListener('click', addFavs);
favSelector.addEventListener('change', chooseFav);
