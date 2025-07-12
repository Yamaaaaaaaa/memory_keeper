import React from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, usePathname } from "expo-router";
import { useNavigationStore } from "@/store/navigationStore";
import { useFonts } from "expo-font";
import { useTrackedRouter } from "@/hooks/useTrackedRouter";

export default function StepCreateStoriesLayout() {

  const [loaded] = useFonts({
    Alberts: require('../assets/fonts/AlbertSans-Regular.ttf'),
    Judson: require('../assets/fonts/Judson-Regular.ttf'),
    Inika: require('../assets/fonts/Inika-Regular.ttf'),
    Montserrat: require('../assets/fonts/Montserrat-Regular.ttf'),
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
  console.log('====================================');
  console.log("pathname", pathname);
  console.log("canGoBack", canGoBack);
  console.log("backStack", backStack);
  console.log("insets", insets);
  console.log('====================================');
  const goBack = () => {
    if (!canGoBack) return;

    if (pathname) pushToForward(pathname); // Lưu path hiện tại vào forward stack
    const prevPath = popFromBack();
    if (prevPath) router.push(prevPath as any);
  };

  const goForward = () => {
    const nextPath = popFromForward();
    if (nextPath) {
      pushToBack(pathname); // Lưu lại current path khi tiến
      router.push(nextPath as any);
    }
  };

  const goHome = () => {
    pushToBack(pathname);
    clearBackStack()
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
            {/* <Ionicons name="arrow-back" size={20} color={canGoBack ? "black" : "gray"} /> */}
            <Image source={require("../assets/images/NewUI/Chev_left.png")} />
            {/* <Text>Back</Text> */}
          </TouchableOpacity>

          <TouchableOpacity onPress={goHome} style={styles.button}>
            {/* <Ionicons name="home" size={20} color="black" /> */}
            <Image source={require("../assets/images/NewUI/HomeIcon.png")} />
            {/* <Text>Home</Text> */}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goForward}
            disabled={forwardStack.length === 0}
            style={[styles.button, forwardStack.length === 0 && styles.disabled]}
          >
            {/* <Ionicons name="arrow-forward" size={20} color={forwardStack.length > 0 ? "black" : "gray"} /> */}
            <Image source={require("../assets/images/NewUI/Chev_right.png")} />
            {/* <Text>Forward</Text> */}
          </TouchableOpacity>
        </View>
      )}
    </View>
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
