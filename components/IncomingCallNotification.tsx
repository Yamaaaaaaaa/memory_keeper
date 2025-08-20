// 2. IncomingCallNotification.tsx - Component thông báo cuộc gọi đến
import { useCall } from '@/contexts/CallContext';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const IncomingCallNotification: React.FC = () => {
    const { incomingCall, acceptCall, declineCall } = useCall();

    if (!incomingCall) return null;

    return (
        <Modal visible={true} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.callCard}>
                    <Text style={styles.title}>Cuộc gọi đến</Text>
                    <Text style={styles.caller}>Từ: {incomingCall.callerName}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={declineCall}
                        >
                            <Text style={styles.buttonText}>Từ chối</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={acceptCall}
                        >
                            <Text style={styles.buttonText}>Chấp nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    callCard: {
        backgroundColor: '#1c1c1e',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    caller: {
        fontSize: 16,
        color: '#9adcff',
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 80,
    },
    declineButton: {
        backgroundColor: '#e24848',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
});

