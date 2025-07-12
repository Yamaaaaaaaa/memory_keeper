import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import { screenRatio } from "@/utils/initScreen"
import React, { useEffect } from "react"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"

export default function Step6_Generate() {
    const params = useLocalSearchParams()
    const router = useTrackedRouter()

    useEffect(() => {
        console.log("=== STEP6 GENERATE PARAMS ===")
        console.log("All params:", params)
        console.log("Story Title:", params.storyTitle)
        console.log("Share Type:", params.shareType)
        console.log("Total Questions:", params.totalQuestions)
        console.log("Basic Questions:", params.basicQuestions)
        console.log("Follow Up Questions:", params.followUpQuestions)

        if (params.finalQA) {
            try {
                const finalQA = JSON.parse(params.finalQA as string)
                console.log("Final Q&A Array:", finalQA)
                console.log("Number of Q&A pairs:", finalQA.length)

                finalQA.forEach((qa: any, index: number) => {
                    console.log(`Q${index + 1}: ${qa.question}`)
                    console.log(`A${index + 1}: ${qa.answer}`)
                    console.log("---")
                })
            } catch (error) {
                console.log("Error parsing finalQA:", error)
            }
        }
        console.log("=== END PARAMS ===")
    }, [params])

    const handleViewTranscript = () => {
        console.log("View transcript clicked")
        // You can implement transcript view here
    }

    const handleSaveStory = () => {
        console.log("Save story clicked")
        // You can implement save story here
    }

    const handleGenerateStory = () => {
        console.log("Generate story clicked")
        router.push({
            pathname: "/story/new_story/step7_loadingGenerate",
            params: params
        })
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#353A3F", "#353A3F"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.iconContainer}>
                    <View style={styles.glowCircle}>
                        <Image source={require("../../../assets/images/NewUI/Group 70.png")} />
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>
                        Generate a story from our conversation or save your in-progress story for another day.
                    </Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleViewTranscript}>
                        <Text style={styles.actionButtonText}>View transcript</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleSaveStory}>
                        <Text style={styles.actionButtonText}>Save story</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleGenerateStory}>
                        <Text style={styles.actionButtonText}>Generate story</Text>
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
        paddingHorizontal: 30,
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
    storyInfoContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    storyTitleText: {
        color: "#FFFFFF",
        fontSize: 20,
        fontFamily: "Alberts",
        textAlign: "center",
        marginBottom: 8,
        fontWeight: "600",
    },
    storyStatsText: {
        color: "#CCCCCC",
        fontSize: 14,
        fontFamily: "Alberts",
        textAlign: "center",
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
        marginBottom: screenRatio >= 2 ? 60 : 30,
    },
    mainText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    buttonContainer: {
        paddingBottom: 50,
    },
    actionButton: {
        backgroundColor: "#EAF2F8",
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 1000,
        alignItems: "center",
        marginBottom: 15,
    },
    actionButtonText: {
        color: "#333",
        fontSize: screenRatio >= 2 ? 22 : 18,
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