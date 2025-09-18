import { useTrackedRouter } from "@/hooks/useTrackedRouter";
import { useStoryEditingStore } from "@/store/storyEditingStore";
import { screenRatio } from "@/utils/initScreen";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Step5_SelectColabType() {
    const router = useTrackedRouter()
    const updateStory = useStoryEditingStore((state) => state.updateStory)

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Select Type Story</Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.optionButton}
                        onPress={() => {
                            updateStory({
                                typeStory: "call",
                            })
                            router.push({
                                pathname: "/story/new_story/step5_1_selectTypeCall",

                            })
                        }}>
                        <Text style={styles.optionText}>Call</Text>
                        <Image source={require("../../../assets/images/NewUI/voice-cricle.png")} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionButton} onPress={() => {
                        router.push({
                            pathname: "/story/new_story/step5_2_selectPersonChat",
                        })
                        updateStory({
                            typeStory: "chat",
                        })
                    }}>
                        <Text style={styles.optionText}>Chat</Text>
                        <Image source={require("../../../assets/images/NewUI/videocall.png")} />
                    </TouchableOpacity>
                </View>
            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    contentWrapper: {
        zIndex: 2,
        width: "100%",
        gap: 20,
    },
    questionContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    questionText: {
        fontSize: 22,
        textAlign: "center",
        fontWeight: "400",
    },
    optionsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        paddingBottom: 100,
        gap: 20,
    },
    optionButton: {
        backgroundColor: "#353A3F",
        height: 120,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    optionIcon: {
        fontSize: 30,
        marginBottom: 10,
    },
    optionText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        textAlign: "center",
        marginBottom: 16,
    },
})
