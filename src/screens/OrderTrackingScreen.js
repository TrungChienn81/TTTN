import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSettings } from "../context/SettingsContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const { language, theme } = useSettings();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError(language === "vi" ? "Không có mã đơn hàng" : "Order ID is missing");
      setLoading(false);
      return;
    }

    fetchOrderDetails();
    // Tự động cập nhật trạng thái mỗi 60 giây
    const intervalId = setInterval(fetchOrderDetails, 60000);
    return () => clearInterval(intervalId);
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      if (!orderId) {
        throw new Error(language === "vi" ? "Không có mã đơn hàng" : "Order ID is missing");
      }

      setLoading(true);
   
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error(language === "vi" ? 'Yêu cầu đăng nhập' : 'Authentication required');
      }

      console.log("Fetching orders for user");
      console.log("Looking for order ID:", orderId);
      
     
      const response = await fetch(`http://10.0.2.2:3055/v1/api/order`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-client-id': userId
        }
      });

      if (!response.ok) {
        throw new Error(`${language === "vi" ? 'Không thể tải thông tin đơn hàng' : 'Failed to fetch orders'}: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response data type:", typeof data, "Is array:", Array.isArray(data));
      
      let orders = [];
      // Kiểm tra cấu trúc dữ liệu phản hồi
      if (Array.isArray(data)) {
        orders = data;
      } else if (data.data && Array.isArray(data.data)) {
        orders = data.data;
      } else if (data.metadata && Array.isArray(data.metadata)) {
        orders = data.metadata;
      } else {
        // Nếu API trả về dạng khác, thử các cấu trúc phổ biến
        const possibleArrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (possibleArrayProps.length > 0) {
          orders = data[possibleArrayProps[0]];
          console.log("Found orders array in property:", possibleArrayProps[0]);
        } else {
          console.log("Unexpected data format:", JSON.stringify(data).substring(0, 200) + "...");
          throw new Error(language === "vi" ? 'Định dạng dữ liệu không hợp lệ' : 'Invalid data format');
        }
      }

      console.log("Order IDs in response:", orders.map(o => o._id));
      
      // Làm sạch orderId để đảm bảo không có khoảng trắng
      const cleanOrderId = orderId.trim();
      
      // Tìm đơn hàng với nhiều phương pháp khác nhau
      let foundOrder = null;
      
      // Phương pháp 1: So sánh trực tiếp với _id
      foundOrder = orders.find(order => order._id === cleanOrderId);
      
      // Phương pháp 2: So sánh không phân biệt hoa thường
      if (!foundOrder) {
        foundOrder = orders.find(order => 
          order._id.toLowerCase() === cleanOrderId.toLowerCase()
        );
      }
      
      // Phương pháp 3: Kiểm tra các trường khác có thể chứa ID
      if (!foundOrder) {
        foundOrder = orders.find(order => {
          const orderNumber = order.orderNumber || order.vnpTxnRef;
          return orderNumber && orderNumber === cleanOrderId;
        });
      }
      
      // Phương pháp 4: Nếu vẫn không tìm thấy, kiểm tra ID là một phần của _id
      if (!foundOrder) {
        foundOrder = orders.find(order => order._id.includes(cleanOrderId));
      }
      
      // Nếu không tìm thấy, sử dụng đơn hàng mới nhất
      if (!foundOrder && orders.length > 0) {
        console.log("Order not found, using the most recent order instead");
        // Sắp xếp theo thời gian và lấy đơn hàng mới nhất
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        foundOrder = orders[0];
      }

      if (!foundOrder) {
        throw new Error(language === "vi" ? 'Không tìm thấy đơn hàng' : 'Order not found');
      }

      console.log("Found order:", foundOrder._id);
      setOrderDetails(foundOrder);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xác định số bước dựa trên trạng thái
  const getStepNumber = (status) => {
    switch(status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancel': return 0; // Trường hợp đặc biệt cho đơn bị hủy
      case 'cancelled': return 0; // Phòng trường hợp tên trạng thái khác nhau
      default: return 1;
    }
  };

  // Hiển thị timeline theo dõi đơn hàng
  const renderTrackingTimeline = () => {
    if (!orderDetails || orderDetails.status === 'cancel' || orderDetails.status === 'cancelled') {
      return null;
    }

    const steps = [
      { id: 1, title: language === "vi" ? "Đã đặt hàng" : "Order Placed" },
      { id: 2, title: language === "vi" ? "Đang xử lý" : "Processing" },
      { id: 3, title: language === "vi" ? "Đang giao" : "Shipping" },
      { id: 4, title: language === "vi" ? "Đã giao hàng" : "Delivered" }
    ];

    const currentStep = getStepNumber(orderDetails.status);

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step) => (
          <View key={step.id} style={styles.timelineStep}>
            <View style={[
              styles.stepCircle,
              step.id <= currentStep ? styles.completedStepCircle : styles.pendingStepCircle
            ]}>
              {step.id < currentStep ? (
                <Icon name="check" size={14} color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.stepText,
                  step.id <= currentStep ? styles.completedStepText : styles.pendingStepText
                ]}>
                  {step.id}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepTitle,
              step.id <= currentStep ? styles.completedStepTitle : styles.pendingStepTitle
            ]}>
              {step.title}
            </Text>
            {step.id < steps.length && (
              <View style={[
                styles.stepLine,
                step.id < currentStep ? styles.completedStepLine : styles.pendingStepLine
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  if (loading && !orderDetails) {
    return (
      <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A5ACD" />
          <Text style={[styles.loadingText, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Đang tải thông tin đơn hàng..." : "Loading order information..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Chi tiết đơn hàng" : "Order Details"}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color="#FF6B6B" />
          <Text style={[styles.errorText, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Không thể tải thông tin đơn hàng" : "Unable to load order information"}
          </Text>
          <Text style={[styles.errorSubText, theme === 'dark' && styles.darkSubText]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrderDetails}
          >
            <Text style={styles.retryButtonText}>
              {language === "vi" ? "Thử lại" : "Retry"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, theme === 'dark' && styles.darkText]}>
          {language === "vi" ? "Chi tiết đơn hàng" : "Order Tracking"}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Thông tin đơn hàng */}
        <View style={[styles.orderHeader, theme === 'dark' && styles.darkCardContainer]}>
          <View style={styles.orderIdContainer}>
            <View>
              <Text style={[styles.orderIdLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Mã đơn hàng:" : "Order ID:"}
              </Text>
              <View style={styles.orderIdRow}>
                <Text style={[styles.orderId, theme === 'dark' && styles.darkText]}>
                  {orderDetails?._id || orderId || "---"}
                </Text>
                {orderDetails?.paymentMethod === 'vnpay' && (
                  <View style={styles.vnpayBadge}>
                    <Text style={styles.vnpayText}>VNPAY</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.statusBadge,
              orderDetails?.status === 'pending' && styles.pendingBadge,
              orderDetails?.status === 'processing' && styles.processingBadge,
              orderDetails?.status === 'shipped' && styles.shippedBadge,
              orderDetails?.status === 'delivered' && styles.deliveredBadge,
              (orderDetails?.status === 'cancel' || orderDetails?.status === 'cancelled') && styles.cancelledBadge
            ]}>
              {orderDetails?.status === 'pending' && (language === "vi" ? "Chờ xác nhận" : "Pending")}
              {orderDetails?.status === 'processing' && (language === "vi" ? "Đang xử lý" : "Processing")}
              {orderDetails?.status === 'shipped' && (language === "vi" ? "Đang giao" : "Shipping")}
              {orderDetails?.status === 'delivered' && (language === "vi" ? "Đã giao" : "Delivered")}
              {(orderDetails?.status === 'cancel' || orderDetails?.status === 'cancelled') && (language === "vi" ? "Đã hủy" : "Cancelled")}
            </Text>
          </View>
        </View>
        
        {/* Timeline theo dõi đơn hàng */}
        <View style={[styles.trackingSection, theme === 'dark' && styles.darkCardContainer]}>
          <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Theo dõi đơn hàng" : "Order Tracking"}
          </Text>
          
          {(orderDetails?.status === 'cancel' || orderDetails?.status === 'cancelled') ? (
            <View style={styles.cancelledContainer}>
              <Icon name="times-circle" size={50} color="#E53935" />
              <Text style={styles.cancelledText}>
                {language === "vi" ? "Đơn hàng đã bị hủy" : "Order has been cancelled"}
              </Text>
              <Text style={styles.cancelledSubText}>
                {language === "vi" 
                  ? "Vui lòng liên hệ với chúng tôi nếu có thắc mắc." 
                  : "Please contact us if you have any questions."}
              </Text>
            </View>
          ) : (
            renderTrackingTimeline()
          )}
          
          <View style={styles.deliveryInfoContainer}>
            <View style={styles.deliveryInfoRow}>
              <Text style={[styles.deliveryInfoLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Ngày đặt hàng:" : "Order Date:"}
              </Text>
              <Text style={[styles.deliveryInfoValue, theme === 'dark' && styles.darkText]}>
                {orderDetails?.createdAt
                  ? new Date(orderDetails.createdAt).toLocaleString()
                  : "---"}
              </Text>
            </View>
            
            <View style={styles.deliveryInfoRow}>
              <Text style={[styles.deliveryInfoLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Dự kiến giao hàng:" : "Estimated Delivery:"}
              </Text>
              <Text style={[styles.deliveryInfoValue, theme === 'dark' && styles.darkText]}>
                {new Date(Date.now() + 3*24*60*60*1000).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Thông tin sản phẩm đã đặt */}
        <View style={[styles.itemsSection, theme === 'dark' && styles.darkCardContainer]}>
          <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Sản phẩm đã đặt" : "Order Items"}
          </Text>
          
          {orderDetails?.cart?.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.itemRow, 
                index < orderDetails.cart.length - 1 && styles.itemBorder,
                theme === 'dark' && { borderBottomColor: '#333' }
              ]}
            >
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, theme === 'dark' && styles.darkText]}>
                  {item.product.title || "Product"}
                </Text>
                <Text style={[styles.itemVariant, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Kích thước:" : "Size:"} {item.size || "M"}
                </Text>
                <Text style={[styles.itemPrice, theme === 'dark' && styles.darkSubText]}>
                  {(item.product.price || 0).toLocaleString()} đ x {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemTotal, theme === 'dark' && styles.darkText]}>
                {((item.product.price || 0) * item.quantity).toLocaleString()} đ
              </Text>
            </View>
          ))}
          
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Tổng tiền hàng:" : "Subtotal:"}
              </Text>
              <Text style={[styles.totalValue, theme === 'dark' && styles.darkText]}>
                {orderDetails?.totalAmount?.toLocaleString() || "0"} đ
              </Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, theme === 'dark' && styles.darkSubText]}>
                {language === "vi" ? "Phí vận chuyển:" : "Shipping:"}
              </Text>
              <Text style={[styles.totalValue, theme === 'dark' && styles.darkText]}>
                {language === "vi" ? "Miễn phí" : "Free"}
              </Text>
            </View>
            
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={[styles.grandTotalLabel, theme === 'dark' && styles.darkText]}>
                {language === "vi" ? "Tổng thanh toán:" : "Total:"}
              </Text>
              <Text style={[styles.grandTotalValue, theme === 'dark' && styles.darkText]}>
                {orderDetails?.totalAmount?.toLocaleString() || "0"} đ
              </Text>
            </View>
          </View>
        </View>
        
        {/* Thông tin giao hàng */}
        <View style={[styles.deliverySection, theme === 'dark' && styles.darkCardContainer]}>
          <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Thông tin giao hàng" : "Delivery Information"}
          </Text>
          
          <View style={styles.deliveryDetailRow}>
            <Text style={[styles.deliveryDetailLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Người nhận:" : "Recipient:"}
            </Text>
            <Text style={[styles.deliveryDetailValue, theme === 'dark' && styles.darkText]}>
              {orderDetails?.recipientName || "---"}
            </Text>
          </View>
          
          <View style={styles.deliveryDetailRow}>
            <Text style={[styles.deliveryDetailLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Số điện thoại:" : "Phone:"}
            </Text>
            <Text style={[styles.deliveryDetailValue, theme === 'dark' && styles.darkText]}>
              {orderDetails?.phone || "---"}
            </Text>
          </View>
          
          <View style={styles.deliveryDetailRow}>
            <Text style={[styles.deliveryDetailLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Địa chỉ:" : "Address:"}
            </Text>
            <Text style={[styles.deliveryDetailValue, theme === 'dark' && styles.darkText]}>
              {orderDetails?.address || "---"}
            </Text>
          </View>
          
          <View style={styles.deliveryDetailRow}>
            <Text style={[styles.deliveryDetailLabel, theme === 'dark' && styles.darkSubText]}>
              {language === "vi" ? "Phương thức thanh toán:" : "Payment Method:"}
            </Text>
            <Text style={[styles.deliveryDetailValue, theme === 'dark' && styles.darkText]}>
              {orderDetails?.paymentMethod === 'cash'
                ? (language === "vi" ? "Thanh toán khi nhận hàng" : "Cash on Delivery")
                : (orderDetails?.paymentMethod === 'vnpay' 
                    ? "VNPAY" 
                    : (orderDetails?.paymentMethod || "---"))}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#6A5ACD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#AAAAAA',
  },
  darkCardContainer: {
    backgroundColor: '#1E1E1E',
  },
  orderHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vnpayBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  vnpayText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#6A5ACD',
  },
  pendingBadge: {
    backgroundColor: '#F9A825',
  },
  processingBadge: {
    backgroundColor: '#29B6F6',
  },
  shippedBadge: {
    backgroundColor: '#66BB6A',
  },
  deliveredBadge: {
    backgroundColor: '#43A047',
  },
  cancelledBadge: {
    backgroundColor: '#E53935',
  },
  trackingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timelineStep: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    zIndex: 5,
  },
  completedStepCircle: {
    backgroundColor: '#6A5ACD',
  },
  pendingStepCircle: {
    backgroundColor: '#E0E0E0',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedStepText: {
    color: '#FFFFFF',
  },
  pendingStepText: {
    color: '#666666',
  },
  stepTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  completedStepTitle: {
    color: '#6A5ACD',
    fontWeight: '600',
  },
  pendingStepTitle: {
    color: '#999999',
  },
  stepLine: {
    position: 'absolute',
    top: 15,
    right: '50%',
    left: '50%',
    height: 3,
    zIndex: 1,
  },
  completedStepLine: {
    backgroundColor: '#6A5ACD',
  },
  pendingStepLine: {
    backgroundColor: '#E0E0E0',
  },
  itemsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: '#666',
  },
  itemTotal: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
  },
  totalContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
  },
  grandTotalRow: {
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A5ACD',
  },
  deliverySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryDetailRow: {
    marginBottom: 10,
  },
  deliveryDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  deliveryDetailValue: {
    fontSize: 15,
    color: '#333',
  },
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
    marginTop: 10,
  },
  cancelledSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  deliveryInfoContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deliveryInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  deliveryInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default OrderTrackingScreen;
