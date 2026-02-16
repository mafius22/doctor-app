# E-Doctor – Online Medical Appointment System

## Key Features
Patient Module
 - Browse Doctors: Filter specialists and view availability in a matrix-style weekly calendar. 
 - Booking Appointments: Select free 30-minute time slots and define visit details.
 - Cart & Payments: Manage reserved appointments and simulate a payment process.
 - Review System: Rate and comment on completed visits.

Doctor Module
- Availability Management: Define recurring rules or one-time availability slots.
- Absence Handling: Log planned leaves that automatically block the schedule and cancel conflicting appointments with patient notifications.
- Patient Interaction: Reply to reviews left by patients regarding their visits.

Administrator Module
- Persistence Management: Dynamically change session storage modes to control token behavior after closing the browser tab.
- User Management: Register new doctor profiles and ban users who violate rules.

## Technical Architecture
- Backend - Express.js
    - Security: Authentication system based on short-lived Access Tokens and long-lived Refresh Tokens stored in a Session database.
    - Validation: Strict input data control using the Zod library.

- Data Model - Mongoose/MongoDB
    - Appointment: Stores dates, statuses, and patient snapshots.
    - AvailabilityRule: Defines the time frames for a doctor's work hours.
    - Absence: Manages schedule blocks and leaves.
    - User & Session: Manages identity, roles, and user sessions.

- Frontend - React
    - Component-Based UI: Built using React for a dynamic and responsive user experience, utilizing Tailwind CSS for styling.
    
## Authorization System
The application implements a strict Role-Based Access Control mechanism:
- GUEST - browse the list of doctors and register an account.
- PATIENT - view schedules, book slots, manage their cart, and review their own doctors.
- DOCTOR - manage their own schedule and absences; can view details of patients booked for their visits.
- ADMIN - access to user lists, doctor registration, and system-wide configuration.




## Installation & Setup
Clone the repository:
```
git clone https://github.com/mafius22/doctor-app.git
```
Install dependencies in frontend and backend folders:
```
npm install
```
Configure environment variables (.env):
- backend:
  ```
  PORT=4000
  CLIENT_ORIGIN=http://localhost:5173
  MONGO_URI=your_database_uri
  ACCESS_TOKEN_SECRET=my_access_secret
  REFRESH_TOKEN_SECRET=my_refresh_secret
  ACCESS_TOKEN_TTL_SECONDS=60
  REFRESH_TOKEN_TTL_DAYS=7
  ```
- frontend:
  ```
  VITE_API_URL=http://localhost:4000/api
  ```

Run the application in frontend and backend folders:
```
npm run dev
```
