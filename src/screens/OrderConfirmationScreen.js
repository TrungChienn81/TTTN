import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList
} from "react-native";
import { useSettings } from "../context/SettingsContext";
import Icon from "react-native-vector-icons/FontAwesome5";
import * as Animatable from 'react-native-animatable';

const OrderConfirmationScreen = ({ navigation, route }) => {
  const { orderDetails } = route.params;
  const { language, theme } = useSettings();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "cash":
        return language === "vi" ? "Thanh toán khi nhận hàng" : "Cash on Delivery";
      case "vnpay":
        return "VNPAY";
      case "card":
        return language === "vi" ? "Thẻ tín dụng/Ghi nợ" : "Credit/Debit Card";
      case "bank":
        return language === "vi" ? "Chuyển khoản ngân hàng" : "Bank Transfer";
      default:
        return language === "vi" ? "Không xác định" : "Not specified";
    }
  };

  // Kiểm tra và đảm bảo orderNumber tồn tại
  const handleTrackOrder = () => {
    if (!orderDetails.orderNumber) {
      console.log("Order number is missing");
      
      // Nếu có items, lấy đơn hàng gần nhất từ lịch sử
      if (orderDetails.items && orderDetails.items.length > 0) {
        Alert.alert(
          language === "vi" ? "Thông báo" : "Notification",
          language === "vi" 
            ? "Mã đơn hàng không tìm thấy. Bạn có muốn xem lịch sử đơn hàng?" 
            : "Order number not found. Do you want to view order history?",
          [
            {
              text: language === "vi" ? "Hủy" : "Cancel",
              style: "cancel"
            },
            {
              text: language === "vi" ? "Xem" : "View",
              onPress: () => navigation.navigate("OrderHistory")
            }
          ]
        );
      } else {
        alert(language === "vi" ? "Không tìm thấy mã đơn hàng" : "Order number not found");
      }
      return;
    }
  
    console.log("Navigating to order tracking with ID:", orderDetails.orderNumber);
    navigation.navigate("OrderTracking", {
      orderId: orderDetails.orderNumber
    });
  };
  

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <ScrollView>
        <Animatable.View 
          style={styles.header}
          animation="fadeIn"
          duration={1000}
        >
          <Animatable.View 
            style={styles.successIcon}
            animation="bounceIn"
            delay={500}
            duration={1500}
          >
            <Icon name="check-circle" size={80} color="#4CAF50" />
          </Animatable.View>
          <Text style={[styles.headerTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Đặt hàng thành công!" : "Order Successful!"}
          </Text>
          <Text style={[styles.headerSubtitle, theme === 'dark' && styles.darkSubText]}>
            {language === "vi"
              ? "Cảm ơn bạn đã mua sắm cùng chúng tôi"
              : "Thank you for shopping with us"}
          </Text>
        </Animatable.View>

        <View style={[styles.orderInfoContainer, theme === 'dark' && styles.darkCardContainer]}>
          <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Thông tin đơn hàng" : "Order Information"}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Mã đơn hàng" : "Order Number"}:
            </Text>
            <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
              {orderDetails.orderNumber}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Ngày đặt hàng" : "Order Date"}:
            </Text>
            <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
              {formatDate(orderDetails.orderDate)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Phương thức thanh toán" : "Payment Method"}:
            </Text>
            <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
              {getPaymentMethodText(orderDetails.paymentMethod)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Tổng thanh toán" : "Total Amount"}:
            </Text>
            <Text style={[styles.totalValue, theme === 'dark' && styles.darkText]}>
              {orderDetails.totalAmount.toLocaleString()} đ
            </Text>
          </View>
        </View>

        <View style={[styles.deliveryInfoContainer, theme === 'dark' && styles.darkCardContainer]}>
          <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Thông tin giao hàng" : "Delivery Information"}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Người nhận" : "Recipient"}:
            </Text>
            <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
              {orderDetails.fullName}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Số điện thoại" : "Phone"}:
            </Text>
            <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
              {orderDetails.phone}
            </Text>
          </View>
          
          {orderDetails.email && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
                Email:
              </Text>
              <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
                {orderDetails.email}
              </Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Địa chỉ" : "Address"}:
            </Text>
            <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
              {orderDetails.address}
            </Text>
          </View>
          
          {orderDetails.city && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Thành phố" : "City"}:
              </Text>
              <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
                {orderDetails.city}
              </Text>
            </View>
          )}
          
          {orderDetails.note && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Ghi chú" : "Notes"}:
              </Text>
              <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
                {orderDetails.note}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.orderItemsContainer, theme === 'dark' && styles.darkCardContainer]}>
          <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Sản phẩm đã đặt" : "Ordered Items"}
          </Text>
          
          <FlatList
            data={orderDetails.items}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={[styles.orderItem, theme === 'dark' && styles.darkOrderItem]}>
                <View style={styles.orderItemDetails}>
                  <Text style={[styles.orderItemTitle, theme === 'dark' && styles.darkText]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.orderItemSubInfo, theme === 'dark' && styles.darkSubText]}>
                    {language === "vi" ? "Màu: " : "Color: "}{item.color || "N/A"} | {language === "vi" ? "Size: " : "Size: "}{item.size || "M"}
                  </Text>
                </View>
                <View style={styles.orderItemPricing}>
                  <Text style={[styles.orderItemQuantity, theme === 'dark' && styles.darkSubText]}>
                    x{item.quantity}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    {(item.price * item.quantity).toLocaleString()} đ
                  </Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.trackOrderButton}
          onPress={handleTrackOrder}
        >
          <Text style={styles.trackOrderButtonText}>
            {language === "vi" ? "Theo dõi đơn hàng" : "Track Order"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.continueShopping}
          onPress={() => navigation.navigate("HomeStack", { screen: "HomeScreen" })}
        >
          <Text style={styles.continueShoppingText}>
            {language === "vi" ? "Tiếp tục mua sắm" : "Continue Shopping"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSubText: {
    color: "#AAAAAA",
  },
  orderInfoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  darkCardContainer: {
    backgroundColor: "#2A2A2A",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666666",
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
    flex: 2,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6A5ACD",
    flex: 2,
    textAlign: "right",
  },
  deliveryInfoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderItemsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  darkOrderItem: {
    borderBottomColor: "#444444",
  },
  orderItemDetails: {
    flex: 2,
    paddingRight: 10,
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  orderItemSubInfo: {
    fontSize: 14,
    color: "#777777",
  },
  orderItemPricing: {
    flex: 1,
    alignItems: "flex-end",
  },
  orderItemQuantity: {
    fontSize: 14,
    color: "#777777",
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6A5ACD",
  },
  buttonsContainer: {
    padding: 20,
  },
  trackOrderButton: {
    backgroundColor: "#6A5ACD",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#6A5ACD",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  trackOrderButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  continueShopping: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6A5ACD",
  },
  continueShoppingText: {
    color: "#6A5ACD",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default OrderConfirmationScreen;
