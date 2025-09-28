import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSettings } from "../context/SettingsContext";

const HomeScreen = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const { language, theme } = useSettings();
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false); // State để kiểm soát hiển thị chatbox

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy sản phẩm nổi bật
        const response = await fetch(
          "http://10.0.2.2:3055/v1/api/product-top-rate"
        );
        const data = await response.json();
        if (data.status === 200 && Array.isArray(data.data)) {
          setTopRatedProducts(data.data);
        } else {
          setTopRatedProducts([]);
        }
      } catch (err) {
        console.error("Lỗi fetch API:", err);
        setTopRatedProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      navigation.navigate("Search", { query });
    }
  };

  // Hàm để mở/đóng chatbox
  const toggleChat = () => {
    setChatVisible(!chatVisible);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, theme === 'dark' && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </View>
    );
  }

  // Header component chứa tất cả nội dung trước đây trong ScrollView
  const HeaderComponent = () => (
    <>
      <Text style={[styles.title, theme === 'dark' && styles.darkText]}>
        {language === "vi" ? "Chào mừng đến với cửa hàng của Nhóm 15" : "Welcome to the store"}
      </Text>
      
      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, theme === 'dark' && styles.darkInput]}
          placeholder={language === "vi" ? "Tìm kiếm sản phẩm..." : "Search products..."}
          placeholderTextColor={theme === 'dark' ? '#999' : '#999'}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <TouchableOpacity 
          style={styles.categoryButton}
          onPress={() => navigation.navigate("Pants")}
        >
          <View style={styles.categoryIcon}>
          <Image
              source={require('../assets/icons/pants_icon.png')}
              style={styles.iconImage}
            />
          </View>
          <Text style={[styles.categoryText, theme === "dark" && styles.darkText]}>
            {language === "vi" ? "Quần" : "Pants"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.categoryButton}
          onPress={() => navigation.navigate("Shirts")}
        >
          <View style={styles.categoryIcon}>
          <Image
              source={require('../assets/icons/shirts_icon.png')}
              style={styles.iconImage}
            />
          </View>
          <Text style={[styles.categoryText, theme === "dark" && styles.darkText]}>
            {language === "vi" ? "Áo" : "Shirts"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.categoryButton}
          onPress={() => navigation.navigate("ShoesScreen")}
        >
          <View style={styles.categoryIcon}>
          <Image
              source={require('../assets/icons/shoes_icon.png')}
              style={styles.iconImage}
            />
          </View>
          <Text style={[styles.categoryText, theme === "dark" && styles.darkText]}>
            {language === "vi" ? "Giày" : "Shoes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.categoryButton}
          onPress={() => navigation.navigate("BagsScreen")}
        >
          <View style={styles.categoryIcon}>
          <Image
              source={require('../assets/icons/bag_icon.png')}
              style={styles.iconImage}
            />
          </View>
          <Text style={[styles.categoryText, theme === "dark" && styles.darkText]}>
            {language === "vi" ? "Túi" : "Bags"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nút váy */}
      <View style={styles.dressButtonContainer}>
        <TouchableOpacity 
          style={styles.categoryButton}
          onPress={() => navigation.navigate("DressScreen")}
        >
          <View style={styles.categoryIcon}>
            <Image
              source={require('../assets/icons/dress_icon.png')}
              style={styles.iconImage}
            />
          </View>
          <Text style={[styles.categoryText, theme === "dark" && styles.darkText]}>
            {language === "vi" ? "Váy" : "Dress"}
          </Text>
        </TouchableOpacity>
      </View>

      
      {/* Nút lịch sử đơn hàng */}
      <TouchableOpacity 
        style={styles.historyButton}
        onPress={() => navigation.navigate("OrderHistory")}
      >
        <Icon name="history" size={24} color="#FFFFFF" />
        <Text style={styles.historyButtonText}>
          {language === "vi" ? "Lịch sử đơn hàng" : "Order History"}
        </Text>
      </TouchableOpacity>

      {/* Sản phẩm nổi bật */}
      <View style={styles.productSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Icon name="star" size={24} color="#FFC107" />
            <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
              {language === "vi" ? " Sản phẩm nổi bật" : " Top Rated Products"}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate("TopRated")}
          >
            <Text style={styles.viewAllText}>
              {language === "vi" ? "Xem tất cả" : "View all"}
            </Text>
            <Icon name="chevron-right" size={16} color="#6A5ACD" />
          </TouchableOpacity>
        </View>

        <View style={styles.productList}>
          {topRatedProducts.slice(0, 3).map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.productItem}
              onPress={() => navigation.navigate("ProductDetail", { product: item })}
            >
              <Text style={[styles.productName, theme === 'dark' && styles.darkText]}>
                {item.title}
              </Text>
              <Text style={styles.productPrice}>
                {item.price?.toLocaleString()} đ
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  // Component custom cho ChatBox đặt trong modal
  const ChatBoxModal = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const sendMessage = async () => {
      if (!input.trim()) return;
      // Thêm tin nhắn người dùng vào danh sách
      const userMessage = { role: "user", content: input };
      setMessages(prev => [...prev, userMessage]);
      try {
        // Gọi API từ server backend của bạn
        const response = await fetch(
          "http://10.0.2.2:3055/v1/api/chatbot/query",
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: input }),
          }
        );
        const data = await response.json();
        const assistantReply = data.answer;
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.chatContainer}
      >
        {/* Phần hiển thị tin nhắn */}
        <FlatList
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View 
              style={[
                styles.message,
                item.role === "user" ? styles.userMessage : styles.assistantMessage
              ]}
            >
              <Text 
                style={
                  item.role === "user" 
                    ? styles.userMessageText 
                    : styles.assistantMessageText
                }
              >
                {item.content}
              </Text>
            </View>
          )}
          style={styles.messageList}
        />

        {/* Phần nhập tin nhắn (fixed ở cuối) */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={language === "vi" ? "Nhập tin nhắn..." : "Type a message..."}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={HeaderComponent}
        keyExtractor={item => item.key}
      />
      
      {/* Nút nhỏ hỗ trợ trực tuyến */}
      <TouchableOpacity style={styles.floatingButton} onPress={toggleChat}>
        <Icon name="chat" size={30} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Modal hiển thị ChatBox khi nút được nhấn */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === "vi" ? "Hỗ trợ trực tuyến" : "Online Support"}
              </Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ChatBoxModal />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 16,
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  darkText: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 23,
    paddingHorizontal: 20,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkInput: {
    backgroundColor: "#2A2A2A",
    color: "#fff",
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#6A5ACD",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  categoryButton: {
    alignItems: "center",
    width: "22%",
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6A5ACD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconImage: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  dressButtonContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  productSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#6A5ACD",
    marginRight: 4,
  },
  productList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6A5ACD",
  },
  // Style cho nút hỗ trợ trực tuyến dạng nổi
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6A5ACD',
    bottom: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
  // Style cho modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%', // Tăng chiều cao modal
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Style cho phần chat
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  message: {
    padding: 10,
    borderRadius: 20,
    marginVertical: 6,
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
  userMessageText: {
    fontSize: 16,
    color: "#fff",
  },
  assistantMessageText: {
    fontSize: 16,
    color: "#333",
  },
  // Style cho phần nhập tin nhắn (ở dưới cùng)
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Thêm padding cho iOS
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#6A5ACD",
    borderRadius: 25,
    width: 50,
    height: 50,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Thêm styles cho nút lịch sử đơn hàng
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A5ACD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 15,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;
