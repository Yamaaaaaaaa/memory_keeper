import React, { useState, useEffect, useRef } from "react"
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import axios from "axios"
import { screenRatio } from "@/utils/initScreen"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

interface Message {
    id: string
    type: 'question' | 'answer' | 'summary'
    content: string
    timestamp: Date
    speaker: string // 'bot' hoặc user ID
}

export default function Step4_3_ChatWithAI() {
    const params = useLocalSearchParams()
    const router = useTrackedRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentAnswer, setCurrentAnswer] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false)
    const [storyTitle, setStoryTitle] = useState(params.storyTitle as string || "Untitled Story")
    const [shareType, setShareType] = useState("")
    const flatListRef = useRef<FlatList>(null)

    // Giả sử user ID - trong thực tế sẽ lấy từ auth
    const currentUserId = "y5iDLqAakZVHf3xFEd22HlrScTD3"

    useEffect(() => {
        const initializeChat = async () => {
            let initialMessages: Message[] = []
            let previousQA = []

            if (params.storyTitle) {
                setStoryTitle(params.storyTitle as string)
            }
            if (params.shareType) {
                setShareType(params.shareType as string)
            }

            if (params.previousQA) {
                try {
                    previousQA = JSON.parse(params.previousQA as string)

                    const summaryContent = previousQA.map((qa: any) =>
                        `• ${qa.question}\n  → ${qa.answer}`
                    ).join('\n\n')

                    const summaryMessage: Message = {
                        id: 'summary',
                        type: 'summary',
                        content: `Your story so far:\n\n${summaryContent}`,
                        timestamp: new Date(),
                        speaker: 'bot'
                    }
                    initialMessages.push(summaryMessage)

                    setMessages(initialMessages)
                    generateFollowUpQuestion(initialMessages, previousQA)

                } catch (error) {
                    console.error("Error parsing previous Q&A:", error)
                    const basicQuestion: Message = {
                        id: 'basic-q',
                        type: 'question',
                        content: "Let's explore your story more deeply. What emotions were you feeling during the main events?",
                        timestamp: new Date(),
                        speaker: 'bot'
                    }
                    setMessages([basicQuestion])
                    setIsWaitingForAnswer(true)
                }
            } else {
                const firstQuestion: Message = {
                    id: 'first-q',
                    type: 'question',
                    content: "Let's begin exploring your story. What would you like to tell me about?",
                    timestamp: new Date(),
                    speaker: 'bot'
                }
                setMessages([firstQuestion])
                setIsWaitingForAnswer(true)
            }
        }

        initializeChat()
    }, [params.previousQA, params.storyTitle, params.shareType])

    const generateFollowUpQuestion = async (currentMessages: Message[], previousQA?: any[]) => {
        setIsLoading(true)

        try {
            let contextInfo = ""
            if (previousQA && previousQA.length > 0) {
                contextInfo = previousQA.map(qa => `${qa.question}: ${qa.answer}`).join('\n')
            }

            const systemMessage = {
                role: "system",
                content: `You are Memory Keeper, a warm and empathetic AI assistant helping users develop their personal stories and memories.

Story Title: "${params.storyTitle || 'Untitled Story'}"
Sharing Context: ${shareType === 'myself' ? 'User wants to tell this story to themselves' : 'User wants to share this story with someone else'}

Context from their basic story information:
${contextInfo}

Your role:
- Ask thoughtful follow-up questions to help them add depth, emotion, and vivid details
- Focus on sensory details, emotions, relationships, and meaningful moments
- Ask only ONE specific question at a time
- Keep questions warm, encouraging, and easy to understand
- Help them explore the deeper meaning and impact of their story
- Don't repeat information they've already shared

Question types to explore:
- Emotional aspects: How did you feel? What emotions do you remember?
- Sensory details: What did you see, hear, smell, taste, or touch?
- Relationships: How did others react? What did they say or do?
- Significance: Why is this memory important to you? How did it change you?
- Context: What was happening in your life at that time?`,
            }

            const conversationMessages = currentMessages
                .filter(msg => msg.type !== 'summary')
                .slice(-6)
                .map(msg => ({
                    role: msg.type === 'question' ? 'assistant' : 'user',
                    content: msg.content
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
                type: 'question',
                content: aiQuestion,
                timestamp: new Date(),
                speaker: 'bot'
            }

            setMessages(prev => [...prev, newQuestion])
            setIsWaitingForAnswer(true)

        } catch (error) {
            console.error("Error generating question:", error)

            const fallbackQuestions = [
                "Can you describe what you were feeling during that moment?",
                "What details do you remember most vividly about that experience?",
                "How did the people around you react to what was happening?",
                "What made this moment particularly meaningful to you?",
                "Can you tell me more about the setting where this took place?"
            ]

            const randomFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]

            const fallbackQuestion: Message = {
                id: `fallback-q-${Date.now()}`,
                type: 'question',
                content: randomFallback,
                timestamp: new Date(),
                speaker: 'bot'
            }
            setMessages(prev => [...prev, fallbackQuestion])
            setIsWaitingForAnswer(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendAnswer = async () => {
        if (!currentAnswer.trim()) return

        const newAnswer: Message = {
            id: `user-a-${Date.now()}`,
            type: 'answer',
            content: currentAnswer.trim(),
            timestamp: new Date(),
            speaker: currentUserId
        }

        const updatedMessages = [...messages, newAnswer]
        setMessages(updatedMessages)
        setCurrentAnswer("")
        setIsWaitingForAnswer(false)

        setTimeout(() => {
            generateFollowUpQuestion(updatedMessages)
        }, 1500)
    }

    const handleCreateStory = () => {
        const originalQA = params.previousQA ? JSON.parse(params.previousQA as string) : []

        const chatMessages = messages.filter(msg => msg.type !== 'summary')
        const chatQA = []

        for (let i = 0; i < chatMessages.length; i++) {
            const currentMsg = chatMessages[i]
            const nextMsg = chatMessages[i + 1]

            if (currentMsg.type === 'question' && nextMsg && nextMsg.type === 'answer') {
                chatQA.push({
                    question: currentMsg.content,
                    answer: nextMsg.content,
                    questionTime: currentMsg.timestamp.toISOString(),
                    answerTime: nextMsg.timestamp.toISOString()
                })
                i++
            }
        }

        const allQA = [...originalQA, ...chatQA]

        // Prepare messages for Firebase
        const allMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            speaker: msg.speaker,
            message_time: msg.timestamp.toISOString(),
            type: msg.type
        }))

        console.log("=== CREATING STORY ===")
        console.log("All Messages with timestamps:", allMessages)
        console.log("All Q&A:", allQA)
        console.log("=== END ===")

        router.push({
            pathname: "/story/new_story/step6_generateScreen",
            params: {
                finalQA: JSON.stringify(allQA),
                allMessages: JSON.stringify(allMessages),
                storyTitle: storyTitle,
                shareType: params.shareType,
                totalQuestions: allQA.length.toString(),
                basicQuestions: originalQA.length.toString(),
                followUpQuestions: chatQA.length.toString()
            }
        })
    }

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.type === 'answer' ? styles.answerContainer : styles.questionContainer
        ]}>
            <View style={[
                styles.messageBubble,
                item.type === 'answer' ? styles.answerBubble :
                    item.type === 'summary' ? styles.summaryBubble : styles.questionBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    item.type === 'answer' ? styles.answerText :
                        item.type === 'summary' ? styles.summaryText : styles.questionText
                ]}>
                    {item.content}
                </Text>
            </View>
        </View>
    )

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />

            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        {storyTitle && (
                            <TextInput style={styles.headerText} numberOfLines={1}>{storyTitle}</TextInput>
                        )}
                        <Image source={require("../../../assets/images/NewUI/pen.png")} style={styles.headerIcon} />
                    </View>

                    <TouchableOpacity style={styles.createButton} onPress={handleCreateStory}>
                        <View style={styles.createButtonContent}>
                            <Text style={styles.createButtonText}>Create</Text>
                        </View>
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
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
                        style={[styles.sendButton, !currentAnswer.trim() && styles.sendButtonDisabled]}
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

