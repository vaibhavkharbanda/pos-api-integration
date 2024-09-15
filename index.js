const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const baseURL = 'https://demo.ezetap.com/api/3.0/p2padapter';

// Start API: Sends notification to the device
app.post('/api/start', async (req, res) => {
    try {
        const response = await axios.post(`${baseURL}/pay`, req.body); // Ensure correct POST request
        res.json(response.data); // Return response including p2pRequestId
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Status API: Check the status of the notification using p2pRequestId
app.post('/api/status', async (req, res) => {
    try {
        const response = await axios.post(`${baseURL}/status`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel API: Cancel the notification using p2pRequestId
app.post('/api/cancel', async (req, res) => {
    try {
        const response = await axios.post(`${baseURL}/cancel`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
