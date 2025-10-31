import React from 'react';
import { Calendar, Clock, Video, FileText, UserCheck } from 'lucide-react';
import { formatTimestamp } from '../utils/firebase';

const AppointmentCard = ({ appointment, role, onCallAction }) => {
    const isDoctor = role === 'doctor';
    const isPatient = role === 'patient';
    const isCompleted = appointment.status === 'completed';
    const statusClasses = isCompleted ? 'bg-green-100 text-green-700' :
                          appointment.status === 'in_call' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700';

    return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 transition-all hover:shadow-lg">
            <div className="flex-grow mb-3 sm:mb-0">
                <p className="text-sm font-semibold text-gray-800">
                    {isDoctor ? appointment.patientName : 'Consultation'}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {appointment.day}</span>
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {appointment.time}</span>
                </div>
                {isDoctor && (
                     <p className="text-xs text-gray-400 mt-1">Patient ID: {appointment.patientId}</p>
                )}
            </div>

            <div className="flex flex-col items-start sm:items-end space-y-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusClasses}`}>
                    {isDoctor && appointment.status === 'booked' ? 'Scheduled' : appointment.status.replace('_', ' ')}
                </span>
                {appointment.status === 'booked' && (
                    <button
                        onClick={() => onCallAction(appointment, 'start')}
                        className={`flex items-center text-sm text-white py-1.5 px-3 rounded-lg transition duration-150 ${isPatient ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-teal-500 hover:bg-teal-600'}`}
                    >
                        <Video className="w-4 h-4 mr-1" /> {isPatient ? 'Join Call' : 'Start Session'}
                    </button>
                )}
                {(isPatient || isDoctor) && isCompleted && appointment.notes && (
                     <p className="text-xs text-indigo-500 mt-1 flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> Notes Available
                    </p>
                )}
            </div>
        </div>
    );
};

export default AppointmentCard;
