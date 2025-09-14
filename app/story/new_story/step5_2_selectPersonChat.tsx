import { auth, db } from '@/firebase/firebaseConfig';
import { useTrackedRouter } from '@/hooks/useTrackedRouter';
import { screenRatio } from '@/utils/initScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Friend {
    uid: string;
    name: string;
    profilePicture: string;
}

export default function Step5_2_SelectPersonChat() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const router = useTrackedRouter();
    const params = useLocalSearchParams()

    useFocusEffect(() => {
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
    });

    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleChat = async (friend: Friend) => {
        try {
            router.push({
                pathname: "/(tabs)/chat_with_person",
                params: {
                    id: friend.uid,
                    previousQA: params.basicQA,
                    storyTitle: params.storyTitle,
                    shareType: params.shareType
                },
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            Alert.alert('Error', 'Unable to start the call');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FFDCD1', '#ECEBD0']} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <Text style={styles.title}>Select Person to Chat</Text>

                <View style={styles.inputSearchView}>
                    <Image
                        source={require('../../../assets/images/NewUI/search-normal.png')}
                        style={styles.inputSearchImg}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {filteredFriends.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateSubtext}>
                            You don’t have anyone in your contact list yet. Add family and friends
                            from your phone contacts or send pdf as a link
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredFriends}
                        keyExtractor={(item) => item.uid}
                        numColumns={3}
                        contentContainerStyle={styles.grid}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.friendItem} onPress={() => handleChat(item)}>
                                {item.profilePicture ? (
                                    <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarFallback]}>
                                        <Text style={styles.avatarText}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.name}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/(tabs)/invite_contact')}
            >
                <Image source={require('../../../assets/images/NewUI/profile-add.png')} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', flexDirection: 'column' },
    gradient: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    contentWrapper: {
        zIndex: 2,
        width: '100%',
        alignItems: 'center',
        paddingTop: 65,
        paddingHorizontal: 25,
    },
    title: { fontSize: 28, fontFamily: 'Alberts', marginBottom: 30 },
    inputSearchImg: { marginRight: 8 },
    inputSearchView: {
        backgroundColor: '#FEF4F6',
        flexDirection: 'row',
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    searchInput: { fontSize: 18, fontFamily: 'Alberts' },
    emptyState: {
        marginTop: 60,
        alignItems: 'center',
        opacity: 0.5,
        paddingHorizontal: 20,
    },
    emptyStateSubtext: {
        fontSize: screenRatio >= 2 ? 22 : 20,
        fontFamily: 'Alberts',
    },
    grid: { alignItems: 'center', justifyContent: 'center', gap: 18 },
    friendItem: { alignItems: 'center', marginRight: 18 },
    avatar: {
        width: screenRatio >= 2 ? 108 : 90,
        height: screenRatio >= 2 ? 108 : 90,
        borderRadius: 1000,
    },
    name: { fontSize: screenRatio >= 2 ? 22 : 18, fontFamily: 'Alberts' },
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
    avatarFallback: {
        backgroundColor: "#CCC", // background color for fallback avatar
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: screenRatio >= 2 ? 38 : 30,
        fontFamily: "Alberts",
        color: "#fff", // text color
    },
});
