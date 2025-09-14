import { auth, db } from '@/firebase/firebaseConfig';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;
console.log('====================================');
console.log("screenHeight", screenHeight);
console.log("screenWidth", screenWidth);
console.log("screenHeight/screenWidth", screenHeight / screenWidth);
console.log('====================================');

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleRegister = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 👉 Save user info to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                username: username,
                createdAt: new Date()
            });
            setLoading(true);
            Alert.alert("Success", "You have signed up successfully!");
            router.replace('/(tabs)'); // navigate to the main screen after signing up
        } catch (error: any) {
            Alert.alert('Sign Up Error', error.message);
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
                        SIGN UP
                    </Text>
                    <View style={styles.inputItem}>
                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput value={username} onChangeText={setUsername} style={styles.inputEnterText} />
                    </View>
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
                    onPress={handleRegister}
                    disabled={loading}
                    style={styles.loginBtn}
                >
                    <Text style={styles.loginTxt}>
                        {loading ? "Signing up..." : "SIGN UP"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.line}></View>

                <View style={styles.othersloginView}>
                    <TouchableOpacity
                        style={styles.itemOthersLoginBtn}
                        onPress={() => Alert.alert("Sign up with Facebook")}
                    >
                        <Image source={require("../../assets/images/NewUI/fb_icon.png")} style={styles.itemOthersLoginIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.itemOthersLoginBtn}
                        onPress={() => Alert.alert("Sign up with Google")}
                    >
                        <Image source={require("../../assets/images/NewUI/gm_icon.png")} style={styles.itemOthersLoginIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.itemOthersLoginBtn}
                        onPress={() => Alert.alert("Sign up with Apple Account")}
                    >
                        <Image source={require("../../assets/images/NewUI/apple_icon.png")} style={styles.itemOthersLoginIcon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.turnRegisterView}>
                    <Text style={styles.turnRegisterTxt}>
                        Already a user?
                    </Text>
                    <TouchableOpacity onPress={() => router.push("/(auth)/login")} >
                        <Text style={styles.turnRegisterBtn}>LOG IN</Text>
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
        gap: screenHeight / screenWidth >= 2 ? 12 : 8,
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
        marginTop: screenHeight / screenWidth >= 2 ? 53 : 20,
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
        marginTop: screenHeight / screenWidth >= 2 ? 58 : 20,
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
