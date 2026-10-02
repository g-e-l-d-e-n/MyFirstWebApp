// Sample farmers. Replace these with your own data.
const farmers = [
  { name: "Tendai Moyo", crop: "Maize", town: "Bindura" },
  { name: "Rudo Chikwanha", crop: "Tobacco", town: "Mutare" },
  { name: "Farai Ncube", crop: "Cotton", town: "Gweru" }
];

// Latitude and longitude for each town, used by the weather API.
const towns = {
  Harare:   { lat: -17.83, lon: 31.05 },
  Bulawayo: { lat: -20.15, lon: 28.58 },
  Mutare:   { lat: -18.97, lon: 32.67 },
  Masvingo: { lat: -20.07, lon: 30.83 },
  Bindura:  { lat: -17.30, lon: 31.33 },
  Gweru:    { lat: -19.45, lon: 29.82 }
};

// Remember each town's temperature so we only ask the API once per town.
const temperatureCache = {};

function getTemperature(town) {
  if (!temperatureCache[town]) {
    const place = towns[town];
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.lat +
                "&longitude=" + place.lon + "&current=temperature_2m";

    temperatureCache[town] = fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then(function (data) {
        return data.current.temperature_2m + " " + data.current_units.temperature_2m;
      });
  }
  return temperatureCache[town];
}

function addRow(farmer) {
  const list = document.getElementById("farmer-list");
  const row = document.createElement("tr");

  [farmer.name, farmer.crop, farmer.town].forEach(function (value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });

  const tempCell = document.createElement("td");
  tempCell.textContent = "Loading...";
  row.appendChild(tempCell);
  list.appendChild(row);

  getTemperature(farmer.town)
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
  farmers.forEach(addRow);
}

document.getElementById("add-btn").addEventListener("click", function () {
  const nameInput = document.getElementById("farmer-name");
  const cropInput = document.getElementById("farmer-crop");
  const town = document.getElementById("farmer-town").value;

  const name = nameInput.value.trim();
  const crop = cropInput.value.trim();

  if (name === "" || crop === "") {
    showMessage("Enter a name and a main crop first.", true);
    return;
  }

  const farmer = { name: name, crop: crop, town: town };
  farmers.push(farmer);
  addRow(farmer);

  nameInput.value = "";
  cropInput.value = "";
  nameInput.focus();
  showMessage(name + " added to the list.", false);
});

renderFarmers();
