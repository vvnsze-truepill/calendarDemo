// Example: Create a new calendar
const createMainCalendar = async () => {
  const auth = await getAuth(); // Implement this function to get authenticated credentials

  const calendar = google.calendar({ version: 'v3', auth });
  const calendarResponse = await calendar.calendars.insert({
    resource: { summary: 'Main Calendar' },
  });

  console.log('Calendar created:', calendarResponse.data);
};

// Example: Set up available office hours
const setOfficeHours = async () => {
  const auth = await getAuth(); // Implement this function to get authenticated credentials

  const calendar = google.calendar({ version: 'v3', auth });
  const eventResponse = await calendar.events.insert({
    calendarId: 'primary',
    resource: {
      summary: 'Office Hours',
      description: 'Available for appointments',
      start: { dateTime: '2024-01-10T09:00:00', timeZone: 'UTC' },
      end: { dateTime: '2024-01-10T17:00:00', timeZone: 'UTC' },
    },
  });

  console.log('Office hours set up:', eventResponse.data);
};

// Implement the getAuth function to obtain an authenticated credentials object
const getAuth = async () => {
  // Your logic to obtain and refresh authentication tokens here

  // Set the credentials on the OAuth2 client
  oAuth2Client.setCredentials(tokens);

  return oAuth2Client;
};

// Call the functions in your route handlers
app.post('/createMainCalendar', async (req, res) => {
  await createMainCalendar();
  res.send('Main calendar created!');
});

app.post('/setOfficeHours', async (req, res) => {
  await setOfficeHours();
  res.send('Office hours set up!');
});

// Endpoint to create an event within set office hours
app.post('/createEvent', async (req, res) => {
  try {
    const auth = await getAuth(); // Implement this function to get authenticated credentials

    const { summary, startDateTime, endDateTime } = req.body;

    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const calendar = google.calendar({ version: 'v3', auth });
    const eventResponse = await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary,
        start: { dateTime: startDateTime, timeZone: 'UTC' },
        end: { dateTime: endDateTime, timeZone: 'UTC' },
      },
    });

    console.log('Event created:', eventResponse.data);
    res.status(201).json({ message: 'Event created successfully', event: eventResponse.data });
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to create a sub-calendar related to the main calendar
app.post('/createSubCalendar', async (req, res) => {
  try {
    const auth = await getAuth(); // Implement this function to get authenticated credentials

    const { mainCalendarId, subCalendarSummary } = req.body;

    if (!mainCalendarId || !subCalendarSummary) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const calendar = google.calendar({ version: 'v3', auth });

    // Check if the main calendar exists (you may want to implement more robust checks)
    const mainCalendarExists = await calendar.calendars.get({ calendarId: mainCalendarId }).catch(() => false);

    if (!mainCalendarExists) {
      return res.status(404).json({ error: 'Main calendar not found' });
    }

    // Create a sub-calendar under the main calendar
    const subCalendarResponse = await calendar.calendars.insert({
      resource: {
        summary: subCalendarSummary,
        timeZone: 'UTC',
        colorId: '8', // Optional: Set a color for the sub-calendar
      },
    });

    console.log('Sub-calendar created:', subCalendarResponse.data);

    res.status(201).json({
      message: 'Sub-calendar created successfully',
      subCalendar: subCalendarResponse.data,
    });
  } catch (error) {
    console.error('Error creating sub-calendar:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inside your existing code...

// Endpoint to retrieve all events from all sub-calendars
app.get('/getAllEvents', async (req, res) => {
  try {
    const auth = await getAuth(); // Implement this function to get authenticated credentials

    // Assume main calendar ID is known or obtained from your application logic
    const mainCalendarId = 'your-main-calendar-id'; // Replace with your actual main calendar ID

    const calendar = google.calendar({ version: 'v3', auth });

    // Get a list of all calendars (including sub-calendars) under the main calendar
    const calendarListResponse = await calendar.calendarList.list().catch((err) => {
      console.error('Error retrieving calendar list:', err.message);
      throw err;
    });

    const subCalendars = calendarListResponse.data.items.filter(
      (calendar) => calendar.id !== mainCalendarId
    );

    // Fetch events from each sub-calendar
    const allEvents = [];
    for (const subCalendar of subCalendars) {
      const eventsResponse = await calendar.events.list({
        calendarId: subCalendar.id,
      });

      if (eventsResponse.data.items) {
        allEvents.push(...eventsResponse.data.items);
      }
    }

    res.status(200).json({ allEvents });
  } catch (error) {
    console.error('Error retrieving events:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inside your existing code...

// Endpoint to share a calendar with another user
app.post('/shareCalendar', async (req, res) => {
  try {
    const auth = await getAuth(); // Implement this function to get authenticated credentials

    const { calendarId, userToShareWith, role } = req.body;

    if (!calendarId || !userToShareWith || !role) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const calendar = google.calendar({ version: 'v3', auth });

    // Set the permissions for the shared user
    const sharePermissions = {
      role,
      scope: 'user',
      type: 'user',
      value: userToShareWith,
    };

    // Share the calendar
    const shareResponse = await calendar.acl.insert({
      calendarId: calendarId,
      resource: sharePermissions,
    });

    res.status(201).json({ message: 'Calendar shared successfully', shareResponse: shareResponse.data });
  } catch (error) {
    console.error('Error sharing calendar:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to retrieve events from a shared calendar
app.get('/getEventsFromSharedCalendar', async (req, res) => {
  try {
    const auth = await getAuth(); // Implement this function to get authenticated credentials

    const { sharedCalendarId } = req.query;

    if (!sharedCalendarId) {
      return res.status(400).json({ error: 'Missing required parameter: sharedCalendarId' });
    }

    const calendar = google.calendar({ version: 'v3', auth });

    // Retrieve events from the shared calendar
    const eventsResponse = await calendar.events.list({
      calendarId: sharedCalendarId,
    });

    res.status(200).json({ events: eventsResponse.data.items });
  } catch (error) {
    console.error('Error retrieving events from shared calendar:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to update an event in a shared calendar
app.put('/updateEventInSharedCalendar', async (req, res) => {
  try {
    const auth = await getAuth(); // Implement this function to get authenticated credentials

    const { sharedCalendarId, eventId, updatedEvent } = req.body;

    if (!sharedCalendarId || !eventId || !updatedEvent) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const calendar = google.calendar({ version: 'v3', auth });

    // Update an existing event in the shared calendar
    const updatedEventResponse = await calendar.events.update({
      calendarId: sharedCalendarId,
      eventId: eventId,
      resource: updatedEvent,
    });

    res.status(200).json({ message: 'Event updated successfully', updatedEvent: updatedEventResponse.data });
  } catch (error) {
    console.error('Error updating event in shared calendar:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


