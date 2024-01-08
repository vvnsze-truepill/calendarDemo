const express = require('express');
const { google } = require('googleapis');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Google Calendar API configuration
const calendar = google.calendar('v3');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Load credentials from the JSON file
const credentials = require('./path-to-your-service-account-key.json');
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Endpoint to create a main calendar for a person
app.post('/createMainCalendar', async (req, res) => {
  // Your logic to create a main calendar here
  // Use the calendar API to create a calendar

  res.send('Main calendar created!');
});

// Endpoint to set up available office hours
app.post('/setOfficeHours', async (req, res) => {
  // Your logic to set up available office hours here
  // Use the calendar API to add events for office hours

  res.send('Office hours set up!');
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
