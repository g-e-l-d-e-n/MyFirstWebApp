// Sample farmers. Lat/lon come from the town list or the town search.
const farmers = [
  { name: "Tendai Moyo", crop: "Maize", town: "Bindura", lat: -17.30, lon: 31.33, size: 12, water: "Rain-fed" },
  { name: "Rudo Chikwanha", crop: "Tobacco", town: "Mutare", lat: -18.97, lon: 32.67, size: 8.5, water: "Irrigated" },
  { name: "Farai Ncube", crop: "Cotton", town: "Gweru", lat: -19.45, lon: 29.82, size: 20, water: "Rain-fed" }
];

// Open-Meteo forecast endpoint. Cached so each place is only requested once.
const temperatureCache = {};

function getTemperature(lat, lon) {
  const key = lat + "," + lon;
  if (!temperatureCache[key]) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
                "&longitude=" + lon + "&current=temperature_2m";
    temperatureCache[key] = fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then(function (data) {
        return data.current.temperature_2m + " " + data.current_units.temperature_2m;
      });
  }
  return temperatureCache[key];
}

function addRow(farmer, animate) {
  const list = document.getElementById("farmer-list");
  const row = document.createElement("tr");

  [farmer.name, farmer.crop, farmer.town, farmer.size, farmer.water].forEach(function (value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });

  const tempCell = document.createElement("td");
  tempCell.textContent = "Loading...";
  row.appendChild(tempCell);
  list.appendChild(row);

  if (animate) { $(row).hide().fadeIn(400); }

  getTemperature(farmer.lat, farmer.lon)
    .then(function (text) { tempCell.textContent = text; })
    .catch(function () { tempCell.textContent = "Weather unavailable"; });
}

function showMessage(text, isError) {
  const message = document.getElementById("message");
  message.textContent = text;
  message.className = isError ? "error" : "";
}

function renderFarmers() {
  document.getElementById("farmer-list").innerHTML = "";
  farmers.forEach(function (farmer) { addRow(farmer, false); });
}

// Open-Meteo geocoding endpoint: search results fill the town select list.
document.getElementById("find-town").addEventListener("click", function () {
  const search = document.getElementById("town-search");
  const select = document.getElementById("farmer-town");
  const button = this;
  const term = search.value.trim();

  if (term.length < 2) {
    showMessage("Type at least two letters to search for a town.", true);
    search.focus();
    return;
  }

  button.disabled = true;
  showMessage("Searching for " + term + "...", false);

  fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(term) +
        "&count=10&language=en&format=json&countryCode=ZW")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed");
      return response.json();
    })
    .then(function (data) {
      const results = data.results || [];
      if (results.length === 0) {
        showMessage("No towns found for " + term + ".", true);
        return;
      }
      select.innerHTML = "";
      results.forEach(function (place) {
        const option = document.createElement("option");
        option.textContent = place.name + (place.admin1 ? ", " + place.admin1 : "");
        option.dataset.lat = place.latitude;
        option.dataset.lon = place.longitude;
        option.dataset.name = place.name;
        select.appendChild(option);
      });
      showMessage(results.length + " town(s) found. Choose one from the list.", false);
      select.focus();
    })
    .catch(function () { showMessage("Town search is unavailable. Pick from the current list.", true); })
    .then(function () { button.disabled = false; });
});

// Form submit: the browser checks required, min, max, minlength and type first.
document.getElementById("farmer-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!form.checkValidity()) {
    form.reportValidity();
    showMessage("Check the highlighted fields and try again.", true);
    return;
  }

  const option = document.getElementById("farmer-town").selectedOptions[0];
  const farmer = {
    name: document.getElementById("farmer-name").value.trim(),
    crop: document.getElementById("farmer-crop").value.trim(),
    town: option.dataset.name || option.textContent,
    lat: option.dataset.lat,
    lon: option.dataset.lon,
    size: document.getElementById("farm-size").value,
    water: form.elements.water.value
  };

  farmers.push(farmer);
  addRow(farmer, true);
  form.reset();
  document.getElementById("farmer-name").focus();
  showMessage(farmer.name + " added to the list.", false);
});

// World Bank endpoint (second provider): share of land used for agriculture.
function loadContext() {
  const text = document.getElementById("context-text");
  fetch("https://api.worldbank.org/v2/country/ZW/indicator/AG.LND.AGRI.ZS?format=json&mrnev=1")
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed");
      return response.json();
    })
    .then(function (data) {
      const item = data[1][0];
      text.textContent = Number(item.value).toFixed(1) + "% of Zimbabwe's land area was agricultural land in " +
                         item.date + " (World Bank).";
    })
    .catch(function () { text.textContent = "National land figures are unavailable right now."; });
}

renderFarmers();
loadContext();

// jQuery: show or hide the farmer table
$(function () {
  $("#toggle-list").on("click", function () {
    const button = $(this);
    const isOpen = button.attr("aria-expanded") === "true";
    $("#table-wrap").slideToggle();
    button.attr("aria-expanded", !isOpen).text(isOpen ? "Show farmers" : "Hide farmers");
  });
});
