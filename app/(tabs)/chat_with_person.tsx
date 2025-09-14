import { auth, db } from "@/firebase/firebaseConfig"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore"
import React, { useEffect, useRef, useState } from "react"
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

interface Message {
    id: string
    speech: string
    speaker: string
    message_time: any
}

export default function ChatWithUser() {
    const { id: friendId } = useLocalSearchParams<{ id: string }>()
    const [messages, setMessages] = useState<Message[]>([])
    const [text, setText] = useState("")
    const [friend, setFriend] = useState<{ uid: string; username: string; profilePicture?: string } | null>(null)
    const [conversationId, setConversationId] = useState<string>("")
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const flatListRef = useRef<FlatList>(null)

    const currentUser = auth.currentUser

    useEffect(() => {
        if (!currentUser || !friendId) return

        const init = async () => {
            // Get friend info
            const friendDoc = await getDoc(doc(db, "users", friendId))
            if (friendDoc.exists()) {
                setFriend({ uid: friendId, ...friendDoc.data() } as any)
            }

            // Find conversation with 2 participants
            const q = query(
                collection(db, "conversations"),
                where("participants", "in", [
                    [currentUser.uid, friendId],
                    [friendId, currentUser.uid],
                ])
            )

            let convId: string | null = null

            const unsubConv = onSnapshot(q, async (snapshot) => {
                if (!snapshot.empty) {
                    const conv = snapshot.docs[0]
                    convId = conv.id
                    setConversationId(conv.id)
                } else {
                    // Create new conversation
                    const newConvRef = doc(collection(db, "conversations"))
                    await setDoc(newConvRef, {
                        participants: [currentUser.uid, friendId],
                        conversation_start_date: serverTimestamp(),
                    })
                    convId = newConvRef.id
                    setConversationId(newConvRef.id)
                }

                if (convId) {
                    // Listen to messages
                    const msgsQuery = query(
                        collection(db, "conversations", convId, "messages"),
                        orderBy("message_time", "asc")
                    )
                    onSnapshot(msgsQuery, (snapshot) => {
                        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[])
                    })
                }
            })

            return () => {
                unsubConv()
            }
        }

        init()
    }, [currentUser, friendId])

    const sendMessage = async () => {
        if (!text.trim() || !conversationId) return

        if (editingMessageId) {
            // update existing message
            await updateDoc(doc(db, "conversations", conversationId, "messages", editingMessageId), {
                speech: text,
            })
            setEditingMessageId(null)
        } else {
            // add new message
            await addDoc(collection(db, "conversations", conversationId, "messages"), {
                speech: text,
                speaker: currentUser?.uid,
                message_time: serverTimestamp(),
            })
        }
        setText("")
    }

    const handleLongPress = (item: Message) => {
        if (item.speaker !== currentUser?.uid) return // allow edit/delete only for own messages

        Alert.alert("Options", "What do you want to do?", [
            {
                text: "Edit",
                onPress: () => {
                    setText(item.speech)
                    setEditingMessageId(item.id)
                },
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    await deleteDoc(doc(db, "conversations", conversationId, "messages", item.id))
                },
            },
            { text: "Cancel", style: "cancel" },
        ])
    }

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.speaker === currentUser?.uid
        const avatarLetter = isMe
            ? currentUser?.displayName?.[0]?.toUpperCase() || "M"
            : friend?.username?.[0]?.toUpperCase() || "F"

        return (
            <TouchableOpacity
                onLongPress={() => handleLongPress(item)}
                activeOpacity={0.8}
            >
                <View
                    style={[
                        styles.messageRow,
                        isMe ? styles.myMessageRow : styles.theirMessageRow,
                    ]}
                >
                    {!isMe && (
                        friend?.profilePicture ? (
                            <Image source={{ uri: friend.profilePicture }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarText}>{avatarLetter}</Text>
                            </View>
                        )
                    )}
                    <View
                        style={[
                            styles.messageBubble,
                            isMe ? styles.myBubble : styles.theirBubble,
                        ]}
                    >
                        <Text style={styles.messageText}>{item.speech}</Text>
                    </View>
                    {isMe && (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarText}>{avatarLetter}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>
                        {editingMessageId ? "Update" : "Send"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { ...StyleSheet.absoluteFillObject },
    chatContent: { padding: 16, paddingBottom: 80, paddingTop: 30 },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
    },
    myMessageRow: { justifyContent: "flex-end" },
    theirMessageRow: { justifyContent: "flex-start" },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        maxWidth: "70%",
    },
    myBubble: {
        backgroundColor: "#FFFEDD",
        marginLeft: 8,
    },
    theirBubble: {
        backgroundColor: "#66621C",
        marginRight: 8,
    },
    messageText: { color: "#000" },
    inputContainer: {
        flexDirection: "row",
        padding: 12,
        backgroundColor: "#fff",
        alignItems: "center",
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 20,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: "#4A4A4A",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    sendButtonText: { color: "#fff" },
    avatar: { width: 36, height: 36, borderRadius: 18 },
    avatarFallback: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#999",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 8,
    },
    avatarText: { color: "#fff", fontWeight: "bold" },
})
