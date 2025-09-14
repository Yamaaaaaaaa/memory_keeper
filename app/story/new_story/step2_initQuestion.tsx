import { useTrackedRouter } from "@/hooks/useTrackedRouter";
import { screenRatio } from "@/utils/initScreen";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const questions = [
    "What is this story about?",
    "Who are the key people in this story?",
    "When did this story take place?",
    "Describe the key moments of this story?",
]

export default function Step2_Questions() {
    const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""))
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [storyTitle, setStoryTitle] = useState<string>("")
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null) // New state for selected answer
    const router = useTrackedRouter()

    const handleAnswerChange = (text: string, index: number) => {
        const newAnswers = [...answers]
        newAnswers[index] = text
        setAnswers(newAnswers)
    }

    const handleAnswerBubblePress = (index: number) => {
        setSelectedAnswerIndex(index === selectedAnswerIndex ? null : index) // Toggle selection
    }

    const handleNext = (index: number) => {
        if (answers[index].trim()) {
            if (index < questions.length - 1) {
                setCurrentQuestionIndex(index + 1)
                setSelectedAnswerIndex(null) // Clear selection when moving to next question
            } else {
                // All questions answered, create Q&A pairs and navigate to next step
                const questionAnswerPairs = questions.map((question, idx) => ({
                    question: question,
                    answer: answers[idx],
                }))
                router.push({
                    pathname: "/story/new_story/step3_startStory",
                    params: {
                        basicQA: JSON.stringify(questionAnswerPairs),
                        storyTitle: storyTitle,
                    },
                })
            }
        }
    }

    const handleErase = (index: number) => {
        const newAnswers = [...answers]
        newAnswers[index] = ""
        setAnswers(newAnswers)
    }


    const questionsToShow = currentQuestionIndex + 1

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.containerWrapper}>
                <View style={styles.header}>
                    <TextInput style={styles.title} onChangeText={setStoryTitle} placeholder="Enter Story Title">
                        {storyTitle}
                    </TextInput>
                    <Image source={require("../../../assets/images/NewUI/pen.png")} style={styles.headerIcon} />
                </View>

                <ScrollView style={styles.conversationContainer} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: questionsToShow }).map((_, index) => (
                        <View key={index} style={styles.questionAnswerPair}>
                            <View style={styles.questionBubble}>
                                <Text style={styles.questionText}>{questions[index]}</Text>
                            </View>

                            <View style={styles.answerBubbleContainer}>
                                <TouchableOpacity
                                    style={[styles.answerBubble, selectedAnswerIndex === index && styles.selectedAnswerBubble]}
                                    onPress={() => handleAnswerBubblePress(index)}
                                    activeOpacity={0.8}
                                >
                                    <TextInput
                                        style={styles.answerInput}
                                        value={answers[index]}
                                        onChangeText={(text) => handleAnswerChange(text, index)}
                                        placeholder="Type your answer here..."
                                        multiline
                                        textAlignVertical="top"
                                        autoFocus={index === currentQuestionIndex}
                                        onFocus={() => setSelectedAnswerIndex(index)} // Auto-select when focused
                                    />
                                </TouchableOpacity>

                                {/* Only show action buttons for selected answer */}
                                {selectedAnswerIndex === index && (
                                    <View style={styles.actionSection}>
                                        <View style={styles.actionButtonsRow}>
                                            <TouchableOpacity style={styles.typeButton}>
                                                <Text style={styles.typeButtonText}>Type</Text>
                                                <Image source={require("../../../assets/images/NewUI/pen.png")} style={styles.buttonIcon} />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.typeButton}>
                                                <Text style={styles.typeButtonText}>Speak</Text>
                                                <Image source={require("../../../assets/images/NewUI/pen.png")} style={styles.buttonIcon} />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.controlButtonsRow}>
                                            <TouchableOpacity style={styles.typeButton} onPress={() => handleErase(index)}>
                                                <Text style={styles.typeButtonText}>Erase</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.typeButton, !answers[index].trim() && styles.disabledButton]}
                                                onPress={() => handleNext(index)}
                                                disabled={!answers[index].trim()}
                                            >
                                                <View style={styles.nextButtonView}>
                                                    <Text style={styles.typeButtonText}>
                                                        {index === questions.length - 1 ? "Complete" : "Next"}
                                                    </Text>
                                                    <Image
                                                        source={require("../../../assets/images/NewUI/chev_black.png")}
                                                        style={styles.buttonIcon}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    containerWrapper: {
        flex: 1,
        paddingTop: screenRatio >= 2 ? 60 : 30,
    },
    header: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: screenRatio >= 2 ? 40 : 20,
    },
    headerIcon: {
        width: 20,
        height: 20,
    },
    title: {
        fontSize: screenRatio >= 2 ? 28 : 26,
        fontFamily: "Alberts",
        color: "#333",
        marginRight: 8,
    },
    conversationContainer: {
        flex: 1,
        paddingHorizontal: 24,
        marginBottom: screenRatio >= 2 ? 60 : 50,
    },
    questionAnswerPair: {
        // marginBottom: screenRatio >= 2 ? 40 : 20,
    },
    questionBubble: {
        backgroundColor: "#66621C",
        padding: 20,
        borderRadius: 15,
        borderBottomLeftRadius: 0,
        marginBottom: 8,
        alignSelf: "flex-start",
        maxWidth: "80%",
        minWidth: "80%",
    },
    questionText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Judson",
        lineHeight: 22,
    },
    answerBubbleContainer: {
        alignSelf: "flex-end",
        maxWidth: "80%",
        minWidth: "80%",
    },
    answerBubble: {
        backgroundColor: "#FFFEDD",
        borderRadius: 15,
        padding: 20,
        borderBottomRightRadius: 0,
        marginBottom: 12,
    },
    selectedAnswerBubble: {
        backgroundColor: "#FFF8DC", // Slightly different color when selected
        borderWidth: 2,
        borderColor: "#FEA366", // Orange border for selected state
    },
    answerInput: {
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Judson",
        color: "#000",
        minHeight: 80,
    },
    actionSection: {
        // Animation could be added here for smooth appearance
    },
    actionButtonsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginBottom: 8,
    },
    typeButton: {
        backgroundColor: "#FFDAB9",
        paddingVertical: 11,
        paddingHorizontal: 22,
        borderRadius: 100,
        flexDirection: "row",
    },
    typeButtonText: {
        color: "#597184",
        fontSize: screenRatio >= 2 ? 16 : 14,
        fontFamily: "Alberts",
    },
    controlButtonsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    nextButton: {
        backgroundColor: "#FEA366",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    nextButtonView: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    buttonIcon: {
        width: 14,
        height: 14,
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: "#CCC",
    },
    nextButtonText: {
        fontSize: 16,
        fontFamily: "Alberts",
    },
})
