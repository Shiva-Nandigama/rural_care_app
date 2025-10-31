import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { Video, PhoneOff, Stethoscope } from 'lucide-react';
import { rtcConfig, APPOINTMENTS_COLLECTION } from '../utils/constants';

// Environment variable dependency
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-ruralcare-app-id';

const VideoCall = ({ appointment, db, role, handleCallAction }) => {
    const appRef = doc(db, `artifacts/${appId}/public/data/${APPOINTMENTS_COLLECTION}`, appointment.id);
    const isPatient = role === 'patient';
    const [status, setStatus] = useState('Connecting to media...');
    const [isRemotePresent, setIsRemotePresent] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);

    const otherUserField = isPatient ? 'doctorIsOnline' : 'patientIsOnline';
    const currentUserField = isPatient ? 'patientIsOnline' : 'doctorIsOnline';
    const remoteUserName = isPatient ? 'Doctor' : appointment.patientName;

    // Cleanup function for streams and peer connection
    const cleanup = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
    }, [localStream]);

    // Function to signal presence (online/offline)
    const setPresence = useCallback(async (isJoining) => {
        if (!db) return;
        try {
            await updateDoc(appRef, { [currentUserField]: isJoining });
        } catch (error) {
            console.error("Failed to set presence:", error);
        }
    }, [db, appRef, currentUserField]);

    // --- Core WebRTC Setup ---
    const setupWebRTC = useCallback(async () => {
        if (!peerConnection.current) {
            peerConnection.current = new RTCPeerConnection(rtcConfig);
            setStatus('Initializing...');
        }

        // 1. Get Local Media
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });
            setStatus('Media connected. Exchanging signals...');
        } catch (error) {
            console.error('Error accessing media devices:', error);
            setStatus(`Media failed: ${error.name}. Please check permissions.`);
        }

        // 2. Peer Connection Listeners
        peerConnection.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setIsCallActive(true);
            }
        };

        peerConnection.current.onicecandidate = async (event) => {
            if (event.candidate) {
                await updateDoc(appRef, {
                    iceCandidates: arrayUnion({
                        type: event.candidate.type,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        candidate: event.candidate.candidate,
                    })
                });
            }
        };
    }, [appRef]);

    // Function to handle the initial signaling logic (Offer/Answer)
    const startSignaling = useCallback(async () => {
        if (!peerConnection.current) return;

        if (isPatient) {
            // PATIENT (The Caller) creates the Offer
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            await updateDoc(appRef, { offer: { sdp: offer.sdp, type: offer.type } });
            setStatus(`Waiting for ${remoteUserName} to answer...`);
        } else {
            setStatus(`Waiting for patient's signal...`);
        }

        setPresence(true);
    }, [isPatient, appRef, setPresence, remoteUserName]);

    // --- Master Connection Effect (WebRTC Lifecycle) ---
    useEffect(() => {
        let unsubscribeAppointment;

        setupWebRTC().then(startSignaling);

        // Set up real-time listener for signaling data and presence
        unsubscribeAppointment = onSnapshot(appRef, async (docSnap) => {
            const data = docSnap.data();
            if (!data || !peerConnection.current) return;

            // 1. Handle Remote Presence
            setIsRemotePresent(data[otherUserField] === true);

            // 2. Handle Signaling (SDP Offer/Answer)
            if (isPatient) {
                // Patient listens for the Doctor's Answer
                if (data.answer && peerConnection.current.remoteDescription?.type !== 'answer') {
                    setStatus("Doctor answered. Finalizing connection...");
                    const answer = new RTCSessionDescription(data.answer);
                    await peerConnection.current.setRemoteDescription(answer);
                }
            } else {
                // Doctor listens for the Patient's Offer
                if (data.offer && peerConnection.current.remoteDescription?.type !== 'offer') {
                    setStatus("Patient signal received. Creating answer...");
                    const offer = new RTCSessionDescription(data.offer);
                    await peerConnection.current.setRemoteDescription(offer);

                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    await updateDoc(appRef, { answer: { sdp: answer.sdp, type: answer.type } });
                }
            }

            // 3. Handle ICE Candidates
            if (data.iceCandidates && data.iceCandidates.length > 0) {
                data.iceCandidates.forEach(async (candidateData) => {
                    const candidate = new RTCIceCandidate(candidateData);
                    try {
                        await peerConnection.current.addIceCandidate(candidate);
                    } catch (e) {
                        // Ignore already added or failed candidates
                    }
                });
            }

        }, (error) => {
            console.error("Firestore listener error:", error);
            setStatus('Real-time connection failed.');
        });

        // Cleanup on component unmount
        return () => {
            if (unsubscribeAppointment) unsubscribeAppointment();
            cleanup();
            setPresence(false);
        };
    }, [appRef, isPatient, setupWebRTC, startSignaling, cleanup, otherUserField, setPresence]);


    const handleEndCall = () => {
        handleCallAction(appointment, 'end');
    };

    const displayMessage = isCallActive
        ? <span className="text-green-400 font-semibold">In Session with {remoteUserName}</span>
        : isRemotePresent
            ? <span className="text-yellow-400 font-semibold">Waiting for call to connect... ({status})</span>
            : <span className="text-red-400 font-semibold">Waiting for {remoteUserName} to join... ({status})</span>;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-black rounded-2xl shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
                {/* Status Bar */}
                <div className="p-2 bg-gray-700 text-center text-sm text-white">
                    {displayMessage}
                </div>
                {/* Video Feeds Area */}
                <div className="flex-grow relative bg-gray-900 p-4 grid grid-cols-2 gap-4">
                    {/* Remote Feed */}
                    <div className="relative flex items-center justify-center rounded-xl overflow-hidden bg-indigo-900/80 aspect-video">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover transition-opacity duration-500"
                        />
                        {!isCallActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                <Stethoscope className="w-12 h-12 mb-2 text-indigo-400 animate-pulse" />
                                <p className="text-xl font-bold">Waiting for {remoteUserName}'s Stream</p>
                                <p className="text-sm text-gray-400 text-center mt-2">Connecting via WebRTC...</p>
                            </div>
                        )}
                    </div>

                    {/* Local Feed */}
                    <div className="relative flex items-center justify-center rounded-xl overflow-hidden bg-teal-900/80 aspect-video">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {localStream === null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                <Video className="w-12 h-12 mb-2 text-red-400" />
                                <p className="text-xl font-bold">No Local Media</p>
                                <p className="text-sm text-gray-400">Check camera/mic permissions.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Call Controls */}
                <div className="flex justify-center p-4 bg-gray-800 space-x-4">
                    <button
                        onClick={() => { /* TODO: Toggle video track logic */ }}
                        className="p-3 rounded-full bg-gray-600 text-white hover:bg-gray-500 transition duration-200"
                        title="Toggle Video"
                    >
                        <Video className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => { /* TODO: Toggle audio track logic */ }}
                        className="p-3 rounded-full bg-gray-600 text-white hover:bg-gray-500 transition duration-200"
                        title="Toggle Mic"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 14H7a.5.5 0 01-.5-.5v-4A.5.5 0 017 9h6a.5.5 0 01.5.5v4a.5.5 0 01-.5.5zm-3-9a3 3 0 00-3 3v4a3 3 0 003 3 3 3 0 003-3v-4a3 3 0 00-3-3zM5.993 8.5v3A4 4 0 0010 16.507V19a.5.5 0 00.5.5h-.5a.5.5 0 00-.5-.5v-2.5a.5.5 0 00-.5-.5H7a.5.5 0 00-.5.5V19a.5.5 0 00.5.5h-.5a.5.5 0 00-.5-.5v-2.5A4.002 4.002 0 005.993 8.5z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </button>
                    <button
                        onClick={handleEndCall}
                        className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition duration-200"
                        title="End Call"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
