import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import { screenRatio } from "@/utils/initScreen"
import React from "react";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";

export default function Step4_SelectShare() {
    const params = useLocalSearchParams()
    const router = useTrackedRouter()

    const handleSelectOption = (shareType: string) => {
        router.push({
            pathname: "/story/new_story/step4_2_selectChatPeopleOrAI",
            params: {
                basicQA: params.basicQA,
                storyTitle: params.storyTitle,
                shareType: shareType // "myself" hoặc "me_plus_one"
            }
        })
    }
    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Who would you like to share your story with/tell your story to?</Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.optionButton} onPress={() => handleSelectOption("myself")}>
                        <Text style={styles.optionText}>Myself</Text>
                        <Image source={require("../../../assets/images/NewUI/myself.png")} />


                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionButton} onPress={() => handleSelectOption("me_plus_one")}>
                        <Text style={styles.optionText}>Me plus one</Text>
                        <Image source={require("../../../assets/images/NewUI/meplusone.png")} />

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
