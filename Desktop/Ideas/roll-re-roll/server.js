require('dotenv').config();
const express = require('express');
const cors = require('cors');
const handicapRoutes = require('./routes/handicapRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// Mount routes
app.use('/api/handicaps', handicapRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
