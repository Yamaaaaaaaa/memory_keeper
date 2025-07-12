import { Stack } from "expo-router";
import React from "react";

export default function StepCreateStoriesLayout() {
    return (
        <Stack>
            <Stack.Screen name="step1_intro" options={{ headerShown: false }} />
            <Stack.Screen name="step2_initQuestion" options={{ headerShown: false }} />
            <Stack.Screen name="step3_startStory" options={{ headerShown: false }} />
            <Stack.Screen name="step4_selectShareStories" options={{ headerShown: false }} />
            <Stack.Screen name="step4_2_selectChatPeopleOrAI" options={{ headerShown: false }} />
            <Stack.Screen name="step4_3_chatWithAI" options={{ headerShown: false }} />
            <Stack.Screen name="step5_colabChooseCallType" options={{ headerShown: false }} />
            <Stack.Screen name="step6_generateScreen" options={{ headerShown: false }} />
            <Stack.Screen name="step7_loadingGenerate" options={{ headerShown: false }} />
            {/* Các màn khác nếu muốn ẩn header tương tự */}
        </Stack>
    );
}