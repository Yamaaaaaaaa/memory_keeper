import { db } from "@/firebase/firebaseConfig";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";
import { useStoryEditingStore } from "@/store/storyEditingStore";
import { screenRatio } from "@/utils/initScreen";
import { LinearGradient } from "expo-linear-gradient";
import { addDoc, collection } from "firebase/firestore";
import React from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Step1_IntroScreen() {
    const router = useTrackedRouter()
    const updateStory = useStoryEditingStore((state) => state.updateStory);
    const clearStory = useStoryEditingStore((state) => state.clearStory)
    const handleCreateNewStory = async () => {
        try {
            // 1. Tạo story rỗng trong Firestore
            const docRef = await addDoc(collection(db, "stories"), {
                createdAt: new Date(),
            });
            clearStory();
            // 2. Lưu id vào store
            updateStory({
                id: docRef.id,
            });

            // 3. Điều hướng
            router.push("/story/new_story/step2_initQuestion");
        } catch (error) {
            console.error("Error creating story:", error);
        }
    };
    const handleContinue = () => {
        Alert.alert(
            "Choose an option",
            "Do you want to create a new story or edit an existing one?",
            [
                {
                    text: "Create new story",
                    onPress: handleCreateNewStory,
                },
                {
                    text: "Edit existing story",
                    onPress: () => {
                        router.push("/story/new_story/step1_1_chooseStoryToEdit")
                        clearStory();
                    },
                },
                { text: "Cancel", style: "cancel" }
            ]
        )
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#353A3F", "#353A3F"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.iconContainer}>
                    <LinearGradient colors={["#FFCC00", "#353A3F"]} style={styles.glowCircle}>
                        <View style={styles.iconWrapper}>
                            <Image source={require("../../../assets/images/NewUI/Group 68.png")} style={styles.iconImage} />
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>
                        Take a moment to reflect on that period of your life, and the experience that created your memory and formed your story.
                    </Text>
                    <Text style={styles.subText}>
                        Channel your reflections into the next 5 questions
                    </Text>
                </View>

                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.buttonText}>Continue</Text>
                    <Image source={require("../../../assets/images/NewUI/Chev_right.png")} style={styles.arrow} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

Step1_IntroScreen.options = {
    headerShown: false,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    contentWrapper: {
        zIndex: 2,
        width: "100%",
        flex: 1,
        paddingHorizontal: 56,
        paddingTop: screenRatio >= 2 ? 172 : 100,
        paddingBottom: screenRatio >= 2 ? 60 : 30,
    },
    iconContainer: {
        alignItems: "center",
    },
    iconImage: {
        width: screenRatio >= 2 ? 70 : 50,
        height: screenRatio >= 2 ? 70 : 50,
    },
    glowCircle: {
        width: screenRatio >= 2 ? 185 : 150,
        height: screenRatio >= 2 ? 185 : 150,
        borderRadius: 10000,
        justifyContent: "center",
        alignItems: "center",
    },
    iconWrapper: {
        justifyContent: "center",
        alignItems: "center",
    },
    iconText: {
        fontSize: 40,
    },
    textContainer: {
        flex: 1,
        justifyContent: "center",
    },
    mainText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        textAlign: "left",
        fontWeight: "400",
        marginBottom: 46,
    },
    subText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        textAlign: "left",
        opacity: 0.7,
    },
    continueButton: {
        backgroundColor: "#303336",
        paddingVertical: 16,
        paddingHorizontal: screenRatio >= 2 ? 80 : 50,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
    },
    buttonText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        marginRight: 10,
    },
    arrow: {
    },
})

