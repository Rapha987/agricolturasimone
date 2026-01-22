let vehicleTypeDetected = '';

function detectVehicle() {
  const plate = document.getElementById('plate').value;
  if (!plate) return alert("Inserisci una targa");

  // SIMULAZIONE (poi API)
  vehicleTypeDetected = Math.random() > 0.5 ? 'ICE / IBRIDA' : 'EV';

  document.getElementById('vehicleType').innerText =
    "Tipo veicolo: " + vehicleTypeDetected;

  document.getElementById('vehicleResult').classList.remove('hidden');
}

function showPlans() {
  document.getElementById('plans').classList.remove('hidden');
}

function subscribe(plan) {
  document.getElementById('plans').classList.add('hidden');
  document.getElementById('confirmation').classList.remove('hidden');

  document.getElementById('summary').innerText =
    `Hai attivato il piano: ${plan}`;
}
