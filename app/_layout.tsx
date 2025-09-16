import { IncomingCallNotification } from "@/components/IncomingCallNotification";
import { CallProvider } from "@/contexts/CallContext";
import { db } from "@/firebase/firebaseConfig";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";
import { useNavigationStore } from "@/store/navigationStore";
import { useStoryEditingStore } from "@/store/storyEditingStore";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StepCreateStoriesLayout() {
  const [loaded] = useFonts({
    Alberts: require("../assets/fonts/AlbertSans-Regular.ttf"),
    Judson: require("../assets/fonts/Judson-Regular.ttf"),
    Inika: require("../assets/fonts/Inika-Regular.ttf"),
    Montserrat: require("../assets/fonts/Montserrat-Regular.ttf"),
  });

  const router = useTrackedRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const {
    forwardStack,
    pushToForward,
    popFromForward,
    backStack,
    pushToBack,
    popFromBack,
    clearBackStack,
  } = useNavigationStore();

  const canGoBack = backStack.length > 0;
  const { clearStory } = useStoryEditingStore();

  const saveStoryToFirebase = async () => {
    try {
      const { clearStory, updateStory, initQuestions, story_generated_date, story_recited_date, id, ...storyData } =
        useStoryEditingStore.getState();

      let storyRef;

      if (id) {
        // 🔹 Có id → cập nhật document
        storyRef = doc(db, "stories", id);
        await updateDoc(storyRef, storyData);

        // Xử lý initQuestions (ghi đè hoặc merge)
        for (const q of initQuestions) {
          if (q.id) {
            // nếu question đã có id → cập nhật
            const qRef = doc(db, "stories", id, "initQuestions", q.id);
            await updateDoc(qRef, { question: q.question, answer: q.answer });
          } else {
            // nếu chưa có id → thêm mới
            await addDoc(collection(db, "stories", id, "initQuestions"), {
              question: q.question,
              answer: q.answer,
            });
          }
        }
      } else {
        // Chưa có id → tạo mới
        storyRef = await addDoc(collection(db, "stories"), storyData);

        // Sau khi tạo mới → lưu initQuestions
        for (const q of initQuestions) {
          await addDoc(collection(storyRef, "initQuestions"), {
            question: q.question,
            answer: q.answer,
          });
        }

      }
    } catch (error) {
      console.error("Error saving story:", error);
    } finally {
      clearStory();
    }
  };

  const handleExitConfirm = (onConfirm: () => void) => {
    Alert.alert(
      "Exit Story Creation",
      "Do you want to save your progress before exiting?",
      [
        {
          text: "Yes, Save",
          onPress: async () => {
            await saveStoryToFirebase();
            clearStory();
            onConfirm();
          },
        },
        {
          text: "No, Discard",
          style: "destructive",
          onPress: () => {
            clearStory();
            onConfirm();
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const goBack = () => {
    if (!canGoBack) return;

    // Only show alert if on step1_intro
    if (pathname === "/story/new_story/step1_intro") {
      handleExitConfirm(() => {
        if (pathname) pushToForward(pathname);
        const prevPath = popFromBack();
        if (prevPath) router.push(prevPath as any);
      });
      return;
    }

    if (pathname) pushToForward(pathname);
    const prevPath = popFromBack();
    if (prevPath) router.push(prevPath as any);
  };

  const goForward = () => {
    const nextPath = popFromForward();
    if (nextPath) {
      pushToBack(pathname);
      router.push(nextPath as any);
    }
  };

  const goHome = () => {
    if (pathname.startsWith("/story/new_story")) {
      handleExitConfirm(() => {
        pushToBack(pathname);
        clearBackStack();
        router.push("/");
      });
      return;
    }

    pushToBack(pathname);
    clearBackStack();
    router.push("/");
  };

  const hideTabBar =
    pathname === "/" ||
    pathname.startsWith("/(auth)") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot_password" ||
    pathname === "/+not-found";

  if (!loaded) return null;

  return (
    <CallProvider>
      <IncomingCallNotification />
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="story" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{}} />
        </Stack>

        {!hideTabBar && (
          <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity
              onPress={goBack}
              disabled={!canGoBack}
              style={[styles.button, !canGoBack && styles.disabled]}
            >
              <Image source={require("../assets/images/NewUI/Chev_left.png")} />
            </TouchableOpacity>

            <TouchableOpacity onPress={goHome} style={styles.button}>
              <Image source={require("../assets/images/NewUI/HomeIcon.png")} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goForward}
              disabled={forwardStack.length === 0}
              style={[styles.button, forwardStack.length === 0 && styles.disabled]}
            >
              <Image
                source={require("../assets/images/NewUI/Chev_right.png")}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </CallProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 17,
    paddingHorizontal: 28,
    backgroundColor: "#303336",
  },
  button: {
    alignItems: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
