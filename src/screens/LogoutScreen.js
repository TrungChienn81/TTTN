import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";

const LogoutScreen = () => {
    const navigation = useNavigation();

    useEffect(() => {
        // Perform logout logic here, e.g., clearing tokens, etc.
        setTimeout(() => {
            navigation.navigate("Login");
        }, 2000);
    }, [navigation]);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
            <Text>Đang đăng xuất...</Text>
        </View>
    );
};

export default LogoutScreen;
