import { auth } from "@/firebase/firebaseConfig"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { useStoryEditingStore } from "@/store/storyEditingStore"
import { screenRatio } from "@/utils/initScreen"
import axios from "axios"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native"

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_API_KEY

interface Message {
    id: string
    type: "question" | "answer" | "summary"
    content: string
    timestamp: string   // luôn là ISO string
    speaker: string     // 'bot' hoặc userId
}

export default function Step4_3_ChatWithAI() {
    const router = useTrackedRouter()
    const flatListRef = useRef<FlatList>(null)

    const {
        initQuestions,
        title,
        shareType: storeShareType,
        setConversation,
    } = useStoryEditingStore()

    const [messages, setMessages] = useState<Message[]>([])
    const [currentAnswer, setCurrentAnswer] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false)
    const [storyTitle] = useState(title || "Untitled Story")
    const [shareType] = useState(storeShareType || "")

    const currentUserId = auth.currentUser?.uid

    useEffect(() => {
        const initializeChat = () => {
            let initialMessages: Message[] = []

            if (initQuestions && initQuestions.length > 0) {
                const summaryContent = initQuestions
                    .map((qa) => `• ${qa.question}\n  → ${qa.answer}`)
                    .join("\n\n")

                const summaryMessage: Message = {
                    id: "summary",
                    type: "summary",
                    content: `Your story so far:\n\n${summaryContent}`,
                    timestamp: new Date().toISOString(),
                    speaker: "bot",
                }
                initialMessages.push(summaryMessage)
                setMessages(initialMessages)
                generateFollowUpQuestion(initialMessages, initQuestions)
            } else {
                const firstQuestion: Message = {
                    id: "first-q",
                    type: "question",
                    content: "Let's begin exploring your story. What would you like to tell me about?",
                    timestamp: new Date().toISOString(),
                    speaker: "bot",
                }
                setMessages([firstQuestion])
                setIsWaitingForAnswer(true)
            }
        }

        initializeChat()
    }, [initQuestions, title, storeShareType])

    const generateFollowUpQuestion = async (
        currentMessages: Message[],
        baseQA?: any[]
    ) => {
        setIsLoading(true)
        try {
            let contextInfo = ""
            if (baseQA && baseQA.length > 0) {
                contextInfo = baseQA.map((qa) => `${qa.question}: ${qa.answer}`).join("\n")
            }

            const systemMessage = {
                role: "system",
                content: `You are Memory Keeper, a warm and empathetic AI assistant helping users develop their personal stories and memories.

Story Title: "${storyTitle}"
Sharing Context: ${shareType === "myself"
                        ? "User wants to tell this story to themselves"
                        : "User wants to share this story with someone else"}

Context from their basic story information:
${contextInfo}

Your role:
- Ask thoughtful follow-up questions to help them add depth, emotion, and vivid details
- Focus on sensory details, emotions, relationships, and meaningful moments
- Ask only ONE specific question at a time
- Keep questions warm, encouraging, and easy to understand
- Help them explore the deeper meaning and impact of their story
- Don't repeat information they've already shared`,
            }

            const conversationMessages = currentMessages
                .filter((msg) => msg.type !== "summary")
                .slice(-6)
                .map((msg) => ({
                    role: msg.type === "question" ? "assistant" : "user",
                    content: msg.content,
                }))

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [systemMessage, ...conversationMessages],
                    max_tokens: 100,
                    temperature: 0.8,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                    timeout: 15000,
                }
            )

            const aiQuestion = response.data.choices[0].message.content.trim()

            const newQuestion: Message = {
                id: `ai-q-${Date.now()}`,
                type: "question",
                content: aiQuestion,
                timestamp: new Date().toISOString(),
                speaker: "bot",
            }

            setMessages((prev) => [...prev, newQuestion])
            setIsWaitingForAnswer(true)
        } catch (error) {
            console.error("Error generating question:", error)
            const fallbackQuestions = [
                "Can you describe what you were feeling during that moment?",
                "What details do you remember most vividly about that experience?",
                "How did the people around you react to what was happening?",
                "What made this moment particularly meaningful to you?",
                "Can you tell me more about the setting where this took place?",
            ]
            const randomFallback =
                fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
            const fallbackQuestion: Message = {
                id: `fallback-q-${Date.now()}`,
                type: "question",
                content: randomFallback,
                timestamp: new Date().toISOString(),
                speaker: "bot",
            }
            setMessages((prev) => [...prev, fallbackQuestion])
            setIsWaitingForAnswer(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendAnswer = async () => {
        if (!currentAnswer.trim()) return

        const newAnswer: Message = {
            id: `user-a-${Date.now()}`,
            type: "answer",
            content: currentAnswer.trim(),
            timestamp: new Date().toISOString(),
            speaker: currentUserId || "user",
        }

        const updatedMessages = [...messages, newAnswer]
        setMessages(updatedMessages)
        setCurrentAnswer("")
        setIsWaitingForAnswer(false)

        setTimeout(() => {
            generateFollowUpQuestion(updatedMessages)
        }, 1500)
    }

    const handleContinue = () => {
        if (!messages.length) return

        const conv = {
            conversationStartDate: messages[0].timestamp, // đã là string ISO
            participants: Array.from(new Set(messages.map(m => m.speaker))),
            messages: messages.map(m => ({
                id: m.id,
                messageTime: m.timestamp, // string ISO luôn
                speaker: m.speaker,
                speech: m.content,
            })),
        }

        // lưu vào store
        setConversation(conv)
        console.log("useStoryEditingStore.getState(): ", useStoryEditingStore.getState().conversation);

        // điều hướng sang step6
        router.push("/story/new_story/step6_generateScreen")
    }

    const renderMessage = ({ item }: { item: Message }) => (
        <View
            style={[
                styles.messageContainer,
                item.type === "answer" ? styles.answerContainer : styles.questionContainer,
            ]}
        >
            <View
                style={[
                    styles.messageBubble,
                    item.type === "answer"
                        ? styles.answerBubble
                        : item.type === "summary"
                            ? styles.summaryBubble
                            : styles.questionBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        item.type === "answer"
                            ? styles.answerText
                            : item.type === "summary"
                                ? styles.summaryText
                                : styles.questionText,
                    ]}
                >
                    {item.content}
                </Text>
            </View>
        </View>
    )

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />

            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flex: 1 }}
                    >
                        {storyTitle && (
                            <TextInput
                                style={styles.headerText}
                                numberOfLines={1}
                                editable={false}
                            >
                                {storyTitle}
                            </TextInput>
                        )}
                    </ScrollView>
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            />

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4A4A4A" />
                    <Text style={styles.loadingText}>Memory Keeper is reflecting...</Text>
                </View>
            )}

            {isWaitingForAnswer && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={currentAnswer}
                        onChangeText={setCurrentAnswer}
                        placeholder="Share your thoughts and memories..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !currentAnswer.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSendAnswer}
                        disabled={!currentAnswer.trim()}
                    >
                        <Text style={styles.sendButtonText}>Share</Text>
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    headerContainer: { paddingTop: 40, paddingBottom: 10, paddingHorizontal: 20, zIndex: 2 },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headerText: { fontSize: 24, fontFamily: "Alberts", marginRight: 10, color: "#333" },
    continueButton: {
        backgroundColor: "#4A4A4A",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginLeft: 10,
    },
    continueButtonText: { color: "#fff", fontSize: 14, fontFamily: "Alberts" },
    chatContainer: { flex: 1, paddingHorizontal: 20, zIndex: 2 },
    chatContent: { paddingBottom: 20 },
    messageContainer: { marginVertical: 8 },
    questionContainer: { alignItems: "flex-start" },
    answerContainer: { alignItems: "flex-end" },
    messageBubble: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
    questionBubble: { backgroundColor: "#66621C", borderRadius: 15, borderBottomLeftRadius: 0 },
    answerBubble: { backgroundColor: "#FFFEDD", borderRadius: 15, padding: 20, borderBottomRightRadius: 0 },
    summaryBubble: { backgroundColor: "#F0F8FF", borderRadius: 15, borderWidth: 1, borderColor: "#E0E0E0", minWidth: "85%", maxWidth: "85%" },
    messageText: { fontSize: 16, lineHeight: 22 },
    questionText: { color: "white", fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Judson" },
    answerText: { fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Judson" },
    summaryText: { color: "#555", fontFamily: "Alberts", fontSize: 14 },
    loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 15, zIndex: 2 },
    loadingText: { marginLeft: 8, fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Alberts", color: "#4A4A4A" },
    inputContainer: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", zIndex: 2 },
    textInput: { flex: 1, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 12, marginRight: 10, maxHeight: 120, backgroundColor: "#fff", fontSize: 16, color: "#333" },
    sendButton: { backgroundColor: "#4A4A4A", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    sendButtonDisabled: { backgroundColor: "#CCC" },
    sendButtonText: { color: "#fff", fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Alberts", fontWeight: "600" },
})
