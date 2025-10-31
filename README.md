HealthBridge: Rural Telemedicine (RuralCare)

HealthBridge is a proof-of-concept, single-page application (SPA) built with React and WebRTC, designed to connect patients in remote areas with doctors via secure, real-time video calls. It uses Google Firestore as a temporary Signaling Server to facilitate peer-to-peer connections.

🌟 Key Features

Role-Based Access: Separate dashboards for Patients and Doctors.

Appointment Management: Patients can book available time slots, and Doctors can view upcoming sessions.

Real-Time Video Calls (WebRTC): Actual peer-to-peer connection attempt using browser media APIs.

Firestore Signaling: Utilizes Firestore documents to exchange WebRTC offer/answer and ICE candidates.

Real-Time Presence: Users see immediate status updates when the other party joins the call.

Prescription/Notes: Doctors can submit basic medical notes and mark the appointment as complete.

Responsive UI: Fully adaptive design using Tailwind CSS.

🛠️ Tech Stack

Category

Technology

Purpose

Frontend

React JS (Functional Components/Hooks)

Application UI and State Management

Real-Time

WebRTC (via RTCPeerConnection)

Peer-to-peer video/audio streaming

Signaling/DB

Firebase Firestore

Real-time persistence and signaling data exchange

Styling

Tailwind CSS

Utility-first, responsive design

State

React useState/useCallback/useEffect

Component and global application logic

🏗️ Project Structure

The application is structured into logical components and utilities for maintainability:

src/
├── components/
│   ├── AppointmentCard.jsx    # UI for a single appointment item.
│   ├── LoginScreen.jsx        # Role selection interface.
│   ├── Modal.jsx              # Reusable overlay component.
│   └── **VideoCall.jsx** # **Core WebRTC/Signaling logic.**
├── screens/
│   ├── DoctorDashboard.jsx    # Doctor's view and notes submission.
│   └── PatientDashboard.jsx   # Patient's view and booking form.
├── utils/
│   ├── constants.js           # API collection names, time slots, and STUN config.
│   └── **firebase.js** # **Firebase configuration and initialization.**
└── **App.jsx** # Root component, authentication, and state management.


⚙️ Setup and Installation

Prerequisites

Node.js and npm: Installed on your system.

Firebase Project: A configured Firebase project with Firestore and Authentication enabled.

Step 1: Clone the Repository

git clone <your-repo-url>
cd healthbridge


Step 2: Install Dependencies

Since this project uses modern React features, install the standard Firebase SDK:

npm install firebase react react-dom lucide-react


Step 3: Configure Firebase

The current project files contain hardcoded credentials. To use your own Firebase project, you must update the configuration inside src/utils/firebase.js.

The current configuration is:

const firebaseConfig = {
  apiKey: "AIzaSyA21YC_XeiHCyEOWjwls2J7YevY48VbK4U",
  authDomain: "remote-video-call.firebaseapp.com",
  // ... other details
};


CRITICAL: Ensure the Anonymous Sign-in Provider is ENABLED in your Firebase console under Authentication > Sign-in method. Without this, the patient sign-in will fail.

Step 4: Configure WebRTC Signaling

This application uses Firestore for signaling. You must ensure the following fields are available and writable in the ruralcare_appointments_public collection:

offer

answer

iceCandidates (array)

patientIsOnline (boolean)

doctorIsOnline (boolean)

▶️ Running the Application

Start your React development server (e.g., using vite or create-react-app's command: npm run dev or npm start).

Open the application in your browser.

To test the real-time call: Open two separate browser tabs/windows (or use Incognito/different browsers).

In Window 1: Log in as Patient. Book an appointment.

In Window 2: Log in as Doctor.

Click "Join Call" (Patient) and "Start Session" (Doctor) on the same appointment in both windows.

The WebRTC connection will be established, and you should see the live video streams (pending browser media permissions).

👨‍💻 Doctor Login

For demonstration purposes, the application uses a fixed ID for the Doctor role, defined in src/utils/constants.js:

export const DOCTOR_ID = 'doc-user-1234';


When you select the Doctor role, the app attempts to sign in with this ID. For the Doctor role to work correctly in a secure environment, you would typically need to enforce this user ID via custom token authentication, but the current logic handles role assignment based on a successful sign-in with this specific UID.