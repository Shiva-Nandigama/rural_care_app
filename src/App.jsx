import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, query, serverTimestamp } from 'firebase/firestore';
import { LogOut } from 'lucide-react';
import { setLogLevel } from "firebase/app";


// Import Utilities and Constants
import { initFirebase } from './utils/firebase';
import { APPOINTMENTS_COLLECTION, DOCTOR_ID } from './utils/constants';

// Import Components and Screens
import LoginScreen from './components/LoginScreen';
import VideoCall from './components/VideoCall';
import PatientDashboard from './screens/PatientDashboard';
import DoctorDashboard from './screens/DoctorDashboard';

// Environment variables (simulated by global access in this environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-ruralcare-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- MAIN APP COMPONENT ---
const App = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState('none'); // 'none', 'patient', 'doctor'
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCall, setActiveCall] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    // 1. Firebase Initialization and Authentication Effect
    useEffect(() => {
        const { db, auth } = initFirebase(setLogLevel); // Assuming setLogLevel is defined globally if needed
        if (db && auth) {
            setDb(db);
            setAuth(auth);

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    if (user.uid === DOCTOR_ID) {
                        setRole('doctor');
                    }
                    setLoading(false);
                } else {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(auth, initialAuthToken);
                        } else {
                            const anonymousUser = await signInAnonymously(auth);
                            setUserId(anonymousUser.user.uid);
                            setRole('patient');
                        }
                    } catch (error) {
                        console.error("Authentication failed:", error);
                        setStatusMessage("Authentication failed. Please refresh.");
                        setLoading(false);
                    }
                }
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
            setStatusMessage("Firebase failed to initialize.");
        }
    }, []);

    // 2. Firestore Data Listener Effect (Appointments)
    useEffect(() => {
        if (!db || !userId) return;

        const collectionPath = `artifacts/${appId}/public/data/${APPOINTMENTS_COLLECTION}`;
        const appointmentsRef = collection(db, collectionPath);
        const q = query(appointmentsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appointmentList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                patientId: doc.data().patientId || 'anonymous',
                doctorId: doc.data().doctorId || DOCTOR_ID,
                patientName: doc.data().patientName || `Patient ${doc.id.substring(0, 4)}`,
            }));

            let filteredList = appointmentList;
            if (role === 'patient') {
                filteredList = appointmentList.filter(app => app.patientId === userId);
            } else if (role === 'doctor') {
                filteredList = appointmentList.filter(app => app.doctorId === DOCTOR_ID);
            }

            filteredList.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
            setAppointments(filteredList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setStatusMessage("Failed to load appointments.");
        });

        return () => unsubscribe();
    }, [db, userId, role]);

    // --- Data Actions (Passed down as props) ---

    const handleSelectRole = useCallback((selectedRole) => {
        setRole(selectedRole);
        if (selectedRole === 'doctor' && userId !== DOCTOR_ID) {
            setStatusMessage("Doctor role requires a specific ID. Using placeholder.");
        }
    }, [userId]);

    const handleBookAppointment = useCallback(async (day, time) => {
        if (!db || role !== 'patient') return;

        const isBooked = appointments.some(app =>
            app.day === day && app.time === time && app.status !== 'cancelled'
        );

        if (isBooked) {
            setStatusMessage('This slot is already booked. Please choose another.');
            return;
        }

        try {
            const collectionPath = `artifacts/${appId}/public/data/${APPOINTMENTS_COLLECTION}`;
            const newAppointment = {
                patientId: userId,
                patientName: `Patient ${userId.substring(0, 6)}`,
                doctorId: DOCTOR_ID,
                day: day,
                time: time,
                status: 'booked',
                notes: '',
                patientIsOnline: false,
                doctorIsOnline: false,
                offer: null,
                answer: null,
                iceCandidates: [],
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(collection(db, collectionPath)), newAppointment);
            setStatusMessage(`Appointment booked for ${day} at ${time}!`);
        } catch (error) {
            console.error("Error booking appointment:", error);
            setStatusMessage("Failed to book appointment.");
        }
    }, [db, role, appointments, userId]);

    const handleCallAction = useCallback(async (appointment, action) => {
        if (!db) return;
        const collectionPath = `artifacts/${appId}/public/data/${APPOINTMENTS_COLLECTION}`;
        const appRef = doc(db, collectionPath, appointment.id);

        if (action === 'start') {
             try {
                await updateDoc(appRef, { status: 'in_call' });
                setActiveCall(appointment);
                setStatusMessage(`Starting secure session for ${appointment.patientName}...`);
            } catch (error) {
                console.error("Error starting call:", error);
                setStatusMessage("Failed to start call.");
            }
        } else if (action === 'end') {
            try {
                // Clear signaling data and reset status
                await updateDoc(appRef, {
                    status: appointment.status === 'completed' ? 'completed' : 'booked',
                    patientIsOnline: false,
                    doctorIsOnline: false,
                    offer: null,
                    answer: null,
                    iceCandidates: [],
                });
            } catch (error) {
                console.error("Error cleaning up call:", error);
            }
            setActiveCall(null);
            setStatusMessage(`Call with ${appointment.patientName} ended.`);
        }
    }, [db]);

    const handleUpdateNotes = useCallback(async (appointmentId, notes) => {
        if (!db || role !== 'doctor') return;
        try {
            const collectionPath = `artifacts/${appId}/public/data/${APPOINTMENTS_COLLECTION}`;
            const appRef = doc(db, collectionPath, appointmentId);
            await updateDoc(appRef, {
                notes: notes,
                status: 'completed'
            });
            setStatusMessage('Prescription/Notes saved and appointment completed.');
        } catch (error) {
            console.error("Error updating notes:", error);
            setStatusMessage("Failed to save notes.");
        }
    }, [db, role]);


    // --- Main Render Logic ---

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl text-indigo-500">Loading RuralCare...</div>;
    }

    if (activeCall) {
        return <VideoCall appointment={activeCall} db={db} role={role} handleCallAction={handleCallAction} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-indigo-600 flex items-center">
                    Rural<span className="text-teal-500">Care</span>
                </h1>
                {role !== 'none' && (
                    <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${role === 'patient' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                            {role.toUpperCase()} VIEW
                        </span>
                        <button
                            onClick={() => setRole('none')}
                            className="text-gray-500 hover:text-gray-700 transition duration-150 p-2 rounded-full hover:bg-gray-100"
                            title="Change Role / Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </header>

            <main className="container mx-auto max-w-6xl py-8">
                {statusMessage && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-lg mx-4">
                        <p className="font-bold">Status</p>
                        <p>{statusMessage}</p>
                    </div>
                )}
                {role === 'none' && <LoginScreen handleSelectRole={handleSelectRole} userId={userId} statusMessage={statusMessage} />}
                {role === 'patient' && (
                    <PatientDashboard
                        appointments={appointments}
                        handleBookAppointment={handleBookAppointment}
                        handleCallAction={handleCallAction}
                    />
                )}
                {role === 'doctor' && (
                    <DoctorDashboard
                        appointments={appointments}
                        handleCallAction={handleCallAction}
                        handleUpdateNotes={handleUpdateNotes}
                        activeCall={activeCall}
                        role={role}
                    />
                )}
            </main>

            <footer className="p-4 text-center text-xs text-gray-400 border-t mt-8">
                Powered by React & Firebase. WebRTC Signaling via Firestore.
            </footer>
        </div>
    );
};

export default App;
