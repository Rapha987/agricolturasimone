// ===== CONFIGURAZIONE STRIPE =====
// SOSTITUIRE CON LA TUA PUBLISHABLE KEY DI STRIPE
const stripe = Stripe('pk_test_51P...TUACHIAVE...'); // TEST KEY - DA CAMBIARE
const elements = stripe.elements();
let cardElement;

// ===== VARIABILI GLOBALI =====
let currentVehicleType = '';
let selectedPlan = null;
let selectedPaymentMethod = 'card';
let paymentIntentId = null;

// Database veicoli simulato più ricco
const vehicleDatabase = {
  'AB123CD': { type: 'ICE', brand: 'Fiat', model: '500', year: '2020', engine: '1.2 Fire' },
  'EF456GH': { type: 'EV', brand: 'Tesla', model: 'Model 3', year: '2022', battery: '60 kWh' },
  'IJ789KL': { type: 'HYBRID', brand: 'Toyota', model: 'Prius', year: '2021', engine: '1.8 Hybrid' },
  'MN012OP': { type: 'ICE', brand: 'Volkswagen', model: 'Golf', year: '2019', engine: '1.5 TSI' },
  'QR345ST': { type: 'EV', brand: 'BMW', model: 'i4', year: '2023', battery: '83.9 kWh' },
  'UV678WX': { type: 'ICE', brand: 'Mercedes', model: 'Classe A', year: '2020', engine: '1.3 Turbo' },
  'YZ901BC': { type: 'HYBRID', brand: 'Ford', model: 'Kuga', year: '2022', engine: '2.5 Hybrid' }
};

// Piani disponibili con più dettagli
const plansData = [
  { 
    id: 'oil_basic',
    name: 'Oil Basic', 
    type: 'ICE', 
    price: 79, 
    desc: '1 cambio olio / anno',
    features: ['Cambio olio completo', 'Controllo fluidi', 'Report digitale', 'Assistenza base'],
    duration: '12 mesi',
    suitableFor: ['Auto benzina/diesel', 'Fino a 15.000 km/anno']
  },
  { 
    id: 'oil_plus',
    name: 'Oil Plus', 
    type: 'ICE', 
    price: 119, 
    desc: '2 cambi + filtri', 
    highlight: true,
    features: ['2 cambi olio/anno', 'Sostituzione filtri aria/abitacolo', 'Check freni', 'Priority booking', 'Assistenza 24/7'],
    duration: '12 mesi',
    suitableFor: ['Auto benzina/diesel', 'Fino a 30.000 km/anno', 'Auto premium']
  },
  { 
    id: 'full_care',
    name: 'Full Care', 
    type: 'ICE', 
    price: 189, 
    desc: 'Manutenzione completa', 
    features: ['3 cambi olio/anno', 'Tagliando completo', 'Sostituzione pastiglie freni', 'Car rental durante interventi', 'Assistenza VIP'],
    duration: '12 mesi',
    suitableFor: ['Auto high-performance', 'Aziende con flotta', 'Oltre 30.000 km/anno']
  },
  { 
    id: 'ev_essential',
    name: 'EV Essential', 
    type: 'EV', 
    price: 99, 
    desc: 'Manutenzione base EV', 
    ev: true,
    features: ['Controllo sistema batteria', 'Diagnostica sistema di ricarica', 'Check freni rigenerativi', 'Report digitale'],
    duration: '12 mesi',
    suitableFor: ['Auto elettriche', 'Fino a 20.000 km/anno']
  },
  { 
    id: 'ev_care',
    name: 'EV Care', 
    type: 'EV', 
    price: 149, 
    desc: 'Piano completo EV', 
    ev: true,
    highlight: true,
    features: ['Controllo batteria approfondito', 'Sostituzione liquido refrigerante', 'Calibrazione ADAS', 'Priority booking', 'Check-up ricarica rapida'],
    duration: '12 mesi',
    suitableFor: ['Auto elettriche', 'Fino a 40.000 km/anno', 'Auto premium EV']
  },
  { 
    id: 'ev_premium',
    name: 'EV Premium', 
    type: 'EV', 
    price: 229, 
    desc: 'Massima tranquillità EV', 
    ev: true,
    features: ['Tutti i servizi EV Care', 'Controllo sistema di raffreddamento', 'Diagnostica predittiva', 'Assistenza dedicata EV', 'Sostituzione filtri abitacolo', 'Hotline tecnica'],
    duration: '12 mesi',
    suitableFor: ['Auto elettriche premium', 'Aziende con flotta EV', 'Oltre 40.000 km/anno']
  }
];

