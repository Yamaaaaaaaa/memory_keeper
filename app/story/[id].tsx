"use client"
import React, { useEffect, useState } from "react"
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    Share,
    TextInput,
    Dimensions,
    StatusBar
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"
import { screenRatio } from "@/utils/initScreen"

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
const WORDS_PER_PAGE = 130;

export default function StoryDetailScreen() {
    const params = useLocalSearchParams()
    const storyId = params.id as string

    const [story, setStory] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [pages, setPages] = useState<string[]>([])
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState("")

    useEffect(() => {
        loadStory()
    }, [storyId])

    useEffect(() => {
        if (story?.detailStory) {
            paginateContent(story.detailStory)
        }
    }, [story])

    const loadStory = async () => {
        try {
            if (!storyId) {
                Alert.alert("Error", "Story ID not found")
                router.back()
                return
            }

            console.log("Loading story with ID:", storyId)
            const storyDoc = await getDoc(doc(db, "stories", storyId))

            if (storyDoc.exists()) {
                const storyData = { id: storyDoc.id, ...storyDoc.data() }
                console.log("Story loaded:", storyData)
                setStory(storyData)
                setEditedTitle(storyData.title || "Untitled Story")
            } else {
                Alert.alert("Error", "Story not found")
                router.back()
            }
        } catch (error) {
            console.error("Error loading story:", error)
            Alert.alert("Error", "Failed to load story")
            router.back()
        } finally {
            setLoading(false)
        }
    }

    const paginateContent = (content: string) => {
        const words = content.split(' ')
        const pageArray: string[] = []

        for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
            const pageWords = words.slice(i, i + WORDS_PER_PAGE)
            pageArray.push(pageWords.join(' '))
        }

        setPages(pageArray)
        console.log(`Content split into ${pageArray.length} pages`)
    }

    const handleShare = async () => {
        try {
            if (!story) return

            const shareContent = {
                message: `Check out this story: "${story.title}"\n\n${story.sumaryStory || story.summaryStory}`,
                title: story.title
            }

            await Share.share(shareContent)
        } catch (error) {
            console.error("Error sharing story:", error)
        }
    }

    const handleTitleEdit = async () => {
        if (isEditingTitle) {
            try {
                await updateDoc(doc(db, "stories", storyId), {
                    title: editedTitle
                })
                setStory({ ...story, title: editedTitle })
                setIsEditingTitle(false)
            } catch (error) {
                console.error("Error updating title:", error)
                Alert.alert("Error", "Failed to update title")
            }
        } else {
            setIsEditingTitle(true)
        }
    }

    const nextPage = () => {
        if (currentPage < pages.length) {
            setCurrentPage(currentPage + 1)
        }
    }

    const goToPage = (pageNumber: number) => {
        setCurrentPage(pageNumber)
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <LinearGradient colors={["#F5E6D3", "#E8D5C4"]} style={styles.gradient} />
                <Text style={styles.loadingText}>Loading story...</Text>
            </View>
        )
    }

    if (!story) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <LinearGradient colors={["#F5E6D3", "#E8D5C4"]} style={styles.gradient} />
                <Text style={styles.errorText}>Story not found</Text>
            </View>
        )
    }

    const renderPageNumbers = () => {
        const pageNumbers = []
        const maxVisiblePages = 4

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
        let endPage = Math.min(pages.length, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.pageNumber,
                        currentPage === i && styles.activePageNumber
                    ]}
                    onPress={() => goToPage(i)}
                >
                    <Text style={[
                        styles.pageNumberText,
                        currentPage === i && styles.activePageNumberText
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            )
        }

        return pageNumbers
    }

    const currentContent = pages.length > 0 ? pages[currentPage - 1] : story.detailStory

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <LinearGradient colors={["#F5E6D3", "#E8D5C4"]} style={styles.gradient} />

            {/* Main Content Container */}
            <View style={styles.contentCard}>
                {/* Header with Share Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                        <Ionicons name="share-outline" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Title Section */}
                <View style={styles.titleSection}>
                    {isEditingTitle ? (
                        <View style={styles.titleEditContainer}>
                            <TextInput
                                style={styles.titleInput}
                                value={editedTitle}
                                onChangeText={setEditedTitle}
                                onSubmitEditing={handleTitleEdit}
                                onBlur={handleTitleEdit}
                                autoFocus
                                multiline
                                placeholder="Enter story title"
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.titleContainer}
                            onPress={handleTitleEdit}
                        >
                            <Text style={styles.title}>{story.title}</Text>
                            <Ionicons name="pencil" size={22} color="#666" style={styles.editIcon} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Story Content */}
                <ScrollView
                    style={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={styles.storyText}>
                        {currentContent}
                    </Text>
                </ScrollView>

                {/* Pagination Controls */}
                {pages.length > 1 && (
                    <View style={styles.paginationContainer}>
                        <View style={styles.paginationControls}>
                            {renderPageNumbers()}

                            {/* {currentPage < pages.length && (
                                <TouchableOpacity
                                    style={styles.nextButton}
                                    onPress={nextPage}
                                >
                                    <Text style={styles.nextButtonText}>Next</Text>
                                </TouchableOpacity>
                            )} */}
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
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'Alberts',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'Alberts',
        textAlign: 'center',
    },
    contentCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginVertical: screenRatio >= 2 ? 60 : 30,
        // borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    shareButton: {
    },
    titleSection: {
        paddingHorizontal: 30,
        paddingBottom: 20,
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: screenRatio >= 2 ? 28 : 24,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        fontFamily: 'Alberts',
    },
    editIcon: {
        marginLeft: 8,
    },
    titleEditContainer: {
        alignItems: 'center',
        width: '100%',
    },
    titleInput: {
        fontSize: screenRatio >= 2 ? 20 : 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        fontFamily: 'Alberts',
        borderBottomWidth: 1,
        borderBottomColor: '#666',
        paddingVertical: 5,
        width: '100%',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 30,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    storyText: {
        fontSize: 20,
        lineHeight: 26,
        color: '#333',
        fontFamily: 'Judson',
        textAlign: 'left',
    },
    paginationContainer: {
        paddingHorizontal: 30,
        paddingVertical: 25,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    pageNumber: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6,
        marginVertical: 4,
    },
    activePageNumber: {
        backgroundColor: '#333333',
    },
    pageNumberText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
        fontFamily: 'Alberts',
    },
    activePageNumberText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#333333',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginLeft: 12,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Alberts',
    },
})