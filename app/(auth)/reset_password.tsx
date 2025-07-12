import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function ResetPassword() {
    const [email, setEmail] = useState("");

    const handleResetPassword = async () => {
        try {
            Alert.alert("Success", "Password reset email sent.");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDBD1", "#CDF2F9"]} style={styles.gradient} />
            <Image source={require("../../assets/images/NewUI/Background1.png")} style={styles.imageBackground} />
            <View style={styles.contentWrapper}>
                <View style={styles.logoWrapper}>
                    <Image
                        source={require("../../assets/images/NewUI/NewUI_Logo.png")}
                        style={styles.logoImage}
                    />
                </View>
                <Text style={styles.titleTxt}>Enter new password</Text>
                <View style={{ width: "100%" }}>
                    <TextInput
                        style={styles.emailInput}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <Text style={styles.resendEmailTxt}>Password reset email sent.</Text>
                <Text style={styles.resendEmailTxt}>Resend email?</Text>
                <View style={{ width: "100%" }}>
                    <TouchableOpacity style={styles.continueBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.continueTxt}>Continue</Text>
                    </TouchableOpacity>
                </View>
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
        paddingTop: 145,
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
        marginBottom: 24,
    },
    resendEmailTxt: {
        fontSize: 22,
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
});