// ===== FUNZIONE DETECTVEHICLE MIGLIORATA =====
function detectVehicle() {
  const plateInput = document.getElementById('plate');
  const plate = plateInput.value.toUpperCase().replace(/\s/g, '');
  const analyzeBtn = document.getElementById('analyzeBtn');
  
  if (!plate || plate.length < 4) {
    showNotification("⚠️ Inserisci una targa valida", "warning");
    plateInput.focus();
    return;
  }
  
  // Pattern validazione targa italiana (formato AB123CD o AA111AA)
  const platePattern = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$|^[A-Z]{2}[0-9]{5}$/;
  if (!platePattern.test(plate)) {
    showNotification("❌ Formato targa non valido. Usa formato: AB123CD", "warning");
    return;
  }
  
  // Mostra loading
  if (analyzeBtn) {
    analyzeBtn.innerHTML = '<span class="loading"></span> Analisi in corso...';
    analyzeBtn.disabled = true;
  }
  
  // Simula chiamata API con ritardo realistico
  setTimeout(() => {
    let vehicleInfo;
    
    // Cerca nel database
    if (vehicleDatabase[plate]) {
      vehicleInfo = vehicleDatabase[plate];
    } else {
      // Se non trovato, genera dati realistici basati sulla targa
      const types = ['ICE', 'EV', 'HYBRID'];
      const brands = ['Fiat', 'Ford', 'Renault', 'Volkswagen', 'BMW', 'Mercedes'];
      const models = {
        ICE: ['Panda', 'Focus', 'Clio', 'Golf', 'Serie 1', 'Classe A'],
        EV: ['500e', 'Mustang Mach-E', 'Zoe', 'ID.3', 'i3', 'EQA'],
        HYBRID: ['Yaris', 'Kuga', 'Captur', 'Golf GTE', 'Serie 3', 'Classe C']
      };
      
      const type = types[Math.floor(Math.random() * types.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const model = models[type][Math.floor(Math.random() * models[type].length)];
      
      vehicleInfo = {
        type: type,
        brand: brand,
        model: model,
        year: 2018 + Math.floor(Math.random() * 6),
        ...(type === 'EV' ? { battery: `${40 + Math.floor(Math.random() * 40)} kWh` } : { engine: `${1.0 + Math.random() * 1.5}`.substring(0, 3) + 'L' })
      };
    }
    
    currentVehicleType = vehicleInfo.type;
    
    // Aggiorna UI con dettagli del veicolo
    const vehicleTypeElement = document.getElementById('vehicleType');
    const vehicleDetailsElement = document.getElementById('vehicleDetails');
    
    if (vehicleTypeElement) {
      let typeText = '';
      let badgeClass = '';
      
      switch(currentVehicleType) {
        case 'ICE':
          typeText = 'TERMICA (Benzina/Diesel)';
          badgeClass = 'ice-badge';
          break;
        case 'EV':
          typeText = 'ELETTRICA (EV)';
          badgeClass = 'ev-badge';
          break;
        case 'HYBRID':
          typeText = 'IBRIDA';
          badgeClass = 'hybrid-badge';
          break;
      }
      
      vehicleTypeElement.innerHTML = `
        <div class="${badgeClass}">${typeText}</div>
      `;
    }
    
    if (vehicleDetailsElement) {
      vehicleDetailsElement.innerHTML = `
        <div class="vehicle-details">
          <p><strong>${vehicleInfo.brand} ${vehicleInfo.model}</strong> (${vehicleInfo.year})</p>
          <p><small>${vehicleInfo.engine || vehicleInfo.battery || 'Motore standard'}</small></p>
          <p><small>Targa: ${plate}</small></p>
        </div>
      `;
    }
    
    // Mostra risultato con animazione
    const vehicleResult = document.getElementById('vehicleResult');
    if (vehicleResult) {
      vehicleResult.classList.remove('hidden');
      vehicleResult.style.animation = 'slideIn 0.6s ease-out';
      
      // Scroll alla sezione
      setTimeout(() => {
        vehicleResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    
    // Reset bottone
    if (analyzeBtn) {
      analyzeBtn.innerHTML = '<i class="fas fa-bolt"></i> Analizza veicolo';
      analyzeBtn.disabled = false;
    }
    
    // Mostra notifica successo
    showNotification(`✅ Veicolo identificato: ${vehicleInfo.brand} ${vehicleInfo.model}`, "success");
    
  }, 1500); // Simula ritardo rete
}

// ===== FUNZIONE SHOWPLANS MIGLIORATA =====
function showPlans() {
  const vehicleResult = document.getElementById('vehicleResult');
  const plansSection = document.getElementById('plans');
  const plansContainer = document.getElementById('plansContainer');
  
  if (!plansContainer || !plansSection) return;
  
  // Nascondi risultato veicolo
  if (vehicleResult) {
    vehicleResult.classList.add('hidden');
  }
  
  // Determina quali piani mostrare in base al tipo di veicolo
  const planType = currentVehicleType === 'EV' ? 'EV' : 'ICE';
  const filteredPlans = plansData.filter(plan => plan.type === planType);
  
  // Svuota container
  plansContainer.innerHTML = '';
  
  // Popola i piani
  filteredPlans.forEach((plan, index) => {
    const isHighlight = plan.highlight;
    const badgeClass = planType === 'EV' ? 'ev-badge-sm' : 'ice-badge-sm';
    
    const planCard = document.createElement('div');
    planCard.className = `plan-card ${isHighlight ? 'highlight' : ''}`;
    planCard.innerHTML = `
      <div class="plan-badge ${badgeClass}">${plan.type}</div>
      <h3>${plan.name}</h3>
      <p class="plan-description">${plan.desc}</p>
      
      <ul class="plan-features">
        ${plan.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
      </ul>
      
      <div class="plan-suitable">
        <small><i class="fas fa-car"></i> Adatto per: ${plan.suitableFor.join(', ')}</small>
      </div>
      
      <div class="price">${plan.price}€<span>/anno</span></div>
      
      <button class="btn-plan" onclick="selectPlan('${plan.id}', '${plan.name}', ${plan.price})">
        Scegli questo piano
      </button>
      
      <div class="plan-footer">
        <small><i class="fas fa-calendar"></i> Durata: ${plan.duration}</small>
      </div>
    `;
    
    plansContainer.appendChild(planCard);
  });
  
  // Mostra sezione piani con animazione
  plansSection.classList.remove('hidden');
  plansSection.style.animation = 'slideIn 0.6s ease-out';
  
  // Scroll alla sezione
  setTimeout(() => {
    plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);
}

// ===== FUNZIONE SELECTPLAN (NUOVA) =====
function selectPlan(planId, planName, price) {
  selectedPlan = { id: planId, name: planName, price: price };
  
  // Nascondi sezione piani
  document.getElementById('plansSection').classList.add('hidden');
  
  // Mostra sezione pagamento
  const paymentSection = document.getElementById('paymentSection');
  if (paymentSection) {
    paymentSection.classList.remove('hidden');
    paymentSection.style.animation = 'slideIn 0.6s ease-out';
    
    // Aggiorna importo
    const paymentAmount = document.getElementById('paymentAmount');
    if (paymentAmount) {
      paymentAmount.textContent = `${price}€`;
    }
    
    // Inizializza Stripe Elements se non già fatto
    if (!cardElement) {
      initializeStripeElements();
    }
    
    // Seleziona di default carta di credito
    selectPaymentMethod('card');
    
    // Scroll alla sezione pagamento
    setTimeout(() => {
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }
  
  // Mostra notifica
  showNotification(`🛒 Piano "${planName}" selezionato`, "info");
}

// ===== INIZIALIZZAZIONE STRIPE ELEMENTS =====
function initializeStripeElements() {
  cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: '"Inter", sans-serif',
        '::placeholder': {
          color: '#a0a0a0',
        },
        ':-webkit-autofill': {
          color: '#ffffff',
        },
      },
      invalid: {
        color: '#ff5555',
        iconColor: '#ff5555',
      },
    },
    hidePostalCode: true,
  });
  
  cardElement.mount('#card-element');
  
  // Gestione errori in tempo reale
  cardElement.on('change', (event) => {
    const displayError = document.getElementById('card-errors');
    if (displayError) {
      if (event.error) {
        displayError.textContent = event.error.message;
        displayError.style.display = 'block';
      } else {
        displayError.textContent = '';
        displayError.style.display = 'none';
      }
    }
  });
  
  // Gestione focus per styling
  cardElement.on('focus', () => {
    const cardElementDiv = document.getElementById('card-element');
    if (cardElementDiv) {
      cardElementDiv.classList.add('focused');
    }
  });
  
  cardElement.on('blur', () => {
    const cardElementDiv = document.getElementById('card-element');
    if (cardElementDiv) {
      cardElementDiv.classList.remove('focused');
    }
  });
}

// ===== SELEZIONE METODO DI PAGAMENTO =====
function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  
  // Rimuovi classe selected da tutti i metodi
  const methods = ['card', 'paypal', 'apple', 'google'];
  methods.forEach(m => {
    const methodElement = document.getElementById(`${m}Method`);
    const buttonElement = document.getElementById(`${m === 'card' ? 'cardForm' : m + 'Button'}`);
    
    if (methodElement) methodElement.classList.remove('selected');
    if (buttonElement) buttonElement.classList.add('hidden');
  });
  
  // Aggiungi selected al metodo scelto
  const selectedMethodElement = document.getElementById(`${method}Method`);
  const selectedButtonElement = document.getElementById(`${method === 'card' ? 'cardForm' : method + 'Button'}`);
  
  if (selectedMethodElement) selectedMethodElement.classList.add('selected');
  if (selectedButtonElement) selectedButtonElement.classList.remove('hidden');
  
  // Se è carta, assicurati che Stripe Elements sia visibile
  if (method === 'card' && cardElement) {
    setTimeout(() => {
      cardElement.update({ style: { base: { fontSize: '16px' } } });
    }, 100);
  }
}

// ===== PROCESSO PAGAMENTO PRINCIPALE =====
async function processPayment() {
  if (!selectedPlan) {
    showNotification("❌ Nessun piano selezionato", "warning");
    return;
  }
  
  const payButton = document.getElementById('payButton');
  const cardholderNameInput = document.getElementById('cardholder-name');
  const emailInput = document.getElementById('email');
  
  if (!cardholderNameInput || !emailInput) return;
  
  const cardholderName = cardholderNameInput.value.trim();
  const email = emailInput.value.trim();
  
  // Validazione
  if (!cardholderName || cardholderName.length < 3) {
    showNotification("❌ Inserisci il nome dell'intestatario della carta", "warning");
    cardholderNameInput.focus();
    return;
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification("❌ Inserisci un indirizzo email valido", "warning");
    emailInput.focus();
    return;
  }
  
  // Mostra loading
  if (payButton) {
    payButton.innerHTML = '<span class="loading"></span> Elaborazione pagamento...';
    payButton.disabled = true;
  }
  
  try {
    // 1. CREA PAYMENT INTENT (Chiamata al backend)
    // NOTA: In produzione, sostituire con chiamata al tuo server
    const amount = selectedPlan.price * 100; // Stripe usa centesimi
    
    // Simulazione chiamata API (sostituire con fetch reale)
    const paymentIntent = await simulateCreatePaymentIntent(amount, email);
    
    if (!paymentIntent.clientSecret) {
      throw new Error('Errore nella creazione del pagamento');
    }
    
    // 2. CONFERMA PAGAMENTO CON STRIPE
    const { paymentIntent: confirmedPayment, error } = await stripe.confirmCardPayment(
      paymentIntent.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
            email: email,
            address: {
              country: 'IT'
            }
          }
        },
        receipt_email: email
      }
    );
    
    if (error) {
      throw new Error(error.message);
    }
    
    // 3. PAGAMENTO RIUSCITO
    paymentIntentId = confirmedPayment.id;
    
    // Registra la transazione (simulato)
    await simulateSaveTransaction(confirmedPayment, selectedPlan, email);
    
    // Mostra conferma
    showConfirmation(confirmedPayment, email);
    
  } catch (error) {
    console.error('Errore pagamento:', error);
    
    // Mostra errore specifico
    let errorMessage = 'Errore nel pagamento';
    if (error.message.includes('card_declined')) {
      errorMessage = 'Carta rifiutata. Controlla i dati o usa un altro metodo di pagamento.';
    } else if (error.message.includes('insufficient_funds')) {
      errorMessage = 'Fondi insufficienti sulla carta.';
    } else if (error.message.includes('expired_card')) {
      errorMessage = 'Carta scaduta. Usa un\'altra carta.';
    } else {
      errorMessage = error.message || 'Errore nel pagamento. Riprova più tardi.';
    }
    
    showNotification(`❌ ${errorMessage}`, "warning");
    
    // Reset bottone
    if (payButton) {
      payButton.innerHTML = '<i class="fas fa-lock"></i> Paga ora';
      payButton.disabled = false;
    }
  }
}

