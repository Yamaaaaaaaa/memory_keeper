"use client"
import { auth, db } from "@/firebase/firebaseConfig"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { useCallStoryStore } from "@/store/callStoryStore"
import axios from "axios"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { Alert, Animated, Image, StyleSheet, Text, View } from "react-native"
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_API_KEY;


export default function Step7_Loading() {
    const params = useLocalSearchParams()
    const [progress] = useState(new Animated.Value(0))
    const [progressText, setProgressText] = useState(0)
    const [statusText, setStatusText] = useState("Preparing your story...")
    const currentUserId = auth.currentUser?.uid
    const router = useTrackedRouter()
    const {
        id: existingStoryId,
        hasStory,
        initialQuestion,
        clearAll,
    } = useCallStoryStore()

    useEffect(() => {
        generateAndSaveStory()
    }, [])

    const generateAndSaveStory = async () => {
        console.log("Step7_Loading_ hasStory", hasStory)
        console.log("Step7_Loading existingStoryId", existingStoryId)
        console.log("Step7_Loading initialQuestion", initialQuestion)

        try {
            if (hasStory && existingStoryId) {
                // ========== CASE 2 ==========
                setStatusText("Fetching existing story...")
                updateProgress(0.3)
                const storyRef = doc(db, "stories", existingStoryId)
                const storyDoc = await getDoc(storyRef)
                if (!storyDoc.exists()) {
                    throw new Error("Story not found")
                }

                const storyData = storyDoc.data()
                console.log("✅ Story from Firebase:", storyData)

                if (storyData.callId) {
                    const callDoc = await getDoc(doc(db, "calls", storyData.callId))
                    if (callDoc.exists()) {
                        const callData = callDoc.data()
                        console.log("👤 Caller text:", callData.callDetailText_Caller)
                        console.log("👥 Callee text:", callData.callDetailText_Callee)
                        const prevQA = initialQuestion.previousQA || []
                        const storyTitle = storyData.title || "Untitled Story"
                        setStatusText("Generating detailed story...")
                        updateProgress(0.6)

                        const newDetailStory = await generateDetailStoryFromCall(
                            storyTitle,
                            prevQA,
                            callData.callDetailText_Caller,
                            callData.callDetailText_Callee
                        )

                        // update field detailStory
                        await updateDoc(storyRef, {
                            detailStory: newDetailStory,
                            story_generated_date: new Date().toISOString(),
                        })

                        console.log("✅ Updated detailStory in Firestore")
                        setStatusText("Updated detail story successfully!")
                        updateProgress(1.0)
                    } else {
                        console.log("⚠️ Call not found with id:", storyData.callId)
                    }
                }

                setStatusText("Loaded existing story!")
                updateProgress(1.0)

            } else {
                // ========== CASE 1 (keep old flow) ==========
                setStatusText("Analyzing your conversation...")
                updateProgress(0.1)

                const finalQA = params.finalQA ? JSON.parse(params.finalQA as string) : []
                const allMessages = params.allMessages ? JSON.parse(params.allMessages as string) : []
                const storyTitle = (params.storyTitle as string) || "Untitled Story"
                const shareType = (params.shareType as string) || "myself"

                // Call OpenAI
                setStatusText("Creating your detailed story...")
                updateProgress(0.3)
                const storyContent = await generateStoryContent(finalQA, storyTitle)

                setStatusText("Generating summary...")
                updateProgress(0.5)
                const summaryContent = await generateSummary(finalQA, storyTitle)

                setStatusText("Creating description...")
                updateProgress(0.7)
                const descriptionContent = await generateDescription(finalQA, storyTitle)

                // Save to Firebase
                setStatusText("Saving your story...")
                updateProgress(0.8)
                const storyId = await saveToFirebase(
                    storyContent,
                    summaryContent,
                    descriptionContent,
                    allMessages,
                    storyTitle,
                    shareType
                )

                setStatusText("Story created successfully!")
                updateProgress(1.0)

                setTimeout(() => {
                    router.replace(`/story/${storyId}`)
                }, 1500)
            }
        } catch (error) {
            console.error("Error generating story:", error)
            setStatusText("Error creating story. Please try again.")
            Alert.alert("Error", "Failed to create story. Please try again.")
            setTimeout(() => {
                router.back()
            }, 2000)
        }
    }
    // New generate detailStory function
    const generateDetailStoryFromCall = async (
        title: string,
        previousQA: any[],
        callerText: string,
        calleeText: string
    ): Promise<string> => {
        try {
            const qaText = previousQA
                .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
                .join("\n\n")

            const systemMessage = {
                role: "system",
                content: `You are a skilled storyteller and memory keeper. Create a detailed, engaging story based on the personal conversation below.

Instructions:
- Write in first person narrative style
- Include emotions, sensory details, and vivid descriptions
- Make it flow naturally like a personal memoir or journal entry
- Length: 400-600 words
- Keep the authentic voice and personal touch from the conversation
- Focus on the meaningful moments, relationships, and emotions mentioned
- Create a coherent narrative that connects all the shared memories
- Use descriptive language to bring the story to life`,
            }

            const userMessage = {
                role: "user",
                content: `This is a call about the topic: "${title}".
There are some questions that started the story:
${qaText || "None"}.

In this story:
- Caller said the following: "${callerText}"
- Callee said the following: "${calleeText}"

Please rewrite a detailed, coherent, and emotional story based on this information.`,
            }

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [systemMessage, userMessage],
                    max_tokens: 1000,
                    temperature: 0.7,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                    timeout: 30000,
                },
            )

            return response.data.choices[0].message.content.trim()
        } catch (error) {
            console.error("❌ Error generating detailStory:", error)
            throw new Error("Failed to generate detailStory from call")
        }
    }
    const updateProgress = (value: number) => {
        Animated.timing(progress, {
            toValue: value,
            duration: 500,
            useNativeDriver: false,
        }).start()
    }

    const generateStoryContent = async (qa: any[], title: string): Promise<string> => {
        try {
            const qaText = qa.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n")
            const systemMessage = {
                role: "system",
                content: `You are a skilled storyteller and memory keeper. Create a detailed, engaging story based on the personal conversation below.
                         
                Instructions:
                - Write in first person narrative style
                - Include emotions, sensory details, and vivid descriptions
                - Make it flow naturally like a personal memoir or journal entry
                - Length: 400-600 words
                - Keep the authentic voice and personal touch from the conversation
                - Focus on the meaningful moments, relationships, and emotions mentioned
                - Create a coherent narrative that connects all the shared memories
                - Use descriptive language to bring the story to life`,
            }

            const userMessage = {
                role: "user",
                content: `Story Title: "${title}"\n\nPersonal Conversation:\n${qaText}\n\nPlease create a detailed, heartfelt story from this conversation that captures the essence of these memories.`,
            }

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [systemMessage, userMessage],
                    max_tokens: 1000,
                    temperature: 0.7,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                    timeout: 30000,
                },
            )

            return response.data.choices[0].message.content.trim()
        } catch (error) {
            console.error("Error generating story content:", error)
            throw new Error("Failed to generate story content")
        }
    }

    const generateSummary = async (qa: any[], title: string): Promise<string> => {
        try {
            const qaText = qa.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n")
            const systemMessage = {
                role: "system",
                content: `Create a brief, engaging summary of the story. Keep it to 2-3 sentences that capture the essence and emotional core of the personal story. Make it compelling and heartfelt.`,
            }

            const userMessage = {
                role: "user",
                content: `Story Title: "${title}"\n\nPersonal Conversation:\n${qaText}\n\nPlease create a brief, emotional summary that captures the heart of this story.`,
            }

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [systemMessage, userMessage],
                    max_tokens: 150,
                    temperature: 0.7,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                    timeout: 30000,
                },
            )

            return response.data.choices[0].message.content.trim()
        } catch (error) {
            console.error("Error generating summary:", error)
            throw new Error("Failed to generate summary")
        }
    }

    const generateDescription = async (qa: any[], title: string): Promise<string> => {
        try {
            const qaText = qa.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n")
            const systemMessage = {
                role: "system",
                content: `Create a 1-2 sentence description that captures the main theme or topic of this personal story. Focus on what the story is fundamentally about - the core theme, emotion, or life experience.`,
            }

            const userMessage = {
                role: "user",
                content: `Story Title: "${title}"\n\nPersonal Conversation:\n${qaText}\n\nPlease create a thematic description that captures what this story is really about.`,
            }

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [systemMessage, userMessage],
                    max_tokens: 100,
                    temperature: 0.7,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                    },
                    timeout: 30000,
                },
            )

            return response.data.choices[0].message.content.trim()
        } catch (error) {
            console.error("Error generating description:", error)
            throw new Error("Failed to generate description")
        }
    }

    const saveToFirebase = async (
        detailStory: string,
        sumaryStory: string,
        description: string,
        messages: any[],
        title: string,
        shareType: string,
    ): Promise<string> => { // Added Promise<string> to return story ID
        try {
            // 1. Create conversation document
            const conversationRef = await addDoc(collection(db, "conversations"), {
                conversation_start_date: new Date().toISOString(),
                participants: [currentUserId, "bot"],
            })
            const conversationId = conversationRef.id

            // 2. Save messages to subcollection
            let messageCount = 0
            for (const message of messages) {
                await addDoc(collection(db, "conversations", conversationId, "messages"), {
                    message_time: message.message_time,
                    speaker: message.speaker,
                    speech: message.content,
                })
                messageCount++
            }

            // 3. Create story document
            const storyRef = await addDoc(collection(db, "stories"), {
                conversation_id: conversationId,
                description: description,
                detailStory: detailStory,
                ownerId: currentUserId,
                processing: 0, // 0 = completed processing
                related_users: [currentUserId],
                shareType: shareType,
                story_generated_date: new Date().toISOString(),
                story_recited_date: "", // Empty for now
                sumaryStory: sumaryStory, // Note: keeping original typo for consistency
                thumbnail_url: "https://ts4.mm.bing.net/th?id=OIP_5blUyyRzvsWGts_0ZFSQHaEK&pid=15.1", // Default thumbnail
                title: title,
            })

            const storyId = storyRef.id // Get the ID of the newly created story

            return storyId // Return story ID
        } catch (error) {
            console.error("❌ Error saving to Firebase:", error)
            throw error
        }
    }

    useEffect(() => {
        const progressListener = progress.addListener(({ value }) => {
            setProgressText(Math.round(value * 100))
        })

        return () => {
            progress.removeListener(progressListener)
        }
    }, [])

    const penPosition = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["10%", "90%"],
    })

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
                            <Image source={require("../../../assets/images/NewUI/Icon.png")} style={styles.penIcon} />
                        </Animated.View>
                    </View>
                    <Text style={styles.progressText}>{progressText}%</Text>
                    {/* Story title display */}
                    <Text style={styles.titleText}>Creating {params.storyTitle}</Text>
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
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loadingContainer: {
        alignItems: "center",
        width: "100%",
    },
    statusText: {
        fontSize: 18,
        color: "#333",
        marginBottom: 30,
        fontWeight: "500",
        textAlign: "center",
        fontFamily: "Alberts",
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
    penIcon: {
        width: 71,
        height: 64,
    },
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
        fontFamily: "Alberts",
    },
})