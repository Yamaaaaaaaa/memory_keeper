// 1. CallContext.tsx - Context để quản lý trạng thái call
import { auth, db } from '@/firebase/firebaseConfig';
import { useStoryEditingStore } from '@/store/storyEditingStore';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { mediaDevices, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';

type CallStatus = 'ringing' | 'accepted' | 'declined' | 'ended';

interface IncomingCall {
    callId: string;
    callerId: string;
    callerName?: string;
}

interface CallContextValue {
    // Permissions
    hasCam: boolean;
    hasMic: boolean;

    // Call state
    currentCallId: string | null;
    callStatus: CallStatus | null;
    incomingCall: IncomingCall | null;

    // Streams
    localStreamUrl: string | null;
    remoteStreamUrl: string | null;

    // Controls
    micEnabled: boolean;
    speakerOn: boolean;
    cameraFacing: 'user' | 'environment';

    // Actions
    startCall: (peerId: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    endCall: () => Promise<void>;
    toggleMic: () => void;
    switchCamera: () => Promise<void>;
    toggleSpeaker: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: [
                "turn:turn.anyfirewall.com:443?transport=tcp",
                "turn:turn.anyfirewall.com:443?transport=udp"
            ],
            username: "webrtc",
            credential: "webrtc"
        },
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hasCam, setHasCam] = useState(false);
    const [hasMic, setHasMic] = useState(false);
    const [localStreamUrl, setLocalStreamUrl] = useState<string | null>(null);
    const [remoteStreamUrl, setRemoteStreamUrl] = useState<string | null>(null);
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);
    const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [micEnabled, setMicEnabled] = useState(true);
    const [speakerOn, setSpeakerOn] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

    const recordingRef = useRef<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<any>(null);
    const callDocRef = useRef<ReturnType<typeof doc> | null>(null);
    const unsubCallSnapshot = useRef<(() => void) | null>(null);
    const unsubIncomingWatcher = useRef<(() => void) | null>(null);

    const callerRemoteDescSetRef = useRef(false);
    const calleeRemoteDescSetRef = useRef(false);
    const pendingCalleeCandidatesRef = useRef<any[]>([]);
    const pendingCallerCandidatesRef = useRef<any[]>([]);

    const myUserId = auth.currentUser?.uid || '';

    const updateStory = useStoryEditingStore((state) => state.updateStory)
    const { id: storyId } = useStoryEditingStore.getState()


    // Request permissions
    useEffect(() => {
        (async () => {
            const camPerm = await Camera.requestCameraPermissionsAsync();
            setHasCam(camPerm.status === 'granted');
            const micPerm = await Audio.requestPermissionsAsync();
            setHasMic(micPerm.status === 'granted');

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: true,
            });
        })();

        return () => {
            cleanup();
            if (unsubIncomingWatcher.current) {
                unsubIncomingWatcher.current();
            }
        };
    }, []);

    // Watch for incoming calls
    useEffect(() => {
        if (!myUserId) return;

        if (unsubIncomingWatcher.current) {
            unsubIncomingWatcher.current();
        }

        const qIncoming = query(
            collection(db, 'calls'),
            where('calleeId', '==', myUserId),
            where('status', '==', 'ringing'),
            limit(1)
        );

        unsubIncomingWatcher.current = onSnapshot(qIncoming, (snap) => {
            if (snap.empty) {
                setIncomingCall(null);
                return;
            }

            const docSnap = snap.docs[0];
            const data: any = docSnap.data();

            setIncomingCall({
                callId: docSnap.id,
                callerId: data.callerId,
                callerName: data.callerName || data.callerId
            });
        });

        return () => {
            if (unsubIncomingWatcher.current) {
                unsubIncomingWatcher.current();
            }
        };
    }, [myUserId]);


    const startRecording = async () => {
        try {
            const perm = await Audio.requestPermissionsAsync();
            if (perm.status !== "granted") {
                Alert.alert("Không có quyền microphone để ghi âm");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            setIsRecording(true);
            console.log("Recording started");
        } catch (e) {
            console.error("Start recording error:", e);
        }
    };

    const stopRecording = async (docRef?: ReturnType<typeof doc> | null) => {
        if (!recordingRef.current) return null;

        try {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;
            setIsRecording(false);

            const formData = new FormData();
            formData.append("file", {
                uri,
                type: "audio/m4a",
                name: "recording.m4a",
            } as any);
            formData.append("model", "whisper-1");

            const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
                },
                body: formData,
            });

            const data = await res.json();
            if (data.error) {
                console.error("❌ Whisper API Error:", data.error);
                return null;
            }

            const transcript = data.text;
            console.log("📝 Transcript:", transcript);

            if (docRef) {
                try {
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const callData: any = snap.data();
                        const updateField: Record<string, any> = {};

                        if (myUserId === callData.callerId) {
                            updateField.callDetailText_Caller = transcript;
                        } else if (myUserId === callData.calleeId) {
                            updateField.callDetailText_Callee = transcript;
                        }

                        if (Object.keys(updateField).length > 0) {
                            await updateDoc(docRef, updateField);
                            console.log("✅ Transcript saved to Firestore", updateField);
                        } else {
                            console.warn("⚠️ User không khớp caller/callee, không lưu transcript");
                        }
                    }
                } catch (err) {
                    console.error("❌ Failed to save transcript:", err);
                }
            } else {
                console.warn("⚠️ No callDocRef provided, cannot save transcript");
            }

            return transcript;
        } catch (e) {
            console.error("❌ Stop recording error:", e);
            return null;
        }
    };

    const startLocalStream = async (facing: 'user' | 'environment' = cameraFacing) => {
        if (localStreamRef.current) return;
        try {
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    facingMode: facing,
                    width: 640,
                    height: 480
                },
            } as any);
            localStreamRef.current = stream;
            setLocalStreamUrl(stream.toURL());
        } catch (err) {
            console.error('getUserMedia error', err);
            Alert.alert('Lỗi', 'Không thể truy cập camera/microphone');
        }
    };

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(rtcConfig);

        (pc as any).ontrack = (event: any) => {
            if (event.streams && event.streams[0]) {
                setRemoteStreamUrl(event.streams[0].toURL());
            } else if (event.track) {
                try {
                    const ms = new (global as any).MediaStream();
                    ms.addTrack(event.track);
                    setRemoteStreamUrl(ms.toURL?.() ?? null);
                } catch { }
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t: any) => pc.addTrack(t, localStreamRef.current));
        }
        pcRef.current = pc;
        return pc;
    };

    const startCall = async (peerId: string) => {
        console.log("peerId", peerId);

        // if (!myUserId || !peerId) {
        //     Alert.alert('Thiếu thông tin', 'Hãy nhập peerId');
        //     return;
        // }

        await startLocalStream();
        await startRecording(); // bắt đầu record
        const pc = createPeerConnection();

        const callDoc = doc(collection(db, 'calls'));
        callDocRef.current = callDoc;
        setCurrentCallId(callDoc.id);
        setCallStatus('ringing');

        const callerCandidatesCol = collection(callDoc, 'callerCandidates');
        const calleeCandidatesCol = collection(callDoc, 'calleeCandidates');

        (pc as any).onicecandidate = async (e: any) => {
            if (e.candidate) {
                try {
                    await addDoc(callerCandidatesCol, e.candidate.toJSON());
                } catch (err) {
                    console.warn('add caller ICE error', err);
                }
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await setDoc(callDoc, {
            callerId: myUserId,
            calleeId: peerId,
            status: 'ringing' as CallStatus,
            offer: { type: offer.type, sdp: offer.sdp },
            createdAt: serverTimestamp(),
        });


        // Update Call Id vào story
        if (storyId) {
            updateStory({
                callId: callDoc.id,
            })
        }


        unsubCallSnapshot.current = onSnapshot(callDoc, async (snap) => {
            const data: any = snap.data();
            if (!data) return;
            setCallStatus(data.status as CallStatus);

            if (data.status === 'declined') {
                Alert.alert('Cuộc gọi bị từ chối');
                await cleanup();
                return;
            }
            if (data.status === 'ended') {
                Alert.alert('Cuộc gọi đã kết thúc');
                await cleanup();
                return;
            }

            if (data.answer && pc && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                callerRemoteDescSetRef.current = true;

                if (pendingCalleeCandidatesRef.current.length) {
                    for (const c of pendingCalleeCandidatesRef.current) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(c));
                        } catch (e) {
                            console.warn('caller flush callee ICE', e);
                        }
                    }
                    pendingCalleeCandidatesRef.current = [];
                }
            }
        });

        onSnapshot(calleeCandidatesCol, (snap) => {
            snap.docChanges().forEach(async (c) => {
                if (c.type !== 'added') return;
                const data = c.doc.data();
                if (!callerRemoteDescSetRef.current) {
                    pendingCalleeCandidatesRef.current.push(data);
                    return;
                }
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data));
                } catch (e) {
                    console.warn('caller add callee ICE', e);
                }
            });
        });
    };

    const acceptCall = async () => {
        if (!incomingCall) return;

        await startLocalStream();
        await startRecording(); //bắt đầu record
        const pc = createPeerConnection();
        const callDoc = doc(db, 'calls', incomingCall.callId);
        callDocRef.current = callDoc;
        setCurrentCallId(incomingCall.callId);
        setIncomingCall(null);

        const snap = await getDoc(callDoc);
        if (!snap.exists()) {
            Alert.alert('Lỗi', 'Call không tồn tại');
            return;
        }

        const callData: any = snap.data();
        if (!callData.offer) {
            Alert.alert('Lỗi', 'Call chưa có offer');
            return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        calleeRemoteDescSetRef.current = true;

        if (pendingCallerCandidatesRef.current.length) {
            for (const c of pendingCallerCandidatesRef.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                    console.warn('callee flush caller ICE', e);
                }
            }
            pendingCallerCandidatesRef.current = [];
        }

        const callerCandidatesCol = collection(callDoc, 'callerCandidates');
        onSnapshot(callerCandidatesCol, (snap2) => {
            snap2.docChanges().forEach(async (ch) => {
                if (ch.type !== 'added') return;
                const data = ch.doc.data();
                if (!calleeRemoteDescSetRef.current) {
                    pendingCallerCandidatesRef.current.push(data);
                    return;
                }
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data));
                } catch (e) {
                    console.warn('callee add caller ICE', e);
                }
            });
        });

        const calleeCandidatesCol = collection(callDoc, 'calleeCandidates');
        (pc as any).onicecandidate = async (e: any) => {
            if (!e.candidate) return;
            try {
                await addDoc(calleeCandidatesCol, e.candidate.toJSON());
            } catch (err) {
                console.warn('add callee ICE', err);
            }
        };

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callDoc, {
            answer: { type: answer.type, sdp: answer.sdp },
            status: 'accepted' as CallStatus,
        });
        setCallStatus('accepted');

        if (unsubCallSnapshot.current) unsubCallSnapshot.current();
        unsubCallSnapshot.current = onSnapshot(callDoc, (s) => {
            const d: any = s.data();
            if (!d) return;
            if (d.status === 'ended' || d.status === 'declined') {
                Alert.alert('Cuộc gọi đã kết thúc');
                cleanup();
            }
        });
        // Điều hướng sang màn hình CallScreen sau khi accept thành công
        router.push({
            pathname: "/(tabs)/call_screen",
        });
    };

    const declineCall = async () => {
        if (!incomingCall) return;

        try {
            await updateDoc(doc(db, 'calls', incomingCall.callId), {
                status: 'declined' as CallStatus
            });
        } catch (e) {
            console.warn('decline error', e);
        } finally {
            setIncomingCall(null);
        }
    };

    const toggleMic = () => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach((t: any) => (t.enabled = !t.enabled));
        setMicEnabled((v) => !v);
    };

    const switchCamera = async () => {
        if (!localStreamRef.current) return;
        const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
        setCameraFacing(newFacing);

        const newStream = await mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: newFacing,
                width: 640,
                height: 480
            },
        } as any);

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldTracks = localStreamRef.current.getVideoTracks();
        oldTracks.forEach((t: any) => t.stop());
        if (oldTracks[0]) localStreamRef.current.removeTrack(oldTracks[0]);
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStreamUrl(localStreamRef.current.toURL());

        const sender = pcRef.current?.getSenders().find((s: any) => s.track && s.track.kind === 'video');
        if (sender) await sender.replaceTrack(newVideoTrack);
        newStream.getTracks().forEach((t) => t.stop());
    };

    const toggleSpeaker = async () => {
        try {
            const next = !speakerOn;
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: !next,
            });
            setSpeakerOn(next);
        } catch (e) {
            console.warn('toggleSpeaker error', e);
        }
    };

    const endCall = async () => {
        let transcript: string | null = null;

        const docRef = callDocRef.current;
        if (docRef) {
            try {
                await updateDoc(docRef, {
                    status: 'ended' as CallStatus,
                    endedAt: serverTimestamp()
                });
            } catch (err) {
                console.warn("endCall update error:", err);
            }
        }

        transcript = await stopRecording(docRef);

        await cleanup();

        if (transcript) {
            console.log("📌 Transcript saved:", transcript);
        }
    };

    const cleanup = async () => {
        try {
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t: any) => t.stop());
                localStreamRef.current = null;
            }
            setLocalStreamUrl(null);
            setRemoteStreamUrl(null);
            setCurrentCallId(null);
            setCallStatus(null);

            if (unsubCallSnapshot.current) {
                unsubCallSnapshot.current();
                unsubCallSnapshot.current = null;
            }

            callerRemoteDescSetRef.current = false;
            calleeRemoteDescSetRef.current = false;
            pendingCalleeCandidatesRef.current = [];
            pendingCallerCandidatesRef.current = [];

            if (callDocRef.current) {
                const cRef = callDocRef.current;
                const callerCandidates = await getDocs(collection(cRef, 'callerCandidates'));
                callerCandidates.forEach((d) => deleteDoc(d.ref));
                const calleeCandidates = await getDocs(collection(cRef, 'calleeCandidates'));
                calleeCandidates.forEach((d) => deleteDoc(d.ref));
                callDocRef.current = null;
            }
        } catch (err) {
            console.warn('cleanup error', err);
        }
    };

    const value: CallContextValue = {
        hasCam,
        hasMic,
        currentCallId,
        callStatus,
        incomingCall,
        localStreamUrl,
        remoteStreamUrl,
        micEnabled,
        speakerOn,
        cameraFacing,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMic,
        switchCamera,
        toggleSpeaker,
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};