// ===== METODI DI PAGAMENTO ALTERNATIVI =====
function processPayPal() {
  showNotification("🔄 Reindirizzamento a PayPal...", "info");
  
  // Simula pagamento PayPal (in produzione useresti PayPal SDK)
  setTimeout(async () => {
    paymentIntentId = 'PAYPAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Simula salvataggio transazione
    await simulateSaveTransaction(
      { id: paymentIntentId, amount: selectedPlan.price * 100, status: 'succeeded' },
      selectedPlan,
      'paypal@payment.com'
    );
    
    showConfirmation(
      { id: paymentIntentId, amount: selectedPlan.price * 100 },
      'paypal@payment.com'
    );
  }, 2000);
}

function processApplePay() {
  if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
    showNotification("❌ Apple Pay non disponibile su questo dispositivo", "warning");
    return;
  }
  
  showNotification("🍎 Avvio Apple Pay...", "info");
  
  // Simula Apple Pay
  setTimeout(async () => {
    paymentIntentId = 'APPLEPAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    await simulateSaveTransaction(
      { id: paymentIntentId, amount: selectedPlan.price * 100, status: 'succeeded' },
      selectedPlan,
      'applepay@payment.com'
    );
    
    showConfirmation(
      { id: paymentIntentId, amount: selectedPlan.price * 100 },
      'applepay@payment.com'
    );
  }, 2000);
}

