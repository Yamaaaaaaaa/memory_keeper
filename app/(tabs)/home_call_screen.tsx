// 3. StartCallScreen.tsx - Màn hình để nhập ID và bắt đầu cuộc gọi
import { useCall } from '@/contexts/CallContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const StartCallScreen: React.FC = () => {
    const [peerId, setPeerId] = useState('');
    const { startCall, hasCam, hasMic } = useCall();
    const router = useRouter()
    const handleStartCall = async () => {
        if (!peerId.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập ID người nhận');
            return;
        }

        if (!hasCam || !hasMic) {
            Alert.alert('Lỗi', 'Cần cấp quyền camera và microphone');
            return;
        }

        try {
            console.log('====================================');
            console.log("peerId.trim()", peerId.trim());
            console.log('====================================');
            await startCall(peerId.trim());
            // Navigate to call screen
            router.push('/(tabs)/call_screen');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Thực hiện cuộc gọi</Text>

            <View style={styles.statusContainer}>
                <Text style={styles.status}>
                    Camera: {hasCam ? '✅' : '❌'} • Mic: {hasMic ? '✅' : '❌'}
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>ID người nhận</Text>
                <TextInput
                    style={styles.input}
                    value={peerId}
                    onChangeText={setPeerId}
                    placeholder="Nhập ID người nhận"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                />
            </View>

            <TouchableOpacity
                style={styles.callButton}
                onPress={handleStartCall}
            >
                <Text style={styles.callButtonText}>Gọi</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#000',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    status: {
        color: '#9adcff',
        fontSize: 16,
    },
    inputContainer: {
        marginBottom: 30,
    },
    label: {
        color: '#bdbdbd',
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        backgroundColor: '#1c1c1e',
    },
    callButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    callButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default StartCallScreen;