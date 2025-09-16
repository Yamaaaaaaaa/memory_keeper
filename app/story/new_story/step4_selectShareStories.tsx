import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { useStoryEditingStore } from "@/store/storyEditingStore"
import { screenRatio } from "@/utils/initScreen"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

export default function Step4_SelectShare() {
    const router = useTrackedRouter()

    // Get data from store safely
    const shareType = useStoryEditingStore((state) => state.shareType)
    const updateStory = useStoryEditingStore((state) => state.updateStory)

    const resetForNewShareType = (newShareType: "myself" | "me_plus_one") => {
        updateStory({
            shareType: newShareType,
            related_users: [],
            story_generated_date: new Date(),
            story_recited_date: new Date(),
            detail_story: "",
            sumary_story: "",
            call_id: "",
            conversation_id: "",
        })
    }

    const handleSelect = (selected: "myself" | "me_plus_one") => {
        if (selected === shareType) {
            // Same type → go to next
            goNext(selected)
            return
        }

        // Different type → warn user
        Alert.alert(
            "Warning",
            "If you change the share type, all related data will be reset. Do you want to continue?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Yes",
                    onPress: () => {
                        resetForNewShareType(selected)
                        goNext(selected)
                    },
                },
            ]
        )
    }

    const goNext = (selected: "myself" | "me_plus_one") => {
        if (selected === "myself") {
            router.push("/story/new_story/step4_2_selectChatPeopleOrAI")
        } else {
            router.push("/story/new_story/step5_selectColabType")
        }
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>
                        Who would you like to share your story with/tell your story to?
                    </Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            shareType === "myself" && styles.optionButtonActive,
                        ]}
                        onPress={() => handleSelect("myself")}
                    >
                        <Text style={styles.optionText}>Myself</Text>
                        <Image source={require("../../../assets/images/NewUI/myself.png")} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.optionButton,
                            shareType === "me_plus_one" && styles.optionButtonActive,
                        ]}
                        onPress={() => handleSelect("me_plus_one")}
                    >
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
    optionButtonActive: {
        backgroundColor: "#FEA366", // brighter color
    },
    optionText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        textAlign: "center",
        marginBottom: 16,
    },
})
