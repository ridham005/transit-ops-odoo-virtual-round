# Transit Ops Backend Integration

This project contains the complete backend and frontend integration for **Transit Ops**, a logistics and fleet management dashboard. It uses a Flask (Python) backend with SQLite to serve a fully functional REST API.

## Tech Stack
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript (Existing UI strictly preserved).
- **Backend**: Python 3, Flask, Flask-CORS, Flask-SQLAlchemy, SQLite.
- **Architecture**: REST API using JSON payloads.

## Features
- **Graceful Fallback**: The frontend is powered by `js/api.js` which automatically intercepts fetch requests. If the Flask backend is offline, it falls back to using `mock-data.js` so the application never breaks.
- **Full CRUD Support**: Add, Edit, View, and Delete operations for Vehicles, Drivers, Trips, Maintenance, and Expenses.
- **Dynamic Drawers**: Reusable side-drawers for forms (e.g. Add Expense / View Expense / Edit Expense share the same HTML component).
- **Live Search & Filter**: Real-time filtering across all modules without constantly pinging the server on keystrokes.
- **Validation**: Client-side field validations backed by server-side validation.

## Running the Application

1. **Install Dependencies**
   ```bash
   pip install flask flask-cors flask-sqlalchemy python-dotenv
   ```

2. **Start the Backend**
   ```bash
   python backend/app.py
   ```
   The backend will start on `http://localhost:5000` and automatically seed the SQLite database with Indian logistics data (₹ currency, typical Indian locations/vehicles) if it's empty.

3. **Access the Frontend**
   Open `index.html` in your web browser. No frontend build tools are required.

## Project Structure
- `backend/app.py`: Main Flask entry point and route registrations.
- `backend/models.py`: SQLAlchemy database models.
- `backend/routes/`: Modular endpoints for each section.
- `js/api.js`: Centralized fetch wrapper handling requests and fallback.
- `js/mock-data.js`: Used as a fallback database if the backend is down.
- `*.html`: The fully preserved user interface.

## Test Credentials

Use the following credentials to test Role-Based Access Control and role-specific dashboards:

- **Fleet Manager:** `rahul@example.com`
- **Dispatcher:** `priya@example.com`
- **Safety Officer:** `amit@example.com`
- **Financial Analyst:** `sneha@example.com`

**Password for all accounts:** `transit123`