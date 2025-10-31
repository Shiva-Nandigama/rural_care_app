import React, { useState, useMemo } from 'react';
import AppointmentCard from '../components/AppointmentCard';
import Modal from '../components/Modal';
import { Calendar, Clock } from 'lucide-react';
import { AVAILABLE_DAYS, TIME_SLOTS } from '../utils/constants';
import { formatTimestamp } from '../utils/firebase';

const PatientDashboard = ({ appointments, handleBookAppointment, handleCallAction }) => {
    const [selectedDay, setSelectedDay] = useState(AVAILABLE_DAYS[0]);
    const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
    const [showNotes, setShowNotes] = useState(null);

    const bookedSlots = useMemo(() => {
        return appointments.filter(app => app.status !== 'cancelled').map(app => ({ day: app.day, time: app.time }));
    }, [appointments]);

    const availableSlots = TIME_SLOTS.filter(time =>
        !bookedSlots.some(slot => slot.day === selectedDay && slot.time === time)
    );

    return (
        <div className="p-4 sm:p-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6">Welcome, Patient!</h2>
            <div className="grid md:grid-cols-2 gap-8">
                {/* Appointment Booking Form */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-indigo-600">
                        <Calendar className="w-5 h-5 mr-2" /> Book a Consultation
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Day</label>
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {AVAILABLE_DAYS.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Time Slot</label>
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={availableSlots.length === 0}
                            >
                                {availableSlots.length > 0 ? (
                                    availableSlots.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))
                                ) : (
                                    <option disabled>No Slots Available</option>
                                )}
                            </select>
                        </div>
                        <button
                            onClick={() => handleBookAppointment(selectedDay, selectedTime)}
                            disabled={availableSlots.length === 0}
                            className="w-full bg-indigo-500 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-600 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </div>

                {/* My Appointments List */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
                        <Clock className="w-5 h-5 mr-2" /> My Appointments ({appointments.length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {appointments.length > 0 ? (
                            appointments.map(app => (
                                <div key={app.id}>
                                    <AppointmentCard
                                        appointment={app}
                                        role="patient"
                                        onCallAction={handleCallAction}
                                    />
                                    {app.status === 'completed' && (
                                        <button
                                            onClick={() => setShowNotes(app)}
                                            className="text-xs text-indigo-500 hover:text-indigo-700 mt-[-8px] mb-2 px-2"
                                        >
                                            View Prescription/Notes
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No appointments booked yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes Modal */}
            {showNotes && (
                <Modal onClose={() => setShowNotes(null)}>
                    <h3 className="text-xl font-semibold mb-4 text-indigo-600">Prescription for {formatTimestamp(showNotes.createdAt)}</h3>
                    <p className="whitespace-pre-wrap p-4 bg-gray-50 border rounded-lg text-gray-700 min-h-[100px] shadow-inner">
                        {showNotes.notes || 'No notes/prescription provided yet.'}
                    </p>
                    <p className="text-xs mt-4 text-gray-500">
                        Please consult your local pharmacy or physician with these notes.
                    </p>
                </Modal>
            )}
        </div>
    );
};

export default PatientDashboard;
