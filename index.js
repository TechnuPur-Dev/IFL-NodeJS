const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Base URL for the external API
const BASE_URL = 'https://exceltable-demo.genial365.com/api';

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Middleware endpoint that forwards to CloudToLocalSync
app.post('/CloudToLocalSync', async (req, res) => {
  try {
    const resumeData = req.body;
    const subUrl = req.query.subUrl;

    // Validate required parameters
    if (!subUrl) {
      return res.status(400).json({ 
        error: 'Missing required query parameter: subUrl' 
      });
    }

    if (!resumeData || Object.keys(resumeData).length === 0) {
      return res.status(400).json({ 
        error: 'Missing or empty request body' 
      });
    }

    console.log(`Forwarding request to ${BASE_URL}/CloudToLocalSync?subUrl=${subUrl}`);
    console.log('Request body:', JSON.stringify(resumeData, null, 2));

    // Make the POST request to the external API
    const response = await axios.post(
      `${BASE_URL}/CloudToLocalSync`,
      resumeData,
      {
        params: { subUrl },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Forward the response from the external API
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Error forwarding request:', error.message);
    
    if (error.response) {
      // Forward error response from external API
      res.status(error.response.status).json({
        error: 'External API error',
        message: error.response.data || error.message,
        status: error.response.status
      });
    } else if (error.request) {
      // Request was made but no response received
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to reach external API'
      });
    } else {
      // Error in request setup
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Middleware API running on port ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/CloudToLocalSync?subUrl=<your-sub-url>`);
});

// Export the Express API for Vercel
module.exports = app;  
