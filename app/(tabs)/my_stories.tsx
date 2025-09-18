import { auth, db } from "@/firebase/firebaseConfig"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { Conversation, InitQuestion, useStoryEditingStore } from "@/store/storyEditingStore"
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

// Lấy luôn full schema từ store
type StoryType = "chat" | "call"
type ShareType = "myself" | "me_plus_one"

export interface Story {
    id: string
    typeStory: StoryType
    ownerId: string
    processing: number
    relatedUsers: string[]
    shareType: ShareType
    storyGeneratedDate: string
    storyRecitedDate: string
    detailStory: string
    sumaryStory: string
    title: string
    initQuestions: InitQuestion[]
    callId: string
    conversationId: string
    conversation: Conversation | null
}

export default function MyStoriesScreen() {
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [userName, setUserName] = useState("User")
    const router = useTrackedRouter()
    const updateStory = useStoryEditingStore((s) => s.updateStory)

    const getProgressColor = (processing: number): string => {
        if (processing === 0) return "#64CC28"
        if (processing >= 50) return "#FFCC00"
        return "#FE8533"
    }

    const loadUserInfo = async () => {
        try {
            const uid = auth.currentUser?.uid
            if (!uid) return
            const userDocRef = doc(db, "users", uid)
            const userDoc = await getDoc(userDocRef)
            if (userDoc.exists()) {
                const userData = userDoc.data()
                setUserName(userData.username || "Unknown User")
            }
        } catch (error) {
            console.error("Error loading user info:", error)
        }
    }

    const loadStories = async () => {
        try {
            const uid = auth.currentUser?.uid
            if (!uid) return

            const storiesRef = collection(db, "stories")
            const q = query(storiesRef, where("ownerId", "==", uid))
            const querySnapshot = await getDocs(q)

            const storiesData: Story[] = []

            for (const docSnapshot of querySnapshot.docs) {
                const data = docSnapshot.data()

                // --- load subcollection initQuestions ---
                const initQuestionsRef = collection(db, "stories", docSnapshot.id, "initQuestions")
                const initQuestionsSnap = await getDocs(initQuestionsRef)
                const initQuestions: InitQuestion[] = initQuestionsSnap.docs.map((qDoc) => ({
                    id: qDoc.id,
                    question: qDoc.data().question || "",
                    answer: qDoc.data().answer || "",
                }))

                const story: Story = {
                    id: docSnapshot.id,
                    typeStory: data.typeStory || "chat",
                    ownerId: data.ownerId || "",
                    processing: data.processing || 0,
                    relatedUsers: data.relatedUsers || [],
                    shareType: data.shareType || "myself",
                    storyGeneratedDate: data.storyGeneratedDate || new Date().toISOString(),
                    storyRecitedDate: data.storyRecitedDate || new Date().toISOString(),
                    detailStory: data.detailStory || "",
                    sumaryStory: data.sumaryStory || "",
                    title: data.title || "Untitled Story",
                    callId: data.callId || "",
                    conversationId: data.conversationId || "",
                    conversation: data.conversation || null,
                    initQuestions,
                }

                storiesData.push(story)
            }

            setStories(storiesData)
        } catch (error) {
            console.error("Error loading stories:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadStories()
    }

    const handleStoryPress = (story: Story) => {
        router.push(`/story/${story.id}`)
    }

    const handleNewStory = () => {
        router.push("/story/new_story/step1_intro")
    }

    const handleDeleteStory = async (story: Story) => {
        try {
            await deleteDoc(doc(db, "stories", story.id))
            if (story.conversationId) {
                await deleteDoc(doc(db, "conversations", story.conversationId))
            }
            setStories((prev) => prev.filter((s) => s.id !== story.id))
            Alert.alert("Success", "Story and related conversation deleted")
        } catch (err) {
            console.error("Error deleting story:", err)
            Alert.alert("Error", "Failed to delete story")
        }
    }

    const handleEditStory = (story: Story) => {
        useStoryEditingStore.getState().clearStory();

        updateStory(story) // lưu story vào store
        router.push("/story/new_story/step2_initQuestion")
    }

    useEffect(() => {
        loadUserInfo()
        loadStories()
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
                <View style={styles.header}>
                    <TouchableOpacity style={styles.userInfo}>
                        <Text style={styles.byText}>By {userName}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.storiesTitle}>Stories</Text>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FE8533"]} />}
                >
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
                                    style={styles.storyCard}
                                    onPress={() => handleStoryPress(story)}
                                    onLongPress={() =>
                                        Alert.alert("Choose action", `What do you want to do with "${story.title}"?`, [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Edit Story", onPress: () => handleEditStory(story) },
                                            { text: "Delete", style: "destructive", onPress: () => handleDeleteStory(story) },
                                        ])
                                    }
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.progressContainer}>
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

                                    <View style={styles.storyTitleContainer}>
                                        <Text style={styles.storyTitle} numberOfLines={1}>
                                            {story.title}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>

                <TouchableOpacity style={styles.newStoryButton} onPress={handleNewStory} activeOpacity={0.8}>
                    <Text style={styles.newStoryText}>A new story</Text>
                    <View style={styles.newStoryIcon}>
                        <Image source={require("../../assets/images/NewUI/icon new stories.png")} style={styles.editIconText} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", paddingTop: screenRatio >= 2 ? 128 : 60 },
    gradient: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    contentWrapper: { zIndex: 2, width: "100%", flex: 1, paddingHorizontal: 36 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 2 },
    loadingText: { fontSize: 16, fontFamily: "Alberts", color: "#666" },
    header: { alignItems: "center", marginBottom: screenRatio >= 2 ? 90 : 30 },
    userInfo: { flexDirection: "row", alignItems: "center" },
    byText: { fontSize: screenRatio >= 2 ? 24 : 20, fontFamily: "Alberts", marginRight: 8 },
    storiesTitle: { fontSize: screenRatio >= 2 ? 28 : 24, fontFamily: "Alberts", textAlign: "center", marginBottom: 20 },
    storiesContainer: {},
    emptyContainer: { alignItems: "center" },
    emptyText: { fontSize: screenRatio >= 2 ? 18 : 16, fontFamily: "Alberts", color: "#666", marginBottom: 8 },
    emptySubtext: { fontSize: screenRatio >= 2 ? 14 : 12, fontFamily: "Alberts", color: "#999" },
    storyCard: {
        backgroundColor: "#353A3F",
        borderRadius: 12,
        borderTopStartRadius: 0,
        padding: 8,
        paddingBottom: 20,
        minHeight: 100,
        marginBottom: 20,
    },
    storyNumber: { fontSize: screenRatio >= 2 ? 22 : 20, fontFamily: "Alberts", color: "#FEF4F6" },
    progressContainer: { height: 26, flexDirection: "row", justifyContent: "space-between", marginBottom: screenRatio >= 2 ? 40 : 30 },
    progressBackground: { marginVertical: 4, width: 135, backgroundColor: "#222629", borderRadius: 12, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 4 },
    storyTitleContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    storyTitle: { fontSize: screenRatio >= 2 ? 20 : 18, fontFamily: "Judson", fontWeight: "400", color: "white", flex: 1, overflow: "hidden" },
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
    newStoryText: { fontSize: screenRatio >= 2 ? 20 : 18, fontFamily: "Alberts", marginRight: 8 },
    newStoryIcon: { padding: 4 },
    editIconText: { width: 20, height: 20 },
})