// Styles remain the same as previous version...
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    headerContainer: {
        paddingTop: screenRatio >= 2 ? 60 : 40,
        paddingBottom: 10,
        paddingHorizontal: 20,
        zIndex: 2,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    headerText: {
        fontSize: 24,
        fontFamily: "Alberts",
        marginRight: 10,
        color: "#333",
    },
    headerIcon: {
        width: 20,
        height: 20,
    },
    createButton: {
        backgroundColor: "#4A4A4A",
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    createButtonContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: "Alberts",
        fontWeight: '600',
    },
    storyTitle: {
        fontSize: 18,
        fontFamily: "Alberts",
        color: "#333",
        textAlign: "center",
        marginTop: 4,
        fontWeight: "600",
    },
    shareTypeText: {
        fontSize: 14,
        fontFamily: "Alberts",
        color: "#666",
        textAlign: "center",
        marginTop: 4,
        fontStyle: "italic",
    },
    chatContainer: {
        flex: 1,
        paddingHorizontal: 20,
        zIndex: 2,
    },
    chatContent: {
        paddingBottom: 20,
    },
    messageContainer: {
        marginVertical: 8,
    },
    questionContainer: {
        alignItems: 'flex-start',
    },
    answerContainer: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        maxWidth: '85%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    questionBubble: {
        backgroundColor: '#66621C',
        borderRadius: 15,
        borderBottomLeftRadius: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    answerBubble: {
        backgroundColor: '#FFFEDD',
        borderRadius: 15,
        padding: 20,
        borderBottomRightRadius: 0,
    },
    summaryBubble: {
        backgroundColor: '#F0F8FF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minWidth: '85%',
        maxWidth: '85%',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    questionText: {
        color: 'white',
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Judson",
    },
    answerText: {
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Judson",
    },
    summaryText: {
        color: '#555555',
        fontFamily: 'Alberts',
        fontSize: 14,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        zIndex: 2,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Alberts",
        color: '#4A4A4A',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        zIndex: 2,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginRight: 10,
        maxHeight: 120,
        backgroundColor: '#FFFFFF',
        fontSize: 16,
        color: '#333',
    },
    sendButton: {
        backgroundColor: '#4A4A4A',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Alberts",
        fontWeight: '600',
    },
})