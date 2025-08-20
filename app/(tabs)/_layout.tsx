"use client"

import { IncomingCallNotification } from "@/components/IncomingCallNotification"
import { CallProvider } from "@/contexts/CallContext"
import { auth } from "@/firebase/firebaseConfig"
import { router, Tabs } from "expo-router"
import { onAuthStateChanged } from "firebase/auth"
import React, { useEffect } from "react"

export default function TabsLayout() {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace("/(auth)/login")
            }
        })

        return unsubscribe
    }, [])

    return (
        <CallProvider>

            <IncomingCallNotification />
            <Tabs>
                <Tabs.Screen
                    name="index"
                    options={{
                        headerTitle: "Sticker Smash",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
                <Tabs.Screen
                    name="about"
                    options={{
                        headerTitle: "About",
                        headerShown: false,
                    }}
                />
                <Tabs.Screen
                    name="my_stories"
                    options={{
                        headerTitle: "My Stories",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        headerTitle: "Profile",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
                <Tabs.Screen
                    name="friend_list"
                    options={{
                        headerTitle: "Friend List",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
                <Tabs.Screen
                    name="invite_contact"
                    options={{
                        headerTitle: "Invite Contacts",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
                <Tabs.Screen
                    name="home_call_screen"
                    options={{
                        headerTitle: "Home_CallScreen",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
                <Tabs.Screen
                    name="call_screen"
                    options={{
                        headerTitle: "CallScreen",
                        headerShown: false,
                        tabBarStyle: { display: "none" }, // Ẩn toàn bộ tab bar khi ở tab này
                    }}
                />
            </Tabs>
        </CallProvider>
    )
}
