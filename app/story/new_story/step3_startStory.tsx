import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import React from "react";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";

export default function Step3_StartStory() {
    const params = useLocalSearchParams()
    const storyTitle = params.storyTitle as string || "Untitled Story"
    const router = useTrackedRouter()

    const handleStartStory = () => {
        router.push({
            pathname: "/story/new_story/step4_selectShareStories",
            params: {
                basicQA: params.basicQA,
                storyTitle: params.storyTitle
            }
        })
    }

    const handleSkipToGenerate = () => {
        router.push({
            pathname: "/story/new_story/step6_generateScreen",
            params: {
                basicQA: params.basicQA,
                storyTitle: params.storyTitle
            }
        })
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.headerContainer}>
                    <Text style={styles.headerText}>{storyTitle}</Text>
                    <Image source={require("../../../assets/images/NewUI/pen.png")} style={styles.headerIcon} />
                </View>
                <View style={styles.iconContainer}>
                    <View style={styles.glowCircle}>
                        <Image source={require("../../../assets/images/NewUI/Group 71.png")} style={styles.iconImage} />
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.startButton} onPress={handleStartStory}>
                        <Text style={styles.startButtonText}>Start story</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity style={styles.startButton} onPress={handleSkipToGenerate}>
                        <Text style={styles.startButtonText}>Skip to Generate</Text>
                    </TouchableOpacity> */}
                </View>
            </View>
        </View>
    )
}

// styles remain the same...
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
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 125,
    },
    headerText: {
        fontSize: 28,
        fontFamily: "Alberts",
        marginRight: 10,
    },
    headerIcon: {
        width: 20,
        height: 20,
    },
    iconContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 44,
    },
    glowCircle: {
        paddingVertical: 48,
        paddingHorizontal: 45,
        borderRadius: 1000,
        backgroundColor: "#FFB366",
        justifyContent: "center",
        alignItems: "center",
    },
    iconImage: {
    },
    buttonContainer: {
        alignItems: "center",
        paddingBottom: 50,
    },
    startButton: {
        backgroundColor: "#4A4A4A",
        paddingVertical: 20,
        paddingHorizontal: 60,
        borderRadius: 1000,
        marginBottom: 15,
        alignItems: "center",
    },
    startButtonText: {
        color: "white",
        fontSize: 22,
        fontFamily: "Alberts",
    },
})