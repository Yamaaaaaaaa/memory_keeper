"use client"
import { db } from "@/firebase/firebaseConfig"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { useStoryEditingStore } from "@/store/storyEditingStore"
import axios from "axios"
import { LinearGradient } from "expo-linear-gradient"
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from "firebase/firestore"
import React, { useEffect, useState } from "react"
import {
    Alert,
    Animated,
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native"

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_API_KEY

export default function Step7_Loading() {
    const router = useTrackedRouter()
    const { id: storyId } = useStoryEditingStore()

    const [progress] = useState(new Animated.Value(0))
    const [progressText, setProgressText] = useState(0)
    const [statusText, setStatusText] = useState("Preparing your story...")

    useEffect(() => {
        if (!storyId) {
            Alert.alert("Error", "No storyId found in store")
            return
        }
        fetchAndGenerateStory(storyId)
    }, [storyId])

    const fetchAndGenerateStory = async (storyId: string) => {
        try {
            setStatusText("Fetching story...")
            updateProgress(0.2)

            const storyRef = doc(db, "stories", storyId)
            const storySnap = await getDoc(storyRef)
            if (!storySnap.exists()) throw new Error("Story not found")

            const storyData = storySnap.data() as any
            console.log("📖 Loaded story:", storyData)

            let newDetailStory = ""

            if (storyData.typeStory === "call") {
                // --- CALL CASE ---
                setStatusText("Fetching call data...")
                updateProgress(0.4)

                if (!storyData.callId) throw new Error("Story missing callId")

                const callSnap = await getDoc(doc(db, "calls", storyData.callId))
                if (!callSnap.exists()) throw new Error("Call not found")

                const callData = callSnap.data()
                console.log("👤 Caller text:", callData.callDetailText_Caller)
                console.log("👥 Callee text:", callData.callDetailText_Callee)

                setStatusText("Generating story from call...")
                updateProgress(0.6)

                newDetailStory = await generateDetailStoryFromCall(
                    storyData.title,
                    storyData.initQuestions || [],
                    callData.callDetailText_Caller,
                    callData.callDetailText_Callee
                )
            } else if (storyData.typeStory === "chat") {
                // --- CHAT CASE ---
                setStatusText("Fetching conversation...")
                updateProgress(0.4)

                if (!storyData.conversationId) throw new Error("Story missing conversationId")

                const convRef = doc(db, "conversations", storyData.conversationId)
                const convSnap = await getDoc(convRef)
                if (!convSnap.exists()) throw new Error("Conversation not found")

                // get messages subcollection
                const messagesSnap = await getDocs(
                    collection(db, "conversations", storyData.conversationId, "messages")
                )

                const messages = messagesSnap.docs.map((doc) => doc.data())
                console.log("💬 Messages:", messages)

                setStatusText("Generating story from chat...")
                updateProgress(0.6)

                newDetailStory = await generateDetailStoryFromChat(
                    storyData.title,
                    storyData.initQuestions || [],
                    messages
                )
            }

            // --- UPDATE Firestore ---
            await updateDoc(storyRef, {
                detailStory: newDetailStory,
                storyGeneratedDate: new Date().toISOString(),
            })

            setStatusText("Story updated successfully!")
            updateProgress(1.0)

            setTimeout(() => {
                router.replace(`/story/${storyId}`)
            }, 1500)
        } catch (err) {
            console.error("❌ Error:", err)
            Alert.alert("Error", (err as Error).message)
            setTimeout(() => router.back(), 2000)
        }
    }

    // --- Helper for CALL ---
    const generateDetailStoryFromCall = async (
        title: string,
        initQuestions: any[],
        callerText: string,
        calleeText: string
    ) => {
        const qaText = initQuestions
            .map((q: any) => `Q: ${q.question}\nA: ${q.answer}`)
            .join("\n\n")

        const systemMessage = {
            role: "system",
            content:
                "You are a skilled storyteller. Write a detailed, engaging story based on this call.",
        }
        const userMessage = {
            role: "user",
            content: `Story Title: "${title}"\nQuestions:\n${qaText}\n\nCaller: "${callerText}"\nCallee: "${calleeText}"\n\nPlease create a detailed and emotional story.`,
        }

        const res = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [systemMessage, userMessage],
                max_tokens: 1000,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        )

        return res.data.choices[0].message.content.trim()
    }

    // --- Helper for CHAT ---
    const generateDetailStoryFromChat = async (
        title: string,
        initQuestions: any[],
        messages: any[]
    ) => {
        const qaText = initQuestions
            .map((q: any) => `Q: ${q.question}\nA: ${q.answer}`)
            .join("\n\n")

        const dialogue = messages
            .map((m) => `${m.speaker}: ${m.speech}`)
            .join("\n")

        const systemMessage = {
            role: "system",
            content:
                "You are a skilled storyteller. Write a detailed, engaging story based on this chat.",
        }
        const userMessage = {
            role: "user",
            content: `Story Title: "${title}"\nQuestions:\n${qaText}\n\nConversation:\n${dialogue}\n\nPlease create a detailed and emotional story.`,
        }

        const res = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [systemMessage, userMessage],
                max_tokens: 1000,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        )

        return res.data.choices[0].message.content.trim()
    }

    const updateProgress = (value: number) => {
        Animated.timing(progress, {
            toValue: value,
            duration: 500,
            useNativeDriver: false,
        }).start()
    }

    useEffect(() => {
        const progressListener = progress.addListener(({ value }) => {
            setProgressText(Math.round(value * 100))
        })
        return () => progress.removeListener(progressListener)
    }, [])

    const penPosition = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["10%", "90%"],
    })

    // --- UI cũ với hiệu ứng ---
    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.statusText}>{statusText}</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ["0%", "100%"],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Animated.View
                            style={[
                                styles.penContainer,
                                {
                                    left: penPosition,
                                },
                            ]}
                        >
                            <Image
                                source={require("../../../assets/images/NewUI/Icon.png")}
                                style={styles.penIcon}
                            />
                        </Animated.View>
                    </View>
                    <Text style={styles.progressText}>{progressText}%</Text>
                    <Text style={styles.titleText}>Story {storyId}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center" },
    gradient: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    contentWrapper: {
        zIndex: 2,
        width: "100%",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loadingContainer: { alignItems: "center", width: "100%" },
    statusText: {
        fontSize: 18,
        color: "#333",
        marginBottom: 30,
        fontWeight: "500",
        textAlign: "center",
    },
    progressContainer: {
        width: "100%",
        height: 60,
        position: "relative",
        marginBottom: 30,
    },
    progressBar: {
        width: "100%",
        height: 8,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
        position: "absolute",
        top: 66,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#353A3F",
        borderRadius: 4,
    },
    penContainer: {
        position: "absolute",
        top: 0,
        transform: [{ translateX: -15 }],
    },
    penIcon: { width: 71, height: 64 },
    progressText: {
        fontSize: 18,
        color: "#666",
        fontWeight: "600",
        marginBottom: 20,
    },
    titleText: {
        fontSize: 16,
        color: "#666",
        fontStyle: "italic",
        textAlign: "center",
    },
})
