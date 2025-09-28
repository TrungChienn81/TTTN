import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSettings } from "../context/SettingsContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminOrderScreen = ({ navigation }) => {
  const { language, theme } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Lấy token và userId từ AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error(language === "vi" ? 'Yêu cầu đăng nhập admin' : 'Admin authentication required');
      }
      
      const response = await fetch(`http://10.0.2.2:3055/v1/api/order/all`, {
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
      
      let ordersList = [];
      if (Array.isArray(data)) {
        ordersList = data;
      } else if (data.data && Array.isArray(data.data)) {
        ordersList = data.data;
      } else if (data.metadata && Array.isArray(data.metadata)) {
        ordersList = data.metadata;
      }
      
      setOrders(ordersList);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error(language === "vi" ? 'Yêu cầu đăng nhập admin' : 'Admin authentication required');
      }
      
      const response = await fetch(`http://10.0.2.2:3055/v1/api/admin/order-status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-client-id': userId
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`${language === "vi" ? 'Không thể cập nhật trạng thái' : 'Failed to update status'}: ${response.status}`);
      }
      
      // Cập nhật lại danh sách đơn hàng
      fetchOrders();
      
      Alert.alert(
        language === "vi" ? "Thành công" : "Success",
        language === "vi" ? "Cập nhật trạng thái thành công" : "Status updated successfully"
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      Alert.alert(
        language === "vi" ? "Lỗi" : "Error",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị dialog chọn trạng thái
  const showStatusOptions = (order) => {
    Alert.alert(
      language === "vi" ? "Cập nhật trạng thái" : "Update Status",
      language === "vi" ? "Chọn trạng thái mới cho đơn hàng" : "Select a new status for the order",
      [
        {
          text: language === "vi" ? "Đang xử lý" : "Processing",
          onPress: () => updateOrderStatus(order._id, "processing")
        },
        {
          text: language === "vi" ? "Đang giao" : "Shipped",
          onPress: () => updateOrderStatus(order._id, "shipped")
        },
        {
          text: language === "vi" ? "Đã giao hàng" : "Delivered",
          onPress: () => updateOrderStatus(order._id, "delivered")
        },
        {
          text: language === "vi" ? "Hủy" : "Cancel",
          onPress: () => updateOrderStatus(order._id, "cancel")
        },
        {
          text: language === "vi" ? "Đóng" : "Close",
          style: "cancel"
        }
      ]
    );
  };

  // Hiển thị trạng thái đơn hàng
  const renderStatusBadge = (status) => {
    let badgeStyle, statusText;
    
    switch (status) {
      case 'pending':
        badgeStyle = styles.pendingBadge;
        statusText = language === "vi" ? "Chờ xác nhận" : "Pending";
        break;
      case 'processing':
        badgeStyle = styles.processingBadge;
        statusText = language === "vi" ? "Đang xử lý" : "Processing";
        break;
      case 'shipped':
        badgeStyle = styles.shippedBadge;
        statusText = language === "vi" ? "Đang giao" : "Shipping";
        break;
      case 'delivered':
        badgeStyle = styles.deliveredBadge;
        statusText = language === "vi" ? "Đã giao" : "Delivered";
        break;
      case 'cancel':
        badgeStyle = styles.cancelledBadge;
        statusText = language === "vi" ? "Đã hủy" : "Cancelled";
        break;
      case 'vnpay':
        badgeStyle = styles.vnpayBadge;
        statusText = "VNPAY";
        break;
      default:
        badgeStyle = styles.pendingBadge;
        statusText = status;
    }

    return (
      <View style={[styles.statusBadge, badgeStyle]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    );
  };

  if (loading && !orders.length) {
    return (
      <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A5ACD" />
          <Text style={[styles.loadingText, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Đang tải..." : "Loading..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color="#FF6B6B" />
          <Text style={[styles.errorText, theme === 'dark' && styles.darkText]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrders}
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
          {language === "vi" ? "Quản lý đơn hàng" : "Order Management"}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchOrders}
        >
          <Icon name="sync" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.orderItem, theme === 'dark' && styles.darkCardContainer]}
            onPress={() => showStatusOptions(item)}
          >
            <View style={styles.orderHeader}>
              <View>
                <Text style={[styles.orderIdLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Mã đơn hàng:" : "Order ID:"}
                </Text>
                <Text style={[styles.orderId, theme === 'dark' && styles.darkText]}>
                  {item._id}
                </Text>
              </View>
              {renderStatusBadge(item.status)}
            </View>
            
            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Khách hàng:" : "Customer:"}
                </Text>
                <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
                  {item.recipientName || (item.user && item.user.userName) || "---"}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Ngày đặt:" : "Order Date:"}
                </Text>
                <Text style={[styles.infoValue, theme === 'dark' && styles.darkText]}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Tổng tiền:" : "Total:"}
                </Text>
                <Text style={[styles.totalAmount, theme === 'dark' && styles.darkText]}>
                  {item.totalAmount?.toLocaleString() || "0"} đ
                </Text>
              </View>
            </View>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => showStatusOptions(item)}
              >
                <Icon name="edit" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {language === "vi" ? "Cập nhật trạng thái" : "Update Status"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate("OrderTracking", { orderId: item._id })}
              >
                <Icon name="eye" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {language === "vi" ? "Xem chi tiết" : "View Details"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  refreshButton: {
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
    textAlign: 'center',
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
  listContent: {
    padding: 15,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  darkCardContainer: {
    backgroundColor: '#1E1E1E',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#AAAAAA',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#666',
  },
  orderId: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  vnpayBadge: {
    backgroundColor: '#9C27B0',
  },
  orderInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  totalAmount: {
    fontSize: 14,
    color: '#6A5ACD',
    fontWeight: '700',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
  },
  updateButton: {
    backgroundColor: '#6A5ACD',
  },
  viewButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default AdminOrderScreen;
