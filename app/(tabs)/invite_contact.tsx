"use client"

import { useEffect, useState } from "react"
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, FlatList, Image } from "react-native"
import * as Contacts from "expo-contacts"
import { LinearGradient } from "expo-linear-gradient"
import { screenRatio } from "@/utils/initScreen"
import React from "react";

interface ContactItem {
    id: string
    name: string
    firstLetter: string
}

export default function InviteContactScreen() {
    const [allContacts, setAllContacts] = useState<ContactItem[]>([])
    const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([])
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
    const [selectedLetter, setSelectedLetter] = useState<string>("ALL")
    const alphabet = [
        "ALL",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
    ]

    useEffect(() => {
        const fetchContacts = async () => {
            const { status } = await Contacts.requestPermissionsAsync()
            if (status !== "granted") {
                Alert.alert("Permission Denied", "Cannot access contacts without permission.")
                return
            }

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers],
            })

            if (data.length > 0) {
                const contactList: ContactItem[] = data
                    .map((contact) => {
                        const name = contact.name || "Unnamed"
                        const firstLetter = name[0].toUpperCase()
                        return {
                            id: contact.id as string,
                            name,
                            firstLetter,
                        }
                    })
                    .sort((a, b) => a.name.localeCompare(b.name))

                const letters = [...new Set(contactList.map((contact) => contact.firstLetter))].sort()

                setAllContacts(contactList)
                setFilteredContacts(contactList)
            }
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

    const renderContact = ({ item }: { item: ContactItem }) => {
        const isSelected = selectedContacts.has(item.id)
        return (
            <TouchableOpacity
                onPress={() => toggleSelect(item.id)}
                style={[styles.contactItem, isSelected && styles.contactItemSelected]}
            >
                <Text style={styles.contactText}>{item.name}</Text>
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
                    <Text style={styles.contactTextLabel}>From your contacts</Text>
                </View>

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
                        />
                        <TouchableOpacity style={styles.continueButton}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Image source={require("../../assets/images/NewUI/Chev_right.png")}></Image>
                        </TouchableOpacity>
                    </View>
                </View>
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
        fontWeight: 400,
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
    mainContent: {
        flex: 1,
        flexDirection: "row",
        // marginBottom: 50,
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
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: "rgba(254, 244, 246, 0.31)",
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    contactItemSelected: {
        backgroundColor: "rgba(100, 204, 40, 0.30)",
        borderColor: "#8FD687",
    },
    contactText: {
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        fontWeight: "400",
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
    },
    continueButtonText: {
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
        color: "#fff",
        marginRight: 10,
    },
})
