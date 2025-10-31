export const APPOINTMENTS_COLLECTION = 'ruralcare_appointments_public';
export const DOCTOR_ID = 'doc-user-1234';
export const TIME_SLOTS = [
    '09:00 - 09:30',
    '10:00 - 10:30',
    '11:00 - 11:30',
    '14:00 - 14:30',
    '15:00 - 15:30',
];
export const AVAILABLE_DAYS = ['Today', 'Tomorrow'];

// STUN Server Configuration (required for WebRTC signaling)
export const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
};
