import { auth, db } from "@/firebase/firebaseConfig"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { StoryEditingState, useStoryEditingStore } from "@/store/storyEditingStore"
import { screenRatio } from "@/utils/initScreen"
import { LinearGradient } from "expo-linear-gradient"
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"

// Simplified Story interface - chỉ các trường cần thiết
interface Story {
    id: string
    title: string
    processing: number
    ownerId: string
    conversationId?: string
}

export default function MyStoriesScreen() {
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const router = useTrackedRouter()
    const uid = auth.currentUser?.uid

    // Get progress bar color based on processing value
    const getProgressColor = (processing: number): string => {
        if (processing === 0) return "#64CC28" // Green for completed (0 = completed)
        if (processing >= 50) return "#FFCC00" // Yellow for 50-99%
        return "#FE8533" // Orange for 0-49%
    }

    // Get card border style for processing
    const getCardBorderStyle = (processing: number) => {
        if (processing > 0) {
            // Still processing
            return {
                // borderWidth: 2,
                // borderStyle: 'dashed' as const,
                // borderColor: '#FE8533',
            }
        }
        return {}
    }

    // Load stories from Firebase - SIMPLIFIED VERSION
    const loadStories = async () => {
        try {
            if (!uid) {
                console.log("No authenticated user")
                return
            }

            const storiesRef = collection(db, "stories")
            const q = query(storiesRef, where("ownerId", "==", uid))
            // const q = collection(db, 'stories');

            const querySnapshot = await getDocs(q)

            const storiesData: Story[] = []

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data()
                const story: Story = {
                    id: docSnapshot.id,
                    title: data.title || "Untitled Story",
                    processing: data.processing || 0,
                    ownerId: data.ownerId || "",
                    conversationId: data.conversationId,
                }
                storiesData.push(story)
            })
            setStories(storiesData)
        } catch (error) {
            console.error("Error loading stories:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Handle refresh
    const onRefresh = () => {
        setRefreshing(true)
        loadStories()
    }


    // Hàm lấy và map thẳng vào store
    const getStoryByIdAndMap = async (storyId: string) => {
        const docRef = doc(db, "stories", storyId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
            console.log("Story not found")
            return null
        }

        useStoryEditingStore.getState().clearStory();

        const data = docSnap.data() as any
        // map thẳng sang store
        const mapped: Partial<StoryEditingState> = {
            id: docSnap.id,
            typeStory: data.typeStory ?? "chat",
            ownerId: data.ownerId ?? "",
            processing: data.processing ?? 0,
            relatedUsers: data.relatedUsers ?? [],
            shareType: data.shareType ?? "myself",
            storyGeneratedDate: data.storyGeneratedDate
                ? data.storyGeneratedDate
                : new Date().toISOString(),
            storyRecitedDate: data.storyRecitedDate
                ? data.storyRecitedDate
                : new Date().toISOString(),
            detailStory: data.detailStory ?? "",
            sumaryStory: data.summaryStory ?? "",
            title: data.title ?? "",
            callId: data.callId ?? "",
            conversationId: data.conversationId ?? "",
        }
        // 🔹 Load initQuestions subcollection
        const initQRef = collection(db, "stories", storyId, "initQuestions")
        const initQSnap = await getDocs(initQRef)
        const initQuestions = initQSnap.docs.map((qDoc) => {
            const qData = qDoc.data()
            return {
                id: qDoc.id,
                question: qData.question ?? "",
                answer: qData.answer ?? "",
            }
        })

        // Bạn có 2 cách:
        // 1. Nếu muốn nhét thẳng vào store: thêm field initQuestions vào store
        // 2. Nếu chỉ cần trả ra cho màn hình: trả cùng mapped

        // Giả sử ta mở rộng store để chứa luôn initQuestions
        useStoryEditingStore.getState().updateStory({
            ...mapped,
            initQuestions,
        } as any)
        console.log("useStoryEditingStore.getState(): ", useStoryEditingStore.getState());

        return { ...mapped, initQuestions }
    }
    const handleStoryPress = async (story: Story) => {
        await getStoryByIdAndMap(story.id)
        router.push("/story/new_story/step2_initQuestion")
    }

    const handleDeleteStory = async (story: Story) => {
        try {
            // Delete story document
            await deleteDoc(doc(db, "stories", story.id))

            // Delete related conversation if it exists
            if (story.conversationId) {
                await deleteDoc(doc(db, "conversations", story.conversationId))
            }

            // Update UI
            setStories((prev) => prev.filter((s) => s.id !== story.id))
            Alert.alert("Success", "Story and related conversation deleted")
        } catch (err) {
            console.error("Error deleting story:", err)
            Alert.alert("Error", "Failed to delete story")
        }
    }

    useEffect(() => {
        loadStories()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FE8533" />
                    <Text style={styles.loadingText}>Loading stories...</Text>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.byText}>Select a Story to Edit</Text>
                </View>

                {/* Stories Title */}
                <Text style={styles.storiesTitle}>Stories</Text>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FE8533"]} />}
                >
                    {/* Stories List */}
                    <View style={styles.storiesContainer}>
                        {stories.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>You haven&apos;t shared any stories</Text>
                                <Text style={styles.emptySubtext}>Start by creating your first one!</Text>
                            </View>
                        ) : (
                            stories.map((story, index) => (
                                <TouchableOpacity
                                    key={story.id}
                                    style={[styles.storyCard, getCardBorderStyle(story.processing)]}
                                    onPress={() => handleStoryPress(story)}
                                    onLongPress={() =>
                                        Alert.alert(
                                            "Delete story",
                                            `Are you sure you want to delete "${story.title}"?`,
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "Delete", style: "destructive", onPress: () => handleDeleteStory(story) },
                                            ]
                                        )
                                    }
                                    activeOpacity={0.8}
                                >
                                    {/* Progress Bar */}
                                    <View style={styles.progressContainer}>
                                        {/* Story Number */}
                                        <Text style={styles.storyNumber}>{index + 1}</Text>
                                        <View style={styles.progressBackground}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: story.processing === 0 ? "100%" : `${story.processing}%`,
                                                        backgroundColor: getProgressColor(story.processing),
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>

                                    {/* Story Title */}
                                    <View style={styles.storyTitleContainer}>
                                        <Text style={styles.storyTitle} numberOfLines={1}>
                                            {story.title}
                                        </Text>
                                        <View style={styles.storyEditIcon}>
                                            <Image
                                                source={require("../../../assets/images/NewUI/pen_white.png")}
                                                style={styles.editIconText}
                                            ></Image>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: screenRatio >= 2 ? 128 : 60,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    contentWrapper: {
        zIndex: 2,
        width: "100%",
        flex: 1,
        paddingHorizontal: 36,
        paddingBottom: 140,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: "Alberts",
        color: "#666",
    },
    header: {
        alignItems: "center",
        marginBottom: screenRatio >= 2 ? 90 : 30,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    byText: {
        fontSize: screenRatio >= 2 ? 24 : 20,
        fontFamily: "Alberts",
        marginRight: 8,
    },
    editIcon: {},
    editIconText: {
        width: 20,
        height: 20,
    },
    storiesTitle: {
        fontSize: screenRatio >= 2 ? 28 : 24,
        fontFamily: "Alberts",
        textAlign: "center",
        marginBottom: 20,
    },
    storiesContainer: {},
    emptyContainer: {
        alignItems: "center",
    },
    emptyText: {
        fontSize: screenRatio >= 2 ? 18 : 16,
        fontFamily: "Alberts",
        color: "#666",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: screenRatio >= 2 ? 14 : 12,
        fontFamily: "Alberts",
        color: "#999",
    },
    storyCard: {
        backgroundColor: "#353A3F",
        borderRadius: 12,
        borderTopStartRadius: 0,
        padding: 8,
        paddingBottom: 20,
        minHeight: 100,
        marginBottom: 20,
    },
    storyNumber: {
        fontSize: screenRatio >= 2 ? 22 : 20,
        fontFamily: "Alberts",
        color: "#FEF4F6",
    },
    progressContainer: {
        height: 26,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: screenRatio >= 2 ? 40 : 30,
    },
    progressBackground: {
        marginVertical: 4,
        width: 135,
        backgroundColor: "#222629",
        borderRadius: 12,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 4,
    },
    storyTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    storyTitle: {
        fontSize: screenRatio >= 2 ? 20 : 18,
        fontFamily: "Judson",
        fontWeight: "400",
        color: "white",
        flex: 1,
        overflow: "hidden",
    },
    storyEditIcon: {
        width: 20,
        height: 20,
    },
    debugText: {
        fontSize: 10,
        color: "#999",
        marginTop: 5,
    },
    newStoryButton: {
        borderRadius: 12,
        borderTopStartRadius: 0,
        paddingVertical: screenRatio >= 2 ? 20 : 15,
        paddingHorizontal: screenRatio >= 2 ? 32 : 20,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        borderWidth: 1.5,
        borderColor: "#353A3F",
        marginTop: screenRatio >= 2 ? 30 : 10,
        marginBottom: screenRatio >= 2 ? 32 : 10,
    },
    newStoryText: {
        fontSize: screenRatio >= 2 ? 20 : 18,
        fontFamily: "Alberts",
        marginRight: 8,
    },
    newStoryIcon: {
        padding: 4,
    },
})
