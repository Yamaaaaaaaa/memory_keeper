import { Link, Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native'; // Import Text

export default function NotFoundScreen() {
  return (
    <>
      {/* Cấu hình header cho màn hình Not Found */}
      <Stack.Screen options={{ title: "Oops! Screen not found." }} />
      <View style={styles.container}>
        <Text style={{ marginBottom: 20 }}>Không tìm thấy màn hình này.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});