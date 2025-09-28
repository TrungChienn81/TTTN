import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useSettings } from "../context/SettingsContext";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";

const OtherScreen = () => {
    const { language, theme } = useSettings();

    return (
        <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
            <Text style={[styles.text, theme === "dark" && styles.darkText]}>
                {language === "vi" ? "Nội dung khác" : "Other Content"}
            </Text>
        </View>
    );
};

const OtherScreens = () => {
    const { language, theme } = useSettings();
    const navigation = useNavigation();
    const [query, setQuery] = useState("");

    const handleSearch = () => {
        navigation.navigate("Search", { query });
    };

    return (
        <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
            <Animatable.Text animation="fadeIn" style={[styles.text, theme === "dark" && styles.darkText]}>
                {language === "vi" ? "Nội dung khác" : "Other Content"}
            </Animatable.Text>
            <Animatable.View animation="fadeInUp" style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={language === "vi" ? "Tìm kiếm sản phẩm..." : "Search products..."}
                    value={query}
                    onChangeText={setQuery}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>{language === "vi" ? "Tìm kiếm" : "Search"}</Text>
                </TouchableOpacity>
            </Animatable.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        padding: 20,
    },
    darkContainer: {
        backgroundColor: "#333",
    },
    text: {
        fontSize: 18,
        color: "#333",
        marginBottom: 20,
    },
    darkText: {
        color: "#fff",
    },
    searchContainer: {
        width: "100%",
        alignItems: "center",
    },
    searchInput: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        width: "100%",
    },
    searchButton: {
        backgroundColor: "#6200EE",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    searchButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default OtherScreens;
