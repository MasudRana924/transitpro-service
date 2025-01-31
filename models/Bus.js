const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: Number,
  isBooked: { type: Boolean, default: false }
});

const busSchema = new mongoose.Schema({
  busName: String,
  from: String,
  to: String,
  departureTime: String,
  arrivalTime: String,
  duration: String,
  seats: [seatSchema]
});

const Bus = mongoose.model('Bus', busSchema);
module.exports = Bus;
