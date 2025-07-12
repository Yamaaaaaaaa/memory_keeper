import { View, StyleSheet, Text, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { screenRatio } from '@/utils/initScreen';
import { useTrackedRouter } from '@/hooks/useTrackedRouter';

interface Friend {
    uid: string;
    name: string;
    profilePicture: string;
}


export default function FriendListScreen() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const router = useTrackedRouter();
    useEffect(() => {
        const fetchFriends = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const data = userDoc.data();
                if (!data) return;

                const friendIds: string[] = data.friends || [];

                const friendPromises: Promise<Friend>[] = friendIds.map(async (id: string) => {
                    const friendDoc = await getDoc(doc(db, 'users', id));
                    const friendData = friendDoc.data();
                    return {
                        uid: id,
                        name: friendData?.username || 'No Name',
                        profilePicture: friendData?.profilePicture || '',
                    };
                });

                const friendList = await Promise.all(friendPromises);
                setFriends(friendList);
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };

        fetchFriends();
    }, []);

    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#FFDCD1", "#ECEBD0"]} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <Text style={styles.title}>My family and friends</Text>

                <View style={styles.inputSearchView}>
                    <Image source={require("../../assets/images/NewUI/search-normal.png")} style={styles.inputSearchImg}></Image>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {
                    filteredFriends.length === 0 ?
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateSubtext}>You don’t have anyone in your contact list yet. Add family and friends from your phone contacts or send pdf as a link</Text>
                        </View>
                        :
                        <FlatList
                            data={filteredFriends}
                            keyExtractor={(item) => item.uid}
                            numColumns={3}
                            contentContainerStyle={styles.grid}
                            renderItem={({ item }) => (
                                <View style={styles.friendItem}>
                                    <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
                                    <Text style={styles.name}>{item.name}</Text>
                                </View>
                            )}
                        />
                }

            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/(tabs)/invite_contact")}>
                <Image source={require("../../assets/images/NewUI/profile-add.png")}></Image>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        flexDirection: "column",
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    contentWrapper: {
        zIndex: 2,
        width: "100%",
        alignItems: 'center',
        paddingTop: 65,
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 28,
        fontFamily: "Alberts",
        marginBottom: 30,
    },
    inputSearchImg: {
        marginRight: 8,
    },
    inputSearchView: {
        backgroundColor: "#FEF4F6",
        flexDirection: "row",
        borderRadius: 12,
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    searchInput: {
        fontSize: 18,
        fontFamily: "Alberts",
    },
    emptyState: {
        marginTop: 60,
        alignItems: "center",
        opacity: 0.5,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: screenRatio >= 2 ? 24 : 22,
        fontFamily: "Judson",
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: screenRatio >= 2 ? 22 : 20,
        fontFamily: "Alberts",
    },
    grid: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
    },
    friendItem: {
        alignItems: 'center',
        marginRight: 18,
    },
    avatar: {
        width: screenRatio >= 2 ? 108 : 90,
        height: screenRatio >= 2 ? 108 : 90,
        borderRadius: 1000,
    },
    name: {
        fontSize: screenRatio >= 2 ? 22 : 18,
        fontFamily: "Alberts",
    },
    addButton: {
        backgroundColor: '#353A3F',
        width: 80,
        height: 80,
        borderRadius: 1000,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 60,
        right: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    addIcon: {
        fontSize: 22,
        color: '#fff',
    },
});
