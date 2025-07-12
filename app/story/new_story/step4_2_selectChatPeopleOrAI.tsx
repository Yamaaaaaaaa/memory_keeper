import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import { screenRatio } from "@/utils/initScreen"
import React from "react";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";

export default function Step4_2_ChatWithPeoPleOrAI() {
    const params = useLocalSearchParams()
    const router = useTrackedRouter()

    const handleChatWithAI = () => {
        router.push({
            pathname: "/story/new_story/step4_3_chatWithAI",
            params: {
                previousQA: params.basicQA,
                storyTitle: params.storyTitle,
                shareType: params.shareType
            }
        })
    }

    const handleChatWithPeople = () => {
        // Navigate to different flow for sharing with friends/family
        router.push({
            pathname: "/story/new_story/step4_3_chatWithAI",
            params: {
                basicQA: params.basicQA,
                storyTitle: params.storyTitle,
                shareType: params.shareType
            }
        })
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#353A3F", "#353A3F"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>
                        Thank you for your answers, they will help us guide your storytelling.
                    </Text>
                </View>
                <View style={styles.iconContainer}>
                    <View style={styles.glowCircle}>
                        <Image source={require("../../../assets/images/NewUI/Group 72.png")} />
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>
                        The next step is deciding whether you would like to tell your first story to a friend, a family member, or to yourself (with Memory Keeper as your guide).
                    </Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleChatWithPeople}>
                        <Text style={styles.actionButtonText}>To a friend or a family member</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleChatWithAI}>
                        <Text style={styles.actionButtonText}>To myself, guided by Memory Keeper</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

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
        paddingHorizontal: screenRatio >= 2 ? 30 : 20,
        paddingTop: screenRatio >= 2 ? 60 : 30,
    },
    closeButton: {
        alignSelf: "flex-end",
        marginBottom: screenRatio >= 2 ? 60 : 30,
    },
    closeText: {
        fontSize: screenRatio >= 2 ? 35 : 30,
        color: "#999",
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: screenRatio >= 2 ? 40 : 20,
    },
    glowCircle: {
        paddingVertical: screenRatio >= 2 ? 58 : 40,
        paddingHorizontal: screenRatio >= 2 ? 50 : 30,
        borderRadius: 1000,
        backgroundColor: "#FFD700",
        justifyContent: "center",
        alignItems: "center",
    },
    iconText: {
        fontSize: 35,
    },
    textContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 60,
    },
    mainText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 16,
        fontFamily: "Alberts",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    buttonContainer: {
        paddingBottom: 50,
    },
    actionButton: {
        backgroundColor: "#303336",
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 1000,
        alignItems: "center",
        marginBottom: 15,
    },
    actionButtonText: {
        color: "#FEF4F6",
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Alberts",
    },
    generateButton: {
        backgroundColor: "#E5E5E5",
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: "center",
    },
    generateButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "500",
    },
})