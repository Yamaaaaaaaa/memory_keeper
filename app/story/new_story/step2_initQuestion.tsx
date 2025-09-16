import { useTrackedRouter } from "@/hooks/useTrackedRouter";
import { useStoryEditingStore } from "@/store/storyEditingStore"; // ✅ import store
import { screenRatio } from "@/utils/initScreen";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

const questions = [
    "What is this story about?",
    "Who are the key people in this story?",
    "When did this story take place?",
    "Describe the key moments of this story?",
]

export default function Step2_Questions() {
    const story = useStoryEditingStore((s) => s) // lấy toàn bộ state
    const updateStory = useStoryEditingStore((s) => s.updateStory) // setter

    const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""))
    const [storyTitle, setStoryTitle] = useState<string>("")
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null)

    const router = useTrackedRouter()

    // ✅ Khi mount: nếu trong store có story thì load ra câu trả lời
    useEffect(() => {
        if (!story || !story.id) {
            return
        }

        // gán lại storyTitle
        if (story.title) setStoryTitle(story.title)

        // map answers từ initQuestions (nếu có)
        if (story.initQuestions && story.initQuestions.length > 0) {
            const existingAnswers = questions.map((q) => {
                const found = story.initQuestions.find((qa) => qa.question === q)
                return found ? found.answer : ""
            })
            setAnswers(existingAnswers)
        }
    }, [story])

    const handleAnswerChange = (text: string, index: number) => {
        const newAnswers = [...answers]
        newAnswers[index] = text
        setAnswers(newAnswers)
    }

    const handleErase = (index: number) => {
        const newAnswers = [...answers]
        newAnswers[index] = ""
        setAnswers(newAnswers)
    }

    const handleComplete = () => {
        // tạo mảng Q&A
        const questionAnswerPairs = questions.map((question, idx) => ({
            id: "",
            question,
            answer: answers[idx],
        }))

        // ✅ lưu vào store
        updateStory({
            title: storyTitle,
            initQuestions: questionAnswerPairs,
        })

        // điều hướng sang step3
        router.push({
            pathname: "/story/new_story/step3_startStory",
        })
    }

    if (!story || !story.id) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Có lỗi xảy ra, hãy thoát và kiểm tra lại</Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"} // iOS dùng padding, Android height
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // tuỳ chỉnh cho header
        >
            <View style={styles.container}>
                <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
                <View style={styles.containerWrapper}>
                    <View style={styles.header}>
                        <TextInput
                            style={styles.title}
                            value={storyTitle}
                            onChangeText={setStoryTitle}
                            placeholder="Enter Story Title"
                        />
                        <Image source={require("../../../assets/images/NewUI/pen.png")} style={styles.headerIcon} />
                    </View>

                    <ScrollView style={styles.conversationContainer} showsVerticalScrollIndicator={false}>
                        {questions.map((q, index) => (
                            <View key={index} style={styles.questionAnswerPair}>
                                <View style={styles.questionBubble}>
                                    <Text style={styles.questionText}>{q}</Text>
                                </View>

                                <View style={styles.answerBubbleContainer}>
                                    <TouchableOpacity
                                        style={[styles.answerBubble, selectedAnswerIndex === index && styles.selectedAnswerBubble]}
                                        onPress={() => setSelectedAnswerIndex(index === selectedAnswerIndex ? null : index)}
                                        activeOpacity={0.8}
                                    >
                                        <TextInput
                                            style={styles.answerInput}
                                            value={answers[index]}
                                            onChangeText={(text) => handleAnswerChange(text, index)}
                                            placeholder="Type your answer here..."
                                            multiline
                                            textAlignVertical="top"
                                            onFocus={() => setSelectedAnswerIndex(index)}
                                        />
                                    </TouchableOpacity>

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
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}

                        {/* Nút Complete */}
                        <TouchableOpacity
                            style={[styles.typeButton, { marginTop: 20, alignSelf: "flex-end", backgroundColor: "#FEA366", marginBottom: 20 }]}
                            onPress={handleComplete}
                        >
                            <Text style={[styles.typeButtonText, { color: "black" }]}>Complete</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { ...StyleSheet.absoluteFillObject },
    containerWrapper: { flex: 1, paddingTop: screenRatio >= 2 ? 60 : 30 },
    header: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: screenRatio >= 2 ? 20 : 10 },
    headerIcon: { width: 20, height: 20 },
    title: { fontSize: screenRatio >= 2 ? 28 : 26, fontFamily: "Alberts", color: "#333", marginRight: 8 },
    conversationContainer: { flex: 1, paddingHorizontal: 24 },
    questionAnswerPair: {},
    questionBubble: { backgroundColor: "#66621C", padding: 20, borderRadius: 15, borderBottomLeftRadius: 0, marginBottom: 8, alignSelf: "flex-start", maxWidth: "80%", minWidth: "80%" },
    questionText: { color: "white", fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Judson", lineHeight: 22 },
    answerBubbleContainer: { alignSelf: "flex-end", maxWidth: "80%", minWidth: "80%" },
    answerBubble: { backgroundColor: "#FFFEDD", borderRadius: 15, padding: 20, borderBottomRightRadius: 0, marginBottom: 12 },
    selectedAnswerBubble: { backgroundColor: "#FFF8DC", borderWidth: 2, borderColor: "#FEA366" },
    answerInput: { fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Judson", color: "#000", minHeight: 80 },
    actionSection: {},
    actionButtonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginBottom: 8 },
    typeButton: { backgroundColor: "#FFDAB9", paddingVertical: 11, paddingHorizontal: 22, borderRadius: 100, flexDirection: "row" },
    typeButtonText: { color: "#597184", fontSize: screenRatio >= 2 ? 16 : 14, fontFamily: "Alberts" },
    controlButtonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
    buttonIcon: { width: 14, height: 14, marginLeft: 8 },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: { fontSize: 18, color: "red", fontFamily: "Alberts" },
})
