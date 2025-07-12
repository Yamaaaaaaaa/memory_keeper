import { Stack } from "expo-router";
import React from "react";

export default function StoriesLayout() {
    return (
        <Stack>
            <Stack.Screen name="new_story" options={{ headerShown: false }} />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: false,
                    presentation: 'card',
                    animation: 'slide_from_right'
                }}
            />
            {/* Các màn khác nếu muốn ẩn header tương tự */}
        </Stack>
    );
}