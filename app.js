"use strict";

// Aurora Hall: initial venue model.
const venue = {
  name: "Aurora Hall",
  sections: [
    { id: "vip", name: "VIP", price: 120, rows: 3, seatsPerRow: 12 },
    { id: "premium", name: "Premium", price: 80, rows: 5, seatsPerRow: 14 },
    { id: "standard", name: "Standard", price: 45, rows: 7, seatsPerRow: 16 }
  ]
};

console.log(`${venue.name} initialized with ${venue.sections.length} seating sections.`);
