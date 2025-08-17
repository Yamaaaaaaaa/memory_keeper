import { auth, db } from '@/firebase/firebaseConfig';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit, z
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
    mediaDevices,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCView,
} from 'react-native-webrtc';

const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

type CallStatus = 'ringing' | 'accepted' | 'declined' | 'ended';

export default function CallScreen() {
    // ---- UI / inputs
    const [myUserId, setMyUserId] = useState<string>(auth.currentUser?.uid || '');
    const [peerId, setPeerId] = useState<string>('');
    const [hasCam, setHasCam] = useState(false);
    const [hasMic, setHasMic] = useState(false);

    // ---- WebRTC state
    const [localStreamUrl, setLocalStreamUrl] = useState<string | null>(null);
    const [remoteStreamUrl, setRemoteStreamUrl] = useState<string | null>(null);
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);
    const [callStatus, setCallStatus] = useState<CallStatus | null>(null);

    // Controls
    const [micEnabled, setMicEnabled] = useState(true);
    const [speakerOn, setSpeakerOn] = useState(false); // Android
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

    // Refs
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<any>(null);
    const callDocRef = useRef<ReturnType<typeof doc> | null>(null);
    const unsubCallSnapshot = useRef<(() => void) | null>(null);
    const unsubIncomingWatcher = useRef<(() => void) | null>(null);

    // Flags + ICE buffers
    const callerRemoteDescSetRef = useRef(false);
    const calleeRemoteDescSetRef = useRef(false);
    const pendingCalleeCandidatesRef = useRef<any[]>([]);
    const pendingCallerCandidatesRef = useRef<any[]>([]);

    // ---- Permissions
    useEffect(() => {
        (async () => {
            const camPerm = await Camera.requestCameraPermissionsAsync();
            setHasCam(camPerm.status === 'granted');
            const micPerm = await Audio.requestPermissionsAsync();
            setHasMic(micPerm.status === 'granted');

            // default audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: true, // start with earpiece
            });
        })();

        return () => {
            cleanup();
            if (unsubIncomingWatcher.current) {
                unsubIncomingWatcher.current();
                unsubIncomingWatcher.current = null;
            }
        };
    }, []);

    // ---- Watch for incoming calls (ringing → this user)
    useEffect(() => {
        if (!myUserId) return;
        if (unsubIncomingWatcher.current) {
            unsubIncomingWatcher.current();
            unsubIncomingWatcher.current = null;
        }
        const qIncoming = query(
            collection(db, 'calls'),
            where('calleeId', '==', myUserId),
            where('status', '==', 'ringing'),
            limit(1)
        );
        unsubIncomingWatcher.current = onSnapshot(qIncoming, (snap) => {
            if (snap.empty) return;
            const docSnap = snap.docs[0];
            const data: any = docSnap.data();
            // Show incoming banner by putting call info into state
            setCurrentCallId(docSnap.id);
            callDocRef.current = doc(db, 'calls', docSnap.id);
            setCallStatus(data.status as CallStatus);
            Alert.alert('Incoming Call', `From: ${data.callerId}`, [
                { text: 'Decline', onPress: () => declineCall(docSnap.id) },
                { text: 'Accept', onPress: () => acceptCall(docSnap.id) },
            ]);
        });
        return () => {
            if (unsubIncomingWatcher.current) {
                unsubIncomingWatcher.current();
                unsubIncomingWatcher.current = null;
            }
        };
    }, [myUserId]);

    // ---- Media helpers
    const startLocalStream = async (facing: 'user' | 'environment' = cameraFacing) => {
        if (localStreamRef.current) return;
        try {
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: { facingMode: facing, width: 640, height: 480 },
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

    // ======================================================
    // Caller: start a call → create offer, status=ringing
    // ======================================================
    const startCall = async () => {
        if (!myUserId || !peerId) {
            Alert.alert('Thiếu thông tin', 'Hãy nhập myUserId và peerId');
            return;
        }

        await startLocalStream();
        const pc = createPeerConnection();

        // create firestore call doc
        const callDoc = doc(collection(db, 'calls'));
        callDocRef.current = callDoc;
        setCurrentCallId(callDoc.id);
        setCallStatus('ringing');

        const callerCandidatesCol = collection(callDoc, 'callerCandidates');
        const calleeCandidatesCol = collection(callDoc, 'calleeCandidates');

        // push ICE from caller
        (pc as any).onicecandidate = async (e: any) => {
            if (e.candidate) {
                try {
                    await addDoc(callerCandidatesCol, e.candidate.toJSON());
                } catch (err) {
                    console.warn('add caller ICE error', err);
                }
            }
        };

        // create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // write offer + meta
        await setDoc(callDoc, {
            callerId: myUserId,
            calleeId: peerId,
            status: 'ringing' as CallStatus,
            offer: { type: offer.type, sdp: offer.sdp },
            createdAt: serverTimestamp(),
        });

        // ---- Create story right away
        try {
            const ownerId = auth.currentUser?.uid || myUserId;
            await addDoc(collection(db, 'stories'), {
                callId: callDoc.id,
                ownerId,
                related_users: [myUserId, peerId],
                title: '',
                summaryStory: '',
                thumbnail_url: '',
                shareType: 'myself',
                story_generated_date: new Date().toISOString(),
                story_recited_date: '',
                typeContact: 'call',
                processing: 0,
            });
        } catch (e) {
            console.warn('create story error', e);
        }

        // listen for answer / status updates
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

            // when accepted, callee has put answer
            if (data.answer && pc && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                callerRemoteDescSetRef.current = true;
                // flush buffered ICE from callee
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

        // listen to callee ICE
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

        Alert.alert('Calling...', `Call ID: ${callDoc.id}`);
    };

    // ======================================================
    // Callee: accept (create answer) / decline
    // ======================================================
    const acceptCall = async (callIdParam?: string) => {
        const callId = callIdParam || currentCallId;
        if (!callId) return;

        await startLocalStream();
        const pc = createPeerConnection();

        const callDoc = doc(db, 'calls', callId);
        callDocRef.current = callDoc;

        // 1) get offer set remote desc BEFORE listening caller ICE
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

        // flush any buffered caller ICE (if any)
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

        // 2) subscribe caller ICE
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

        // 3) push callee ICE
        const calleeCandidatesCol = collection(callDoc, 'calleeCandidates');
        (pc as any).onicecandidate = async (e: any) => {
            if (!e.candidate) return;
            try {
                await addDoc(calleeCandidatesCol, e.candidate.toJSON());
            } catch (err) {
                console.warn('add callee ICE', err);
            }
        };

        // 4) create answer + update status 'accepted'
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callDoc, {
            answer: { type: answer.type, sdp: answer.sdp },
            status: 'accepted' as CallStatus,
        });

        setCurrentCallId(callId);
        setCallStatus('accepted');

        // Listen for end/other updates from caller
        if (unsubCallSnapshot.current) unsubCallSnapshot.current();
        unsubCallSnapshot.current = onSnapshot(callDoc, (s) => {
            const d: any = s.data();
            if (!d) return;
            if (d.status === 'ended' || d.status === 'declined') {
                Alert.alert('Cuộc gọi đã kết thúc');
                cleanup();
            }
        });
    };

    const declineCall = async (callIdParam?: string) => {
        const callId = callIdParam || currentCallId;
        if (!callId) return;
        try {
            await updateDoc(doc(db, 'calls', callId), { status: 'declined' as CallStatus });
        } catch (e) {
            console.warn('decline error', e);
        } finally {
            // just clear local UI; caller will handle cleanup
            setCurrentCallId(null);
            setCallStatus(null);
        }
    };

    // ======================================================
    // Controls
    // ======================================================
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
            video: { facingMode: newFacing, width: 640, height: 480 },
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
        // Android only (Expo)
        try {
            const next = !speakerOn;
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: !next, // false => use speaker
            });
            setSpeakerOn(next);
        } catch (e) {
            console.warn('toggleSpeaker error', e);
        }
    };

    const endCall = async () => {
        // inform other party
        if (callDocRef.current) {
            try {
                await updateDoc(callDocRef.current, { status: 'ended' as CallStatus, endedAt: serverTimestamp() });
            } catch { }
        }
        await cleanup();
        setCurrentCallId(null);
        setCallStatus(null);
        setRemoteStreamUrl(null);
    };

    // ======================================================
    // Cleanup
    // ======================================================
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

            if (unsubCallSnapshot.current) {
                unsubCallSnapshot.current();
                unsubCallSnapshot.current = null;
            }

            callerRemoteDescSetRef.current = false;
            calleeRemoteDescSetRef.current = false;
            pendingCalleeCandidatesRef.current = [];
            pendingCallerCandidatesRef.current = [];

            // Clean ICE docs & (optional) call doc — giữ lại call doc để log lịch sử, nên KHÔNG xóa.
            if (callDocRef.current) {
                const cRef = callDocRef.current;
                const callerCandidates = await getDocs(collection(cRef, 'callerCandidates'));
                callerCandidates.forEach((d) => deleteDoc(d.ref));
                const calleeCandidates = await getDocs(collection(cRef, 'calleeCandidates'));
                calleeCandidates.forEach((d) => deleteDoc(d.ref));
                // Nếu muốn xoá luôn doc call thì bật dòng dưới:
                // await deleteDoc(cRef);
                callDocRef.current = null;
            }
        } catch (err) {
            console.warn('cleanup error', err);
        }
    };

    // ======================================================
    // UI
    // ======================================================
    return (
        <View style={styles.container}>
            <Text style={styles.status}>
                Camera: {hasCam ? '✅' : '❌'} • Mic: {hasMic ? '✅' : '❌'}
            </Text>

            <View style={{ marginVertical: 8 }}>
                <Text style={styles.label}>My User ID</Text>
                <TextInput
                    placeholder="myUserId"
                    value={myUserId}
                    onChangeText={setMyUserId}
                    style={styles.input}
                    autoCapitalize="none"
                />
                <Text style={styles.label}>Peer (callee) ID</Text>
                <TextInput
                    placeholder="peerId"
                    value={peerId}
                    onChangeText={setPeerId}
                    style={styles.input}
                    autoCapitalize="none"
                />
                <Button title="Call" onPress={startCall} />
            </View>

            {currentCallId && (
                <View style={styles.callIdBox}>
                    <Text style={styles.callIdText}>
                        Call ID: {currentCallId} • {callStatus || '-'}
                    </Text>
                </View>
            )}

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
                {localStreamUrl && (
                    <RTCView
                        streamURL={localStreamUrl}
                        style={styles.localVideo}
                        objectFit="cover"
                        mirror={cameraFacing === 'user'}
                    />
                )}
                {remoteStreamUrl && (
                    <RTCView streamURL={remoteStreamUrl} style={styles.remoteVideo} objectFit="cover" />
                )}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.btn} onPress={toggleMic} disabled={!localStreamUrl}>
                    <Text style={styles.btnText}>{micEnabled ? 'Mute Mic' : 'Unmute Mic'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={switchCamera} disabled={!localStreamUrl}>
                    <Text style={styles.btnText}>Switch Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={toggleSpeaker} disabled={!localStreamUrl}>
                    <Text style={styles.btnText}>Speaker {speakerOn ? 'On' : 'Off'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.endBtn]} onPress={endCall}>
                    <Text style={[styles.btnText, { color: '#fff' }]}>End Call</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: '' },
    status: { color: '' },
    label: { marginTop: 6, marginBottom: 4, color: '#bdbdbd' },
    input: {
        borderWidth: 1,
        padding: 8,
        marginBottom: 8,
        borderColor: '#444',
        color: '#eaeaea',
        borderRadius: 8,
    },
    callIdBox: {
        padding: 8,
        backgroundColor: '#1c1c1e',
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    callIdText: { color: '#9adcff' },
    localVideo: {
        width: 120,
        height: 160,
        backgroundColor: '#000',
        marginRight: 10,
        borderRadius: 8,
    },
    remoteVideo: { flex: 1, height: 320, backgroundColor: '#000', borderRadius: 8 },
    controls: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
    btn: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 10,
        backgroundColor: '#2d2d2d',
        borderRadius: 10,
        alignItems: 'center',
    },
    endBtn: { backgroundColor: '#e24848', flexBasis: 110 },
    btnText: { color: '#eaeaea', fontWeight: '600' },
});
