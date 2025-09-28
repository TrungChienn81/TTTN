import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSettings } from "../context/SettingsContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const HistoryOrderScreen = ({ navigation }) => {
  const { language, theme } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Kiểm tra trạng thái đăng nhập
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      setIsLoggedIn(!!token && !!userId);
      return !!token && !!userId;
    } catch (err) {
      console.error('Error checking login status:', err);
      setIsLoggedIn(false);
      return false;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
 
      const loggedIn = await checkLoginStatus();
      if (!loggedIn) {
      
        const cachedOrders = await AsyncStorage.getItem('cachedOrdersData');
        if (cachedOrders) {
          setOrders(JSON.parse(cachedOrders));
          setError(language === "vi" 
            ? "Hiển thị dữ liệu đã lưu. Vui lòng đăng nhập để cập nhật." 
            : "Showing cached data. Please login to update.");
          setLoading(false);
          return;
        }
        
        setOrders([]);
        setError(language === "vi" ? 'Vui lòng đăng nhập để xem lịch sử đơn hàng' : 'Please login to view order history');
        setLoading(false);
        return;
      }
      
  
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      console.log("Making API request with token and userId");
      
      const response = await fetch(`http://10.0.2.2:3055/v1/api/order`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
          'x-client-id': userId
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Không xóa token, kiểm tra cache
          const cachedOrders = await AsyncStorage.getItem('cachedOrdersData');
          if (cachedOrders) {
            setOrders(JSON.parse(cachedOrders));
            setError(language === "vi" 
              ? "Phiên đăng nhập hết hạn. Hiển thị dữ liệu đã lưu." 
              : "Session expired. Showing cached data.");
            setLoading(false);
            return;
          }
          
          setIsLoggedIn(false);
          throw new Error(language === "vi" ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' : 'Session expired, please login again');
        }
        
        throw new Error(`${language === "vi" ? 'Không thể tải lịch sử đơn hàng' : 'Failed to fetch order history'}: ${response.status}`);
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
      
      // Lưu dữ liệu vào cache để sử dụng khi offline
      await AsyncStorage.setItem('cachedOrdersData', JSON.stringify(ordersList));
      
      setOrders(ordersList);
      setError(null);
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Gọi lại API khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Lịch sử đơn hàng" : "Order History"}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A5ACD" />
          <Text style={[styles.loadingText, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Đang tải lịch sử đơn hàng..." : "Loading order history..."}
          </Text>
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
          {language === "vi" ? "Lịch sử đơn hàng" : "Order History"}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchOrders}
        >
          <Icon name="sync" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
      
      {!isLoggedIn ? (
        <View style={styles.emptyContainer}>
          <Icon name="user-lock" size={60} color="#CCCCCC" />
          <Text style={[styles.emptyText, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Bạn cần đăng nhập để xem lịch sử đơn hàng" : "You need to login to view order history"}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>
              {language === "vi" ? "Đăng nhập" : "Login"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
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
          
          {/* Nút đăng nhập lại nếu lỗi phiên hết hạn */}
          {(error.includes('đăng nhập') || error.includes('login')) && !error.includes('Hiển thị dữ liệu đã lưu') ? (
            <TouchableOpacity
              style={[styles.loginButton, { marginTop: 10 }]}
              onPress={() => {
                AsyncStorage.removeItem('accessToken').then(() =>
                  navigation.navigate('Login')
                );
              }}
            >
              <Text style={styles.loginButtonText}>
                {language === "vi" ? "Đăng nhập lại" : "Login Again"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-bag" size={60} color="#CCCCCC" />
          <Text style={[styles.emptyText, theme === 'dark' && styles.darkText]}>
            {language === "vi" ? "Bạn chưa có đơn hàng nào" : "You haven't placed any orders yet"}
          </Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate("HomeStack")}
          >
            <Text style={styles.shopNowButtonText}>
              {language === "vi" ? "Mua sắm ngay" : "Shop Now"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.orderItem, theme === 'dark' && styles.darkCardContainer]}
              onPress={() => navigation.navigate('Main', {
                screen: 'CartStack',
                params: {
                  screen: 'OrderTracking',
                  params: { orderId: item._id }
                }
              })}
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
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6A5ACD']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  placeholder: {
    width: 40,
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
  loginButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  shopNowButton: {
    marginTop: 20,
    backgroundColor: '#6A5ACD',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  shopNowButtonText: {
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
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  totalAmount: {
    fontSize: 15,
    color: '#6A5ACD',
    fontWeight: '700',
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A5ACD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default HistoryOrderScreen;
