import React, { useState, useEffect } from 'react';
import AppointmentCard from '../components/AppointmentCard';
import { Stethoscope, UserCheck, FileText, Send } from 'lucide-react';
import { formatTimestamp } from '../utils/firebase';

const DoctorDashboard = ({ appointments, handleCallAction, handleUpdateNotes, activeCall, role }) => {
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [notes, setNotes] = useState('');

    const handleSaveNotes = () => {
        if (currentAppointment && notes) {
            handleUpdateNotes(currentAppointment.id, notes);
            setCurrentAppointment(null);
            setNotes('');
        }
    };

    const upcomingAppointments = appointments.filter(app => app.status === 'booked');
    const completedAppointments = appointments.filter(app => app.status === 'completed');

    // Hook to keep the notes form open after a call if notes haven't been saved
    useEffect(() => {
        if (activeCall && activeCall.status === 'in_call' && role === 'doctor') {
            setCurrentAppointment(activeCall);
            setNotes(activeCall.notes || '');
        } else if (!activeCall && currentAppointment && currentAppointment.status !== 'completed' && role === 'doctor') {
            // Keep form open if call ended but session is not completed
        } else if (!activeCall && currentAppointment && currentAppointment.status === 'completed') {
            // If call ended and appointment is now completed, clear form
            setCurrentAppointment(null);
            setNotes('');
        }
    }, [activeCall, role, currentAppointment]);


    return (
        <div className="p-4 sm:p-8">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
                <Stethoscope className="w-6 h-6 mr-2"/> Doctor Dashboard
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-teal-100">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-teal-600">
                        <UserCheck className="w-5 h-5 mr-2" /> Upcoming Consultations ({upcomingAppointments.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map(app => (
                                <AppointmentCard
                                    key={app.id}
                                    appointment={app}
                                    role="doctor"
                                    onCallAction={handleCallAction}
                                />
                            ))
                        ) : (
                            <p className="text-gray-500">No appointments scheduled.</p>
                        )}
                    </div>
                </div>

                {/* Prescription/Notes Input */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
                        <FileText className="w-5 h-5 mr-2" /> Medical Notes & Prescription
                    </h3>
                    {currentAppointment ? (
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-teal-600">Session with: {currentAppointment.patientName}</p>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter medical notes, diagnosis, and prescription here..."
                                rows="8"
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-teal-500 focus:border-teal-500 resize-none"
                            />
                            <button
                                onClick={handleSaveNotes}
                                disabled={!notes}
                                className="w-full bg-teal-500 text-white font-bold py-2.5 rounded-lg hover:bg-teal-600 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                <Send className="w-4 h-4 mr-2" /> Save Notes & Complete Session
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-500">
                                Start a session from the list to enable note-taking.
                            </p>
                            <div className="mt-4 space-y-2">
                                <h4 className="text-md font-semibold text-gray-700">Completed Sessions History:</h4>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                {completedAppointments.length > 0 ? (
                                    completedAppointments.map(app => (
                                        <div key={app.id} className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
                                            {app.patientName} ({formatTimestamp(app.createdAt)})
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400">No completed sessions.</p>
                                )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
