import { useCall } from '@/contexts/CallContext';
import { auth, db } from '@/firebase/firebaseConfig';
import { useTrackedRouter } from '@/hooks/useTrackedRouter';
import { useCallStoryStore } from '@/store/callStoryStore';
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

export default function Step5_1_2_SelectPersonCall() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const router = useTrackedRouter();
    const { startCall, hasCam, hasMic } = useCall();
    const params = useLocalSearchParams()
    const { hasStory, id, initialQuestion, setHasStory, setInitQuestion } = useCallStoryStore();

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
                        name: friendData?.username || 'Không tên',
                        profilePicture: friendData?.profilePicture || '',
                    };
                });

                const friendList = await Promise.all(friendPromises);
                setFriends(friendList);
            } catch (error) {
                console.error('Lỗi khi tải danh sách bạn bè:', error);
            }
        };

        fetchFriends();
    });

    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleCall = async (friend: Friend) => {
        if (!hasCam || !hasMic) {
            Alert.alert('Lỗi', 'Cần cấp quyền truy cập Camera và Microphone');
            return;
        }
        useCallStoryStore.getState().clearAll();

        try {
            setHasStory(true);
            // convert params.previousQA (string) -> object[]
            const parsedQA = params.previousQA
                ? JSON.parse(params.previousQA as string)
                : []

            setInitQuestion({
                previousQA: parsedQA, // lúc này là mảng [{question, answer}, ...]
                storyTitle: (params.storyTitle as string) || "Untitled Story",
                shareType: (params.shareType as string) || "myself",
            })

            console.log('====================================');
            console.log("Step5_1_2 Old params: ", params);
            console.log("✅ New state:", useCallStoryStore.getState());
            console.log('====================================');

            await startCall(friend.uid.trim());
            // Điều hướng đến màn hình gọi
            router.push('/(tabs)/call_screen');

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FFDCD1', '#ECEBD0']} style={styles.gradient} />
            <View style={styles.contentWrapper}>
                <Text style={styles.title}>Chọn người để gọi</Text>

                <View style={styles.inputSearchView}>
                    <Image
                        source={require('../../../assets/images/NewUI/search-normal.png')}
                        style={styles.inputSearchImg}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm..."
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {filteredFriends.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateSubtext}>
                            Bạn chưa có ai trong danh bạ. Hãy thêm gia đình và bạn bè
                            từ danh bạ điện thoại hoặc gửi pdf dưới dạng liên kết
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredFriends}
                        keyExtractor={(item) => item.uid}
                        numColumns={3}
                        contentContainerStyle={styles.grid}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.friendItem} onPress={() => handleCall(item)}>
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
        backgroundColor: "#CCC", // nền cho avatar mặc định
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: screenRatio >= 2 ? 38 : 30,
        fontFamily: "Alberts",
        color: "#fff", // màu chữ
    },
});
