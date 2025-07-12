import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Image } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [modalVisible, setModalVisible] = useState(false);

    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Success", "Password reset email sent.");
            // router.push("/(auth)/reset_password");
            router.replace("/(auth)/login")
            setModalVisible(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDBD1", "#CDF2F9"]} style={styles.gradient} />
            <Image source={require("../../assets/images/NewUI/Background1.png")} style={styles.imageBackground} />
            <View style={styles.contentWrapper}>
                <View style={{ width: "100%" }}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => { router.back(); }}>
                        {/* <Image source={require("../../assets/images/NewUI/Background1.png")} /> */}
                        <Text style={styles.backTxt}>Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.logoWrapper}>
                    <Image
                        source={require("../../assets/images/NewUI/NewUI_Logo.png")}
                        style={styles.logoImage}
                    />
                </View>
                <Text style={styles.titleTxt}>What’s your email?</Text>
                <View style={{ width: "100%" }}>
                    <TextInput
                        style={styles.emailInput}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <View style={{ width: "100%" }}>
                    <TouchableOpacity style={styles.continueBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.continueTxt}>Continue</Text>
                    </TouchableOpacity>
                </View>


                <Modal transparent visible={modalVisible} animationType="fade">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Reset Password?</Text>
                            <Text style={styles.modalDescription}>You will receive an email with instructions to reset your password.</Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalActionBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: "red" }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalActionBtn} onPress={handleResetPassword}>
                                    <Text style={{ color: "blue" }}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    imageBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
        opacity: 0.9,
    },
    contentWrapper: {
        zIndex: 2,
        width: "100%",
        alignItems: "center",
        paddingTop: 64,
        paddingHorizontal: 6,
    },
    backBtn: {
        marginBottom: 50,
    },
    backTxt: {
        fontSize: 22,
        fontFamily: "Alberts",
        marginLeft: 12,
    },
    logoWrapper: {
        alignItems: "center",
    },
    logoImage: {
    },
    titleTxt: {
        marginTop: 24,
        fontSize: 28,
        fontWeight: "700",
        fontFamily: "Alberts",
    },
    emailInput: {
        marginTop: 30,
        height: 44,
        backgroundColor: "#FEF4F6",
        borderRadius: 12,
        marginHorizontal: 36,
        fontFamily: "Alberts",
    },
    continueBtn: {
        marginTop: 60,
        paddingHorizontal: 62,
    },
    continueTxt: {
        backgroundColor: "#353A3F",
        alignItems: "center",
        textAlign: "center",
        paddingVertical: 16,
        borderRadius: 1000,

        color: "#FEF4F6",
        fontSize: 22,
        fontFamily: "Alberts",
    },

    modalContainer: {
        flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"
    },
    modalTitle: {
        fontSize: 14,
        fontFamily: "Alberts",
        fontWeight: "bold",
        textAlign: "center",
    },
    modalDescription: {
        fontSize: 14,
        fontWeight: "400",
        fontFamily: "Alberts",
        textAlign: "center",
    },
    modalContent: {
        width: 265, height: 140, backgroundColor: "#fff", borderRadius: 12, paddingTop: 24,
    },
    modalActions: {
        flexDirection: "row", justifyContent: "space-between", marginTop: 18
    },
    modalActionBtn: {
        width: "50%",
        fontSize: 15,
        fontWeight: "400",
        fontFamily: "Alberts",
        alignItems: "center",
        justifyContent: "center",
        padding: 14
    },
});
