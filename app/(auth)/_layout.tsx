import { Stack } from "expo-router";
import React from "react";

export default function TabsLayout() {
    return (
        <Stack>
            <Stack.Screen name="login" options={{
                headerTitle: "Login",
                headerShown: false,
            }} />
            <Stack.Screen name="register" options={{
                headerTitle: "Register",
                headerShown: false,
            }} />
            <Stack.Screen name="forgot_password" options={{
                headerTitle: "Forgot Password: Enter Email",
                headerShown: false,
            }} />
            <Stack.Screen name="reset_password" options={{
                headerTitle: "Reset Password",
                headerShown: false,
            }} />
        </Stack>
    );
}
