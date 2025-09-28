import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import axios from "axios";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    
   
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);

    try {
      
      const response = await axios.post(
        "http://10.0.2.2:3055/v1/api/chatbot/query",
        { question: input },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const assistantReply = response.data.answer;
      setMessages(prev => [...prev, { role: "assistant", content: assistantReply }]);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Có lỗi xảy ra, vui lòng thử lại." }
      ]);
    }
    setInput("");
  };

  return (
    <View style={styles.chatContainer}>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.message, 
            item.role === "user" ? styles.userMessage : styles.assistantMessage
          ]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    height: 300,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 10,
    marginVertical: 16,
  },
  message: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#6A5ACD",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#6A5ACD",
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChatBox;
