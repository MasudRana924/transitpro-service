const Bus = require('../models/Bus');

const searchBuses = async (req, res) => {
  const { from, to } = req.query;
  try {
    const buses = await Bus.find({ from, to });
    console.log(buses)
    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBusSeats = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus.seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const bookSeats = async (req, res) => {
  const { busId, seats } = req.body;
  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });

    const availableSeats = bus.seats.filter(seat => !seat.isBooked);
    if (seats.length > 4) return res.status(400).json({ message: 'Max 4 seats can be booked' });

    const seatNumbers = seats.map(s => s.seatNumber);
    const isAvailable = seatNumbers.every(s => availableSeats.some(a => a.seatNumber === s));

    if (!isAvailable) return res.status(400).json({ message: 'Some seats are already booked' });

    bus.seats.forEach(seat => {
      if (seatNumbers.includes(seat.seatNumber)) {
        seat.isBooked = true;
      }
    });

    await bus.save();
    res.json({ message: 'Seats booked successfully', bookedSeats: seatNumbers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { searchBuses, getBusSeats, bookSeats };
