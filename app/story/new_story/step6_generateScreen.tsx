import { auth, db } from "@/firebase/firebaseConfig";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";
import { useStoryEditingStore } from "@/store/storyEditingStore";
import { screenRatio } from "@/utils/initScreen";
import { LinearGradient } from "expo-linear-gradient";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import React from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Step6_Generate() {
    const router = useTrackedRouter();

    console.log('====================================');
    console.log("useStoryEditingStore.getState()", useStoryEditingStore.getState());
    console.log('====================================');
    const handleViewTranscript = () => {
        console.log("View transcript clicked");
        // TODO: show transcript modal
    };


    const saveStoryToFirebase = async () => {
        const story = useStoryEditingStore.getState();

        try {
            const storyRef = doc(db, "stories", story.id);

            // Nếu typeStory = "chat" => lưu conversation
            let conversationId = story.conversationId;
            if (story.typeStory === "chat" && story.conversation) {
                if (!conversationId) {
                    // chưa có id => tạo mới
                    const convRef = await addDoc(collection(db, "conversations"), {
                        conversation_start_date: story.conversation.conversationStartDate,
                        participants: story.conversation.participants,
                    });
                    conversationId = convRef.id;

                    // lưu messages vào subcollection
                    for (const msg of story.conversation.messages) {
                        await setDoc(
                            doc(collection(convRef, "messages")),
                            {
                                message_time: msg.messageTime,
                                speaker: msg.speaker,
                                speech: msg.speech,
                            }
                        );
                    }
                } else {
                    // đã có conversationId, update lại conversation // Cái TH này dự phòng nao có làm thêm j đó thôi :>>
                    const convRef = doc(db, "conversations", conversationId);
                    await setDoc(convRef, {
                        conversation_start_date: story.conversation.conversationStartDate,
                        participants: story.conversation.participants,
                    });

                    // clear messages cũ
                    const msgsSnap = await getDocs(collection(convRef, "messages"));
                    for (const m of msgsSnap.docs) {
                        await deleteDoc(m.ref);
                    }

                    // lưu lại messages mới
                    for (const msg of story.conversation.messages) {
                        await setDoc(
                            doc(collection(convRef, "messages")),
                            {
                                message_time: msg.messageTime,
                                speaker: msg.speaker,
                                speech: msg.speech,
                            }
                        );
                    }
                }
            }

            // ===== cập nhật story chính =====
            const storyData: any = {
                typeStory: story.typeStory,
                ownerId: auth.currentUser?.uid,
                processing: story.processing,
                relatedUsers: story.relatedUsers,
                shareType: story.shareType,
                storyGeneratedDate: story.storyGeneratedDate,
                storyRecitedDate: story.storyRecitedDate,
                detailStory: story.detailStory,
                sumaryStory: story.sumaryStory,
                title: story.title,
            };

            if (story.typeStory === "chat" && conversationId) {
                storyData.conversationId = conversationId;
            }
            if (story.typeStory === "call" && story.callId) {
                storyData.callId = story.callId;

                // lấy callerId và calleeId trong calls/{callId}
                const callRef = doc(db, "calls", story.callId);
                const callSnap = await getDoc(callRef);
                if (callSnap.exists()) {
                    const callData = callSnap.data();
                    const callerId = callData.callerId;
                    const calleeId = callData.calleeId;

                    storyData.relatedUsers = [callerId, calleeId];
                }
            }

            await setDoc(storyRef, storyData);

            // ===== initQuestions =====
            const initQRef = collection(storyRef, "initQuestions");
            // xóa cũ
            const qsSnap = await getDocs(initQRef);
            for (const q of qsSnap.docs) {
                await deleteDoc(q.ref);
            }
            // thêm mới
            for (const q of story.initQuestions) {
                await setDoc(doc(initQRef), {
                    question: q.question,
                    answer: q.answer,
                });
            }

            Alert.alert("Story saved to Firestore");
        } catch (err) {
            Alert.alert("❌ Error saving story:" + err);
        }
    };
    const handleSaveStory = async () => {
        await saveStoryToFirebase()
        router.replace({
            pathname: "/(tabs)",
        });
    };

    const handleGenerateStory = async () => {
        await saveStoryToFirebase()
        router.push({
            pathname: "/story/new_story/step7_loadingGenerate",
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#353A3F", "#353A3F"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.closeButton}
                >
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.iconContainer}>
                    <View style={styles.glowCircle}>
                        <Image
                            source={require("../../../assets/images/NewUI/Group 70.png")}
                        />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.mainText}>
                        Generate a story from our conversation or save your in-progress
                        story for another day.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleViewTranscript}
                    >
                        <Text style={styles.actionButtonText}>View transcript</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleSaveStory}
                    >
                        <Text style={styles.actionButtonText}>Save story</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleGenerateStory}
                    >
                        <Text style={styles.actionButtonText}>Generate story</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
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
        paddingHorizontal: 30,
        paddingTop: screenRatio >= 2 ? 60 : 30,
    },
    closeButton: {
        alignSelf: "flex-end",
        marginBottom: screenRatio >= 2 ? 60 : 30,
    },
    closeText: {
        fontSize: screenRatio >= 2 ? 35 : 30,
        color: "#999",
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: screenRatio >= 2 ? 40 : 20,
    },
    glowCircle: {
        paddingVertical: screenRatio >= 2 ? 58 : 40,
        paddingHorizontal: screenRatio >= 2 ? 50 : 30,
        borderRadius: 1000,
        backgroundColor: "#FFD700",
        justifyContent: "center",
        alignItems: "center",
    },
    textContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: screenRatio >= 2 ? 60 : 30,
    },
    mainText: {
        color: "white",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    buttonContainer: {
        paddingBottom: 50,
    },
    actionButton: {
        backgroundColor: "#EAF2F8",
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 1000,
        alignItems: "center",
        marginBottom: 15,
    },
    actionButtonText: {
        color: "#333",
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
    },
});
