"use client"
import { auth, db } from "@/firebase/firebaseConfig"
import { useTrackedRouter } from "@/hooks/useTrackedRouter"
import { screenRatio } from "@/utils/initScreen"
import * as Contacts from "expo-contacts"
import { LinearGradient } from "expo-linear-gradient"
import { arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore"
import React, { useEffect, useState } from "react"
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"


interface ContactItem {
    id: string
    name: string
    firstLetter: string
    phone: string
    userId?: string // Firebase user ID if registered
}

interface FirebaseUser {
    id: string
    phone: string
    username?: string
    email?: string
}

export default function InviteContactScreen() {
    const [allContacts, setAllContacts] = useState<ContactItem[]>([])
    const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([])
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
    const [selectedLetter, setSelectedLetter] = useState<string>("ALL")
    const [registeredUsers, setRegisteredUsers] = useState<FirebaseUser[]>([])
    const [loading, setLoading] = useState(false)
    const navigation = useTrackedRouter()
    const alphabet = [
        "ALL", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
        "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    ]

    // Fetch registered users from Firebase
    const fetchRegisteredUsers = async () => {
        try {
            const usersCollection = collection(db, "users")
            const usersSnapshot = await getDocs(usersCollection)
            const users: FirebaseUser[] = []

            usersSnapshot.forEach((doc) => {
                const userData = doc.data()
                if (userData.phone) {
                    users.push({
                        id: doc.id,
                        phone: userData.phone,
                        username: userData.username,
                        email: userData.email
                    })
                }
            })

            setRegisteredUsers(users)
            return users
        } catch (error) {
            console.error("Error fetching registered users:", error)
            Alert.alert("Error", "Failed to fetch registered users")
            return []
        }
    }

    // Normalize phone number for comparison
    const normalizePhoneNumber = (phone: string): string => {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '')

        // Handle different phone number formats
        if (digitsOnly.startsWith('84')) {
            return '0' + digitsOnly.substring(2) // Convert +84 to 0
        }
        if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
            return digitsOnly // US format
        }
        return digitsOnly
    }

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true)

            // First fetch registered users
            const users = await fetchRegisteredUsers()

            const { status } = await Contacts.requestPermissionsAsync()
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Cannot access contacts without permission.")
                setLoading(false)
                return
            }

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
            })

            if (data.length > 0) {
                const contactList: ContactItem[] = []

                data.forEach((contact) => {
                    const name = contact.name || "Unnamed"
                    const firstLetter = name[0].toUpperCase()

                    // Check if contact has phone numbers
                    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                        contact.phoneNumbers.forEach((phoneNumber) => {
                            const normalizedContactPhone = normalizePhoneNumber(phoneNumber.number || "")

                            // Check if this phone number belongs to a registered user
                            const registeredUser = users.find(user =>
                                normalizePhoneNumber(user.phone) === normalizedContactPhone
                            )

                            // Only add contact if they are a registered user
                            if (registeredUser) {
                                contactList.push({
                                    id: `${contact.id}_${phoneNumber.id}`,
                                    name: registeredUser.username || name,
                                    firstLetter,
                                    phone: phoneNumber.number || "",
                                    userId: registeredUser.id
                                })
                            }
                        })
                    }
                })

                // Remove duplicates and sort
                const uniqueContacts = contactList.filter((contact, index, self) =>
                    index === self.findIndex(c => c.userId === contact.userId)
                )

                const sortedContacts = uniqueContacts.sort((a, b) => a.name.localeCompare(b.name))

                setAllContacts(sortedContacts)
                setFilteredContacts(sortedContacts)
            }

            setLoading(false)
        }

        fetchContacts()
    }, [])

    useEffect(() => {
        if (selectedLetter === "ALL") {
            setFilteredContacts(allContacts)
        } else {
            setFilteredContacts(allContacts.filter((contact) => contact.firstLetter === selectedLetter))
        }
    }, [selectedLetter, allContacts])

    const toggleSelect = (id: string) => {
        setSelectedContacts((prev) => {
            const updated = new Set(prev)
            if (updated.has(id)) {
                updated.delete(id)
            } else {
                updated.add(id)
            }
            return updated
        })
    }

    const handleLetterPress = (letter: string) => {
        setSelectedLetter(letter)
    }

    const handleContinue = async () => {
        if (selectedContacts.size === 0) {
            Alert.alert("No Selection", "Please select at least one contact to invite.")
            return
        }

        if (!auth.currentUser) {
            Alert.alert("Error", "You must be logged in to add friends.")
            return
        }

        setLoading(true)

        try {
            const currentUserId = auth.currentUser.uid
            const currentUserRef = doc(db, "users", currentUserId)

            // Get current user's friends list to avoid duplicates
            const currentUserDoc = await getDoc(currentUserRef)
            const currentUserData = currentUserDoc.data()
            const existingFriends = currentUserData?.friends || []

            // Get selected contacts' user IDs
            const selectedUserIds: string[] = []
            selectedContacts.forEach(contactId => {
                const contact = allContacts.find(c => c.id === contactId)
                if (contact?.userId && !existingFriends.includes(contact.userId)) {
                    selectedUserIds.push(contact.userId)
                }
            })

            if (selectedUserIds.length === 0) {
                Alert.alert("Info", "All selected contacts are already your friends.")
                setLoading(false)
                return
            }

            // Update current user's friends array
            await updateDoc(currentUserRef, {
                friends: arrayUnion(...selectedUserIds)
            })

            // Optionally, you can also add the current user to selected users' friends arrays
            // This creates a bidirectional friendship
            const updatePromises = selectedUserIds.map(async (userId) => {
                const friendRef = doc(db, "users", userId)
                return updateDoc(friendRef, {
                    friends: arrayUnion(currentUserId)
                })
            })

            await Promise.all(updatePromises)

            Alert.alert(
                "Success",
                `Successfully added ${selectedUserIds.length} friend(s)!`,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // Reset selections or navigate back
                            setSelectedContacts(new Set())
                            // You might want to navigate back here
                            // navigation.back()
                        }
                    }
                ]
            )

        } catch (error) {
            console.error("Error adding friends:", error)
            Alert.alert("Error", "Failed to add friends. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const renderContact = ({ item }: { item: ContactItem }) => {
        const isSelected = selectedContacts.has(item.id)
        return (
            <TouchableOpacity
                onPress={() => toggleSelect(item.id)}
                style={[styles.contactItem, isSelected && styles.contactItemSelected]}
            >
                <View style={styles.contactInfo}>
                    <Text style={styles.contactText}>{item.name}</Text>
                    {/* <Text style={styles.contactPhone}>{item.phone}</Text> */}
                </View>
                {isSelected && (
                    <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedText}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        )
    }

    const renderAlphabetItem = (letter: string) => {
        const isSelected = selectedLetter === letter
        return (
            <TouchableOpacity
                key={letter}
                onPress={() => handleLetterPress(letter)}
                style={[styles.alphabetItem, isSelected && styles.alphabetItemSelected]}
            >
                <Text style={[styles.alphabetText, isSelected && styles.alphabetTextSelected]}>
                    {letter === "ALL" ? "•" : letter}
                </Text>
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <Text style={styles.title}>Invite family and friends</Text>
                <Text style={styles.subtitle}>Share your stories with your loved ones.</Text>

                <View style={styles.contactHeader}>
                    <Image source={require("../../assets/images/NewUI/profile-add (1).png")} style={styles.icon}></Image>
                    <Text style={styles.contactTextLabel}>
                        From your contacts ({filteredContacts.length} registered users)
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading contacts...</Text>
                    </View>
                ) : (
                    <View style={styles.mainContent}>
                        {/* Alphabet Index */}
                        <View style={styles.alphabetContainer}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.alphabetScrollContent}>
                                {alphabet.map((letter) => renderAlphabetItem(letter))}
                            </ScrollView>
                        </View>

                        {/* Contacts List */}
                        <View style={styles.contactsContainer}>
                            <FlatList
                                data={filteredContacts}
                                keyExtractor={(item) => item.id}
                                renderItem={renderContact}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.contactsList}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>
                                            No registered users found in your contacts
                                        </Text>
                                    </View>
                                }
                            />

                            <TouchableOpacity
                                style={[
                                    styles.continueButton,
                                    (selectedContacts.size === 0 || loading) && styles.continueButtonDisabled
                                ]}
                                onPress={handleContinue}
                                disabled={selectedContacts.size === 0 || loading}
                            >
                                <Text style={[
                                    styles.continueButtonText,
                                    (selectedContacts.size === 0 || loading) && styles.continueButtonTextDisabled
                                ]}>
                                    {loading ? "Adding..." : `Continue (${selectedContacts.size})`}
                                </Text>
                                <Image source={require("../../assets/images/NewUI/Chev_right.png")}></Image>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    contentWrapper: {
        zIndex: 2,
        flex: 1,
        paddingTop: 50,
    },
    title: {
        fontSize: 28,
        fontFamily: "Alberts",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "400",
        fontFamily: "Judson",
        textAlign: "center",
        marginBottom: screenRatio >= 2 ? 50 : 30,
    },
    contactHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    icon: {
        fontSize: 18,
        marginRight: 8,
    },
    contactTextLabel: {
        fontSize: 18,
        fontFamily: "Alberts"
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 18,
        fontFamily: "Alberts",
        color: "#666",
    },
    mainContent: {
        flex: 1,
        flexDirection: "row",
    },
    alphabetContainer: {
        width: 40,
        marginRight: screenRatio >= 2 ? 60 : 20,
    },
    alphabetScrollContent: {
        paddingVertical: 8,
    },
    alphabetItem: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    alphabetItemSelected: {
        backgroundColor: "#95BDDC",
    },
    alphabetText: {
        fontSize: 18,
        fontFamily: "Alberts"
    },
    alphabetTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },
    contactsContainer: {
        flex: 1,
    },
    contactsList: {
        paddingBottom: 20,
    },
    contactItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "rgba(254, 244, 246, 0.31)",
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    contactItemSelected: {
        backgroundColor: "rgba(100, 204, 40, 0.30)",
        borderColor: "#8FD687",
    },
    contactInfo: {
        flex: 1,
    },
    contactText: {
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        fontWeight: "400",
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: screenRatio >= 2 ? 16 : 14,
        fontFamily: "Alberts",
        color: "#666",
        fontWeight: "300",
    },
    selectedIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#8FD687",
        justifyContent: "center",
        alignItems: "center",
    },
    selectedText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: "Alberts",
        color: "#666",
        textAlign: "center",
    },
    continueButton: {
        marginBottom: 17,
        marginTop: 20,
        marginHorizontal: 40,
        backgroundColor: "#353A3F",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 1000,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: "row",
        justifyContent: "center",
    },
    continueButtonDisabled: {
        backgroundColor: "#ccc",
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        fontSize: screenRatio >= 2 ? 22 : 16,
        fontFamily: "Alberts",
        color: "#fff",
        marginRight: 10,
    },
    continueButtonTextDisabled: {
        color: "#999",
    },
})