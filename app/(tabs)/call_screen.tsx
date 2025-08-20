// 4. CallScreen.tsx - Màn hình call với đầy đủ tính năng
import { useCall } from '@/contexts/CallContext';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';

const CallScreen: React.FC = () => {
    const {
        currentCallId,
        callStatus,
        localStreamUrl,
        remoteStreamUrl,
        micEnabled,
        speakerOn,
        cameraFacing,
        toggleMic,
        switchCamera,
        toggleSpeaker,
        endCall,
    } = useCall();

    const navigation = useNavigation();

    useEffect(() => {
        // Navigate back when call ends
        if (!currentCallId || callStatus === 'ended' || callStatus === 'declined') {
            navigation.goBack();
        }
    }, [currentCallId, callStatus, navigation]);

    const handleEndCall = async () => {
        await endCall();
        router.push("/(tabs)")
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.callId}>Call ID: {currentCallId}</Text>
                <Text style={styles.status}>
                    {callStatus === 'ringing' ? 'Đang gọi...' :
                        callStatus === 'accepted' ? 'Đang kết nối' :
                            callStatus || '-'}
                </Text>
            </View>

            <View style={styles.videoContainer}>
                {remoteStreamUrl && (
                    <RTCView
                        streamURL={remoteStreamUrl}
                        style={styles.remoteVideo}
                        objectFit="cover"
                    />
                )}

                {localStreamUrl && (
                    <RTCView
                        streamURL={localStreamUrl}
                        style={styles.localVideo}
                        objectFit="cover"
                        mirror={cameraFacing === 'user'}
                    />
                )}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlButton, !micEnabled && styles.mutedButton]}
                    onPress={toggleMic}
                >
                    <Text style={styles.controlText}>
                        {micEnabled ? '🎤' : '🚫'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={switchCamera}
                >
                    <Text style={styles.controlText}>🔄</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, speakerOn && styles.activeButton]}
                    onPress={toggleSpeaker}
                >
                    <Text style={styles.controlText}>
                        {speakerOn ? '🔊' : '🔇'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endButton]}
                    onPress={handleEndCall}
                >
                    <Text style={styles.controlText}>📞</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    callId: {
        color: '#9adcff',
        fontSize: 14,
        marginBottom: 4,
    },
    status: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    videoContainer: {
        flex: 1,
        position: 'relative',
    },
    remoteVideo: {
        flex: 1,
        backgroundColor: '#1c1c1e',
    },
    localVideo: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 120,
        height: 160,
        backgroundColor: '#000',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 30,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2d2d2d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mutedButton: {
        backgroundColor: '#e24848',
    },
    activeButton: {
        backgroundColor: '#4CAF50',
    },
    endButton: {
        backgroundColor: '#e24848',
    },
    controlText: {
        fontSize: 24,
    },
});

export default CallScreen;