function processGooglePay() {
  if (!window.PaymentRequest) {
    showNotification("❌ Google Pay non disponibile su questo dispositivo", "warning");
    return;
  }
  
  showNotification("🤖 Avvio Google Pay...", "info");
  
  // Simula Google Pay
  setTimeout(async () => {
    paymentIntentId = 'GOOGLEPAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    await simulateSaveTransaction(
      { id: paymentIntentId, amount: selectedPlan.price * 100, status: 'succeeded' },
      selectedPlan,
      'googlepay@payment.com'
    );
    
    showConfirmation(
      { id: paymentIntentId, amount: selectedPlan.price * 100 },
      'googlepay@payment.com'
    );
  }, 2000);
}

// ===== MOSTRA CONFERMA =====
function showConfirmation(paymentData, email) {
  const confirmationSection = document.getElementById('confirmation');
  const paymentSection = document.getElementById('paymentSection');
  
  if (!confirmationSection) return;
  
  // Nascondi sezione pagamento
  if (paymentSection) {
    paymentSection.classList.add('hidden');
  }
  
  // Aggiorna dettagli conferma
  const summaryElement = document.getElementById('summary');
  const transactionIdElement = document.getElementById('transactionId');
  
  if (summaryElement) {
    summaryElement.innerHTML = `
      <div class="confirmation-details">
        <h4>✅ Pagamento Confermato</h4>
        <p><strong>Piano:</strong> ${selectedPlan.name}</p>
        <p><strong>Importo:</strong> ${selectedPlan.price}€</p>
        <p><strong>Metodo:</strong> ${selectedPaymentMethod.toUpperCase()}</p>
        <p><strong>Email ricevuta:</strong> ${email || 'paypal@payment.com'}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('it-IT', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    `;
  }
  
  if (transactionIdElement && paymentData) {
    transactionIdElement.textContent = paymentData.id || paymentIntentId;
  }
  
  // Mostra sezione conferma
  confirmationSection.classList.remove('hidden');
  confirmationSection.style.animation = 'slideIn 0.6s ease-out';
  
  // Scroll alla conferma
  setTimeout(() => {
    confirmationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);
  
  // Invia email conferma (simulato)
  simulateSendConfirmationEmail(email, selectedPlan, paymentData);
  
  // Mostra notifica successo
  showNotification(`🎉 Pagamento completato! Riceverai una email di conferma.`, "success");
}

// ===== RESET FLOW =====
function resetFlow() {
  // Nascondi tutte le sezioni tranne input
  const sections = ['vehicleResult', 'plansSection', 'paymentSection', 'confirmation'];
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('hidden');
  });
  
  // Reset form
  const plateInput = document.getElementById('plate');
  const cardholderInput = document.getElementById('cardholder-name');
  const emailInput = document.getElementById('email');
  
  if (plateInput) plateInput.value = '';
  if (cardholderInput) cardholderInput.value = '';
  if (emailInput) emailInput.value = '';
  
  // Reset Stripe Elements
  if (cardElement) {
    cardElement.unmount();
    cardElement = null;
  }
  
  // Reset variabili
  selectedPlan = null;
  selectedPaymentMethod = 'card';
  paymentIntentId = null;
  currentVehicleType = '';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Mostra notifica
  showNotification("🔄 Flusso resettato. Puoi analizzare un nuovo veicolo.", "info");
}

