import { auth } from '@/firebase/firebaseConfig';
import { screenHeight, screenWidth } from '@/utils/initScreen';
import * as Contacts from 'expo-contacts';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState<boolean>(false);
    const [contacts, setContacts] = useState<any[]>([]);

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setLoading(true);
            Alert.alert("Success", "You have logged in successfully!");

            // ➕ Fetch contacts here
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers],
                });

                if (data.length > 0) {
                    setContacts(data);
                }
            } else {
                Alert.alert('Permission Denied', 'Cannot access contacts without permission.');
            }
            console.log("Contacts", contacts);
            router.replace('/(tabs)'); // navigate to main screen after login
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
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

                <View style={styles.inputWrapper}>
                    <Text style={styles.titleTxt}>
                        LOG IN
                    </Text>
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>
                            Email
                        </Text>
                        <TextInput value={email} onChangeText={setEmail} style={styles.inputEnterText} />
                    </View>
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>
                            Password
                        </Text>
                        <TextInput
                            placeholder=""
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.inputEnterText}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    style={styles.loginBtn}
                >
                    <Text style={styles.loginTxt}>
                        {loading ? "Signing in..." : "LOGIN"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/(auth)/forgot_password")} style={styles.forgotPassBtn} >
                    <Text style={styles.forgotPassTxt}>
                        Forgot Password?
                    </Text>
                </TouchableOpacity>

                <View style={styles.line}></View>

                <View style={styles.othersloginView}>
                    <TouchableOpacity
                        style={styles.itemOthersLoginBtn}
                        onPress={() => Alert.alert("Sign in with Facebook")}
                    >
                        <Image source={require("../../assets/images/NewUI/fb_icon.png")} style={styles.itemOthersLoginIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.itemOthersLoginBtn}
                        onPress={() => Alert.alert("Sign in with Google")}
                    >
                        <Image source={require("../../assets/images/NewUI/gm_icon.png")} style={styles.itemOthersLoginIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.itemOthersLoginBtn}
                        onPress={() => Alert.alert("Sign in with Apple Account")}
                    >
                        <Image source={require("../../assets/images/NewUI/apple_icon.png")} style={styles.itemOthersLoginIcon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.turnRegisterView}>
                    <Text style={styles.turnRegisterTxt}>
                        Need an account?
                    </Text>
                    <TouchableOpacity onPress={() => router.push("/(auth)/register")} >
                        <Text style={styles.turnRegisterBtn}>SIGN UP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        flexDirection: "column-reverse",
        paddingHorizontal: "12%",
        paddingBottom: 63,
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
    },
    logoWrapper: {
        alignItems: "center",
    },
    logoImage: {
    },
    titleTxt: {
        marginTop: screenHeight / screenWidth >= 2 ? 24 : 20,
        color: "#000a11",
        fontSize: 22,
        fontWeight: "600",
        fontFamily: "Alberts",
        marginBottom: screenHeight / screenWidth >= 2 ? 30 : 8,
    },
    inputWrapper: {
        gap: 12,
    },
    inputItem: {
    },
    inputLabel: {
        fontSize: screenHeight / screenWidth >= 2 ? 22 : 18,
        fontWeight: "500",
        fontFamily: "Alberts",
    },
    inputEnterText: {
        marginTop: 8,
        height: 44,
        width: "100%",
        backgroundColor: "white",
        borderRadius: 12,
    },
    loginBtn: {
        marginTop: screenHeight / screenWidth >= 2 ? 53 : 25,
        paddingHorizontal: 30,
    },
    loginTxt: {
        backgroundColor: "#353a3f",
        width: "100%",
        textAlign: "center",
        borderRadius: 1000,
        alignItems: "center",
        paddingVertical: 16,

        color: "#fef4f6",
        fontSize: 20,
        fontWeight: "500",
        fontFamily: "Alberts",
    },
    forgotPassBtn: {
        marginTop: 8,
        color: "#000a11",
        fontSize: 15,
    },
    forgotPassTxt: {
        fontFamily: "Alberts",
        fontSize: screenHeight / screenWidth >= 2 ? 18 : 16,
        textAlign: "center",
    },
    line: {
        marginTop: screenHeight / screenWidth >= 2 ? 58 : 29,
        height: 1,
        backgroundColor: "black",
        width: "100%",
    },
    othersloginView: {
        marginTop: screenHeight / screenWidth >= 2 ? 30 : 15,
        flexDirection: "row",
        gap: "10%",
        justifyContent: "center",
    },
    itemOthersLoginBtn: {
        width: 32,
        height: 32,
    },
    itemOthersLoginIcon: {
        resizeMode: "cover",
    },
    turnRegisterView: {
        marginTop: screenHeight / screenWidth >= 2 ? 40 : 20,
        flexDirection: "row",
        height: 26,
        alignItems: "flex-end",
        justifyContent: "center",
    },
    turnRegisterBtn: {
        fontFamily: "Alberts",
        fontWeight: "bold",
        fontSize: screenHeight / screenWidth >= 2 ? 22 : 16,
    },
    turnRegisterTxt: {
        fontFamily: "Alberts",
        marginRight: 8,
        fontSize: screenHeight / screenWidth >= 2 ? 22 : 16,
    }
});
