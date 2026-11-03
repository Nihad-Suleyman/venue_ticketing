"use strict";

// The venue model is the source of seat identity, price and availability.
const venue = {
  name: "Aurora Hall",
  sections: [
    { id: "vip", name: "VIP", price: 120, rows: 3, seatsPerRow: 12 },
    { id: "premium", name: "Premium", price: 80, rows: 5, seatsPerRow: 14 },
    { id: "standard", name: "Standard", price: 45, rows: 7, seatsPerRow: 16 }
  ]
};

function createSeats() {
  const seats = [];
  let rowIndex = 0;
  for (const section of venue.sections) {
    for (let row = 1; row <= section.rows; row++) {
      const rowLetters = "ABCDEFGHIJKLMNO";
      const rowLabel = rowLetters[rowIndex];
      for (let number = 1; number <= section.seatsPerRow; number++) {
        const id = `${rowLabel}${number}`;
        seats.push({
          id, row: rowLabel, number,
          sectionId: section.id,
          section: section.name,
          price: section.price,
          // A few reserved seats demonstrate the unavailable state.
          unavailable: (rowIndex * 11 + number * 7) % 29 === 0
        });
      }
      rowIndex++;
    }
  }
  return seats;
}

const seats = createSeats();
const seatMap = document.getElementById("seat-map");
const seatButtons = {};

function renderSeats() {
  seatMap.textContent = "";
  let previousRow = "";
  let rowElement;
  for (const seat of seats) {
    if (seat.row !== previousRow) {
      rowElement = document.createElement("div");
      rowElement.className = `seat-row row-${seat.sectionId}`;
      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = seat.row;
      rowElement.appendChild(label);
      seatMap.appendChild(rowElement);
      previousRow = seat.row;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = `seat seat-${seat.sectionId}`;
    button.textContent = seat.number;
    button.title = `${seat.section}, row ${seat.row}, seat ${seat.number} — ${seat.price} AZN`;
    button.setAttribute("aria-label", button.title);
    button.setAttribute("data-seat-id", seat.id);
    if (seat.unavailable) {
      button.disabled = true;
      button.classList.add("seat-unavailable");
      button.title += " (unavailable)";
      button.setAttribute("aria-label", button.title);
    }
    rowElement.appendChild(button);
    seatButtons[seat.id] = button;
    button.addEventListener("click", function() {
      inspectSeat(seat.id);
    });
  }
}

renderSeats();

// Inspection is separate from purchase: clicking a seat never adds a ticket.
let inspectedId = null;
const inspectionContent = document.getElementById("inspection-content");
const addButton = document.getElementById("add-to-cart");
const statusText = document.getElementById("status-text");

function findSeat(id) {
  return seats.find(seat => seat.id === id);
}

function inspectSeat(id) {
  const seat = findSeat(id);
  if (!seat || seat.unavailable) return;
  inspectedId = id;
  updateSeatAppearance();
  inspectionContent.textContent = `${seat.section} · Row ${seat.row}, Seat ${seat.number} · ${seat.price} AZN`;
  addButton.disabled = cart.includes(id);
  statusText.textContent = `Inspecting ${seat.id}. Use Add to cart to reserve it.`;
}

function updateSeatAppearance() {
  for (const id in seatButtons) {
    const button = seatButtons[id];
    button.classList.remove("seat-inspected");
    button.classList.remove("seat-in-cart");
    if (id === inspectedId) button.classList.add("seat-inspected");
    if (cart.includes(id)) button.classList.add("seat-in-cart");
  }
}

// Every seat receives its own click handler when it is created.
// See renderSeats() above.

// The cart contains only seat IDs. Seat details always come from the venue model.
let cart = [];
const cartItems = document.getElementById("cart-items");
const selectedCount = document.getElementById("selected-count");
const totalPrice = document.getElementById("total-price");

function renderCart() {
  cartItems.textContent = "";
  for (const id of cart) {
    const seat = findSeat(id);
    if (!seat) continue;
    const item = document.createElement("li");
    const description = document.createElement("span");
    description.textContent = `${seat.id} · ${seat.section} · ${seat.price} AZN`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-button";
    remove.textContent = "Remove";
    remove.setAttribute("data-remove-id", id);
    remove.setAttribute("aria-label", `Remove seat ${id} from cart`);
    item.appendChild(description);
    item.appendChild(remove);
    remove.addEventListener("click", function() {
      cart = cart.filter(seatId => seatId !== id);
      statusText.textContent = `${id} removed from your cart.`;
      renderCart();
    });
    cartItems.appendChild(item);
  }
  selectedCount.textContent = String(cart.length);
  let total = 0;
  for (const id of cart) {
    const seat = findSeat(id);
    if (seat) total += seat.price;
  }
  totalPrice.textContent = `${total} AZN`;
  updateSeatAppearance();
  if (inspectedId) addButton.disabled = cart.includes(inspectedId);
  saveCart();
}

addButton.addEventListener("click", () => {
  const seat = findSeat(inspectedId);
  if (!seat || seat.unavailable || cart.includes(seat.id)) return;
  cart.push(seat.id);
  statusText.textContent = `${seat.id} added to your cart.`;
  renderCart();
});




// Persist only stable IDs, not a second copy of seat prices or availability.
const STORAGE_KEY = "aurora-hall-cart-v1";

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Cart could not be saved:", error);
  }
}

function restoreCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return;
    cart = [];
    for (const id of stored) {
      const seat = findSeat(id);
      if (seat && !seat.unavailable && !cart.includes(id)) {
        cart.push(id);
      }
    }
  } catch (error) {
    cart = [];
    console.warn("Saved cart was invalid:", error);
  }
  renderCart();
}

// Navigation controls translate and scale the same map element.
const mapCanvas = document.getElementById("map-canvas");
let zoom = 1;
let offsetX = 0;
let offsetY = 0;

function updateMapView() {
  mapCanvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  document.getElementById("zoom-label").textContent = `${Math.round(zoom * 100)}%`;
}

function changeZoom(amount) {
  zoom = Math.max(0.7, Math.min(1.8, Math.round((zoom + amount) * 10) / 10));
  updateMapView();
}

function moveMap(x, y) {
  offsetX = Math.max(-280, Math.min(280, offsetX + x));
  offsetY = Math.max(-280, Math.min(280, offsetY + y));
  updateMapView();
}

function resetMap() {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  updateMapView();
}

document.getElementById("zoom-in").addEventListener("click", () => changeZoom(0.1));
document.getElementById("zoom-out").addEventListener("click", () => changeZoom(-0.1));
document.getElementById("move-up").addEventListener("click", () => moveMap(0, 35));
document.getElementById("move-down").addEventListener("click", () => moveMap(0, -35));
document.getElementById("move-left").addEventListener("click", () => moveMap(35, 0));
document.getElementById("move-right").addEventListener("click", () => moveMap(-35, 0));
document.getElementById("reset-view").addEventListener("click", resetMap);

// Store changes after cart actions. Using a single render pathway keeps the
// cart, seat colors and storage in sync.
restoreCart();
updateMapView();