// ===== FUNZIONI AUSILIARIE =====
function showNotification(message, type = 'info') {
  // Crea elemento notifica
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Stile notifica
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? 'rgba(0, 204, 136, 0.9)' : type === 'warning' ? 'rgba(255, 170, 0, 0.9)' : 'rgba(79, 209, 255, 0.9)'};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    max-width: 400px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  `;
  
  // Aggiungi al body
  document.body.appendChild(notification);
  
  // Rimuovi dopo 5 secondi
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// ===== SIMULAZIONI API (SOSTITUIRE CON CHIAMATE REALI) =====
async function simulateCreatePaymentIntent(amount, email) {
  // In produzione, sostituire con:
  // const response = await fetch('https://tuo-backend.com/create-payment-intent', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ amount, email, plan: selectedPlan.id })
  // });
  // return await response.json();
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 16)}`,
        id: `pi_${Date.now()}`,
        amount: amount,
        status: 'requires_confirmation'
      });
    }, 1000);
  });
}

async function simulateSaveTransaction(paymentData, plan, email) {
  // Simula salvataggio nel database
  console.log('Transazione salvata:', {
    transactionId: paymentData.id,
    plan: plan.name,
    amount: plan.price,
    email: email,
    timestamp: new Date().toISOString(),
    status: 'completed'
  });
  
  return Promise.resolve();
}

