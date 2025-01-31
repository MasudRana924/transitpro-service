const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const busRoutes = require('./routes/busRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
dotenv.config();
const app = express();

connectDB();
app.use(cors());
app.use(express.json());

app.use('/api/buses', busRoutes);
app.use('/api/payment', paymentRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
