import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { List, Divider } from "react-native-paper";

const OrderHistoryScreen = () => {
    const orders = [
        { id: "1", date: "01/01/2023", total: "100,000 VND" },
        { id: "2", date: "15/01/2023", total: "200,000 VND" },
        { id: "3", date: "20/01/2023", total: "150,000 VND" },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Order History</Text>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View>
                        <List.Item
                            title={`Order ID: ${item.id}`}
                            description={`Date: ${item.date}\nTotal: ${item.total}`}
                            left={() => <List.Icon icon="receipt" />}
                        />
                        <Divider />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
        color: "#333",
    },
});

export default OrderHistoryScreen;
