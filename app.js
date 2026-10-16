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
      const rowLabel = String.fromCharCode(65 + rowIndex);
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
  seatMap.replaceChildren();
  for (const id in seatButtons) delete seatButtons[id];
  let previousRow = "";
  let rowElement;
  for (const seat of seats) {
    if (seat.row !== previousRow) {
      rowElement = document.createElement("div");
      rowElement.className = `seat-row row-${seat.sectionId}`;
      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = seat.row;
      rowElement.append(label);
      seatMap.append(rowElement);
      previousRow = seat.row;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = `seat seat-${seat.sectionId}`;
    button.textContent = seat.number;
    button.title = `${seat.section}, row ${seat.row}, seat ${seat.number} — ${seat.price} AZN`;
    button.setAttribute("aria-label", button.title);
    button.dataset.id = seat.id;
    if (seat.unavailable) {
      button.disabled = true;
      button.classList.add("seat-unavailable");
      button.title += " (unavailable)";
      button.setAttribute("aria-label", button.title);
    }
    rowElement.append(button);
    seatButtons[seat.id] = button;
  }
}

renderSeats();