async function simulateSendConfirmationEmail(email, plan, paymentData) {
  // Simula invio email
  console.log('Email inviata a:', email, 'con dettagli piano:', plan.name);
  
  return Promise.resolve();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Setup tasto Enter per analisi targa
  const plateInput = document.getElementById('plate');
  if (plateInput) {
    plateInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') detectVehicle();
    });
    
    // Formatta targa in uppercase automaticamente
    plateInput.addEventListener('input', function(e) {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
  }
  
  // Setup validazione email in tempo reale
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      const email = this.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.style.borderColor = '#ff5555';
      } else {
        this.style.borderColor = '';
      }
    });
  }
  
  // Aggiungi pulsante analyzeBtn se non esiste
  if (!document.getElementById('analyzeBtn')) {
    const plateInput = document.getElementById('plate');
    if (plateInput && plateInput.parentNode) {
      const analyzeBtn = document.createElement('button');
      analyzeBtn.id = 'analyzeBtn';
      analyzeBtn.className = 'btn-primary';
      analyzeBtn.innerHTML = '<i class="fas fa-bolt"></i> Analizza veicolo';
      analyzeBtn.onclick = detectVehicle;
      plateInput.parentNode.appendChild(analyzeBtn);
    }
  }
  
  // Inizializza tooltip se necessario
  initializeTooltips();
});

function initializeTooltips() {
  // Aggiungi tooltip ai prezzi
  const prices = document.querySelectorAll('.price');
  prices.forEach(price => {
    price.title = "Importo annuale, IVA inclusa";
  });
}

// ===== EXPORT FUNCTIONS (per uso globale) =====
window.detectVehicle = detectVehicle;
window.showPlans = showPlans;
window.selectPlan = selectPlan;
window.selectPaymentMethod = selectPaymentMethod;
window.processPayment = processPayment;
window.processPayPal = processPayPal;
window.processApplePay = processApplePay;
window.processGooglePay = processGooglePay;
window.showConfirmation = showConfirmation;
window.resetFlow = resetFlow;
window.showNotification = showNotification;
