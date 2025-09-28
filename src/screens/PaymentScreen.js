import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking
} from "react-native";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import Icon from "react-native-vector-icons/FontAwesome5";
import { WebView } from 'react-native-webview';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hàm phân tích query params từ URL
const parseQueryParams = (url) => {
  try {
    const queryString = url.split('?')[1];
    if (!queryString) return {};

    const params = {};
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value || '');
    });

    return params;
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
    return {};
  }
};

// Hàm giải mã base64 (cho JWT token)
const base64Decode = (str) => {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(
          atob(str.replace(/-/g, '+').replace(/_/g, '/')),
          c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join('')
    );
  } catch (e) {
    console.error("Error decoding base64:", e);
    return "";
  }
};

// Hàm phân tích JWT token để lấy userId
const parseJwt = (token) => {
  try {
    if (!token) return null;
    // Loại bỏ prefix "Bearer " nếu có
    const jwt = token.startsWith('Bearer ') ? token.substring(7) : token;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64Decode(parts[1]));
    return payload;
  } catch (e) {
    console.error("Error parsing JWT:", e);
    return null;
  }
};

// Component WebView để hiển thị trang thanh toán
const PaymentWebView = ({ paymentUrl, onNavigationStateChange, onClose, language }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <SafeAreaView style={styles.webViewContainer}>
      <View style={styles.webViewHeader}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="times" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.webViewHeaderTitle}>
          {language === "vi" ? "Thanh toán VNPAY" : "VNPAY Payment"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <WebView
        source={{ uri: paymentUrl }}
        style={styles.webView}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A5ACD" />
        </View>
      )}
    </SafeAreaView>
  );
};

const PaymentScreen = ({ navigation, route }) => {
  const { cartItems, clearCart } = useCart();
  const { language, theme } = useSettings();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [directPaymentMode, setDirectPaymentMode] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Lấy token và userId từ AsyncStorage hoặc context khi component mount
  useEffect(() => {
    const getAuthInfo = async () => {
      try {
        console.log("Loading authentication info...");
        // Lấy token từ context hoặc AsyncStorage
        let tokenToUse = token;
        if (!tokenToUse) {
          const storedToken = await AsyncStorage.getItem('accessToken');
          if (storedToken) {
            tokenToUse = storedToken.trim().replace(/^["'](.*)["']$/, '$1');
            console.log("Using token from storage");
          }
        } else {
          console.log("Using token from context");
          await AsyncStorage.setItem('accessToken', token);
        }

        setAccessToken(tokenToUse);

        // Lấy userId từ context hoặc AsyncStorage
        let userIdToUse = user && (user._id || user.userId);
        if (!userIdToUse) {
          // Thử lấy từ AsyncStorage
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            userIdToUse = storedUserId;
            console.log("Using userId from storage:", userIdToUse);
          } else if (tokenToUse) {
            // Phân tích token để lấy userId
            const tokenData = parseJwt(tokenToUse);
            if (tokenData && (tokenData.userId || tokenData._id)) {
              userIdToUse = tokenData.userId || tokenData._id;
              console.log("Extracted userId from token:", userIdToUse);
              // Lưu userId vào AsyncStorage để sử dụng sau này
              await AsyncStorage.setItem('userId', userIdToUse);
            }
          }
        } else {
          console.log("Using userId from context:", userIdToUse);
          await AsyncStorage.setItem('userId', userIdToUse);
        }

        setUserId(userIdToUse);
        setAuthLoaded(true);
      } catch (error) {
        console.error("Error fetching auth info:", error);
        setAuthLoaded(true);
      }
    };

    getAuthInfo();
  }, [token, user]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: ""
  });

  // Cấu hình VNPAY
  const VNP_TMNCODE = 'MHANHND2';
  const VNP_HASHSECRET = 'HUSXH1330A8TUE57O1UAS2Q5KBJYL1GD';
  const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const VNP_RETURN_URL = 'http://localhost:5173/vnpay_return';

  // Tính tổng tiền
  const totalAmount = route.params?.totalAmount ||
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Lấy danh sách sản phẩm
  const orderItems = route.params?.cartItems || cartItems;

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert(
        language === "vi" ? "Lỗi" : "Error",
        language === "vi" ? "Vui lòng nhập họ tên" : "Please enter your full name"
      );
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert(
        language === "vi" ? "Lỗi" : "Error",
        language === "vi" ? "Vui lòng nhập số điện thoại" : "Please enter your phone number"
      );
      return false;
    }

    if (!formData.address.trim()) {
      Alert.alert(
        language === "vi" ? "Lỗi" : "Error",
        language === "vi" ? "Vui lòng nhập địa chỉ" : "Please enter your address"
      );
      return false;
    }

    return true;
  };

  // Hàm sắp xếp tham số VNPAY
  const sortObject = (obj) => {
    let sorted = {};
    let str = [];

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }

    str.sort();

    for (let key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }

    return sorted;
  };

  // Tạo URL thanh toán trực tiếp
  const createDirectPaymentUrl = () => {
    const amount = Math.round(totalAmount * 100);
    const date = new Date();
    const createDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;

    // Tạo định dạng tương tự MongoDB ObjectId
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
    const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
    const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
    const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
    const orderId = timestamp + machineId + processId + counter;

    let vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNP_TMNCODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount,
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_IpAddr: "127.0.0.1",
      vnp_CreateDate: createDate
    };

    vnpParams = sortObject(vnpParams);

    let queryString = "";
    let i = 0;

    for (const key in vnpParams) {
      if (i === 0) {
        queryString = `${key}=${vnpParams[key]}`;
      } else {
        queryString += `&${key}=${vnpParams[key]}`;
      }

      i++;
    }

    let hmac = CryptoJS.HmacSHA512(queryString, VNP_HASHSECRET);
    let secureHash = hmac.toString(CryptoJS.enc.Hex);

    return `${VNP_URL}?${queryString}&vnp_SecureHash=${secureHash}`;
  };

  // Hàm tự động refresh token
  const refreshToken = async () => {
    try {
      const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
      if (!refreshTokenValue) return false;

      console.log("Attempting to refresh token...");

      const response = await fetch("http://10.0.2.2:3055/v1/api/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refreshToken: refreshTokenValue,
          userId: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          await AsyncStorage.setItem('accessToken', data.accessToken);
          setAccessToken(data.accessToken);
          console.log("Token refreshed successfully");
          return true;
        }
      }

      console.log("Failed to refresh token");
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  // Tạo đơn hàng trong hệ thống sau khi thanh toán
  const createOrderAfterPayment = async (vnpResponseData) => {
    try {
      // Lấy lại token và userId từ AsyncStorage
      let tokenToUse = accessToken;
      let userIdToUse = userId;

      if (!tokenToUse || !userIdToUse) {
        // Lấy từ AsyncStorage nếu không có trong state
        tokenToUse = await AsyncStorage.getItem('accessToken');
        userIdToUse = await AsyncStorage.getItem('userId');

        // Nếu vẫn không có userId, thử trích xuất từ token
        if (tokenToUse && !userIdToUse) {
          const tokenData = parseJwt(tokenToUse);
          if (tokenData && (tokenData.userId || tokenData._id)) {
            userIdToUse = tokenData.userId || tokenData._id;
            console.log("Extracted userId from token:", userIdToUse);
            await AsyncStorage.setItem('userId', userIdToUse);
          }
        }
      }

      if (!tokenToUse || !userIdToUse) {
        console.error("No token or userId available");
        // Lưu thông tin đơn hàng để xử lý sau
        await AsyncStorage.setItem('pendingVnpayOrder', JSON.stringify({
          recipientInfo: formData,
          paymentData: vnpResponseData,
          items: orderItems,
          amount: parseInt(vnpResponseData.vnp_Amount) / 100 || totalAmount
        }));

        Alert.alert(
          language === "vi" ? "Đăng nhập hết hạn" : "Login expired",
          language === "vi"
            ? "Vui lòng đăng nhập lại để hoàn tất đơn hàng"
            : "Please login again to complete your order",
          [{
            text: language === "vi" ? "Đăng nhập" : "Login",
            onPress: () => navigation.navigate("Login", { returnToPaymentScreen: true })
          }]
        );

        return null;
      }

      // Chuẩn bị dữ liệu giỏ hàng đúng cấu trúc
      const validCartItems = orderItems.map(item => ({
        product: item.id || item.productId || item._id || item.product,
        quantity: item.quantity,
        size: item.size || "M"
      })).filter(item => item.product);

      // Tạo payload API
      const orderPayload = {
        recipientName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        paymentMethod: "vnpay",
        totalAmount: parseInt(vnpResponseData.vnp_Amount) / 100 || totalAmount,
        cart: validCartItems
      };

      console.log("Creating order with payload:", JSON.stringify(orderPayload));
      console.log("Using token:", tokenToUse);
      console.log("Using userId:", userIdToUse);

      // Đảm bảo token có định dạng Bearer
      const authHeader = tokenToUse.startsWith('Bearer ')
        ? tokenToUse
        : `Bearer ${tokenToUse}`;

      // QUAN TRỌNG: Sửa endpoint API và thêm header x-client-id
      const response = await fetch("http://10.0.2.2:3055/v1/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "x-client-id": userIdToUse
        },
        body: JSON.stringify(orderPayload)
      });

      const responseText = await response.text();
      console.log(`Server response (${response.status}):`, responseText);

      // Xử lý lỗi 401 - thử refresh token
      if (response.status === 401) {
        console.log("Token expired, trying to refresh...");
        const refreshed = await refreshToken();

        if (refreshed) {
          // Nếu refresh thành công, thử lại request với token mới
          const newToken = await AsyncStorage.getItem('accessToken');
          const retryResponse = await fetch("http://10.0.2.2:3055/v1/api/order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${newToken}`,
              "x-client-id": userIdToUse
            },
            body: JSON.stringify(orderPayload)
          });

          if (retryResponse.ok) {
            const retryText = await retryResponse.text();
            try {
              return JSON.parse(retryText);
            } catch (e) {
              return { success: true };
            }
          } else {
            // Nếu vẫn lỗi, thông báo đăng nhập lại
            Alert.alert(
              language === "vi" ? "Phiên làm việc hết hạn" : "Session expired",
              language === "vi"
                ? "Vui lòng đăng nhập lại để hoàn tất đơn hàng"
                : "Please login again to complete your order",
              [{
                text: language === "vi" ? "Đăng nhập" : "Login",
                onPress: () => navigation.navigate("Login")
              }]
            );
            return null;
          }
        } else {
          // Nếu không refresh được token, thông báo đăng nhập lại
          Alert.alert(
            language === "vi" ? "Phiên làm việc hết hạn" : "Session expired",
            language === "vi"
              ? "Vui lòng đăng nhập lại để hoàn tất đơn hàng"
              : "Please login again to complete your order",
            [{
              text: language === "vi" ? "Đăng nhập" : "Login",
              onPress: () => navigation.navigate("Login")
            }]
          );
          return null;
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response JSON:", e);
        data = { success: true };
      }

      console.log("Order created successfully:", data);
      return data;
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert(
        language === "vi" ? "Lỗi" : "Error",
        language === "vi" ? "Không thể tạo đơn hàng. Vui lòng thử lại sau." : "Cannot create order. Please try again later."
      );
      return null;
    }
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;
    setLoading(true);

    // Nếu chọn thanh toán khi giao hàng
    if (!directPaymentMode) {
      // Kiểm tra xác thực
      if (!accessToken || !userId) {
        setLoading(false);
        Alert.alert(
          language === "vi" ? "Cần đăng nhập" : "Login Required",
          language === "vi" ? "Vui lòng đăng nhập để tiếp tục" : "Please login to continue"
        );
        return;
      }

      // Chuẩn bị dữ liệu đơn hàng
      const orderPayload = {
        recipientName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        paymentMethod: "cash", // Phương thức thanh toán khi giao hàng
        totalAmount: totalAmount,
        cart: orderItems.map(item => ({
          product: item.id || item.productId || item._id || item.product,
          quantity: item.quantity,
          size: item.size || "M"
        })).filter(item => item.product)
      };

      // Gọi API tạo đơn hàng
      // Trong file PaymentScreen.js, tìm đoạn xử lý đơn hàng COD khoảng dòng 600-650
      fetch("http://10.0.2.2:3055/v1/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "x-client-id": userId
        },
        body: JSON.stringify(orderPayload)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok (Status: ${response.status})`);
          }
          return response.json();
        })
        .then(data => {
          // Thêm console log để kiểm tra cấu trúc dữ liệu trả về
          console.log("API Response data:", JSON.stringify(data));

          // Đảm bảo lấy đúng ID đơn hàng từ cấu trúc dữ liệu trả về
          const orderId = data._id || (data.metadata && data.metadata._id) ||
            (data.data && data.data._id) || (data.order && data.order._id);

          if (!orderId) {
            console.warn("Cannot extract order ID from API response:", data);
          }

          setLoading(false);
          // Xóa giỏ hàng
          clearCart();
          // Chuyển đến trang xác nhận đơn hàng
          navigation.navigate("OrderConfirmation", {
            orderDetails: {
              ...formData,
              totalAmount: totalAmount,
              items: orderItems,
              orderNumber: orderId, // Sử dụng orderId đã trích xuất an toàn
              orderDate: new Date().toISOString(),
              paymentStatus: language === "vi" ? "Chờ thanh toán" : "Pending",
              paymentMethod: "cash"
            }
          });
        })

        .catch(error => {
          console.error("Error:", error);
          setLoading(false);
          Alert.alert(
            language === "vi" ? "Lỗi" : "Error",
            language === "vi" ? "Không thể tạo đơn hàng. Vui lòng thử lại sau." : "Cannot create order. Please try again later."
          );
        });
    } else {
      // Xử lý thanh toán trực tuyến (VNPAY)...
      const directUrl = createDirectPaymentUrl();
      setPaymentUrl(directUrl);
      setShowWebView(true);
      setLoading(false);
      return;
    }
  };

  // Cải thiện xử lý kết quả thanh toán từ VNPAY
  const handleWebViewNavigationStateChange = (navState) => {
    console.log("Current URL:", navState.url);

    // Xử lý URLs có thể mở ứng dụng khác (như app ngân hàng)
    if (navState.url.startsWith('viba:') ||
      navState.url.startsWith('vcb:') ||
      navState.url.startsWith('vietin:') ||
      navState.url.startsWith('vietcom:') ||
      navState.url.startsWith('tpbank:') ||
      navState.url.startsWith('momo:')) {

      Linking.canOpenURL(navState.url).then(supported => {
        if (supported) {
          Linking.openURL(navState.url);
        } else {
          console.log("Không thể mở URL:", navState.url);
        }
      });
      return;
    }

    // Kiểm tra nếu URL chứa vnpay_return (URL callback)
    if (navState.url.includes("vnpay_return")) {
      console.log("Payment callback detected:", navState.url);

      // Parse thông tin từ URL response
      const params = parseQueryParams(navState.url);
      const vnpResponseCode = params['vnp_ResponseCode'];
      const vnpTxnRef = params['vnp_TxnRef']; // Mã đơn hàng từ VNPAY

      // Tạo đối tượng lưu thông tin VNPAY
      const vnpResponseData = {
        vnp_ResponseCode: vnpResponseCode,
        vnp_OrderInfo: params['vnp_OrderInfo'],
        vnp_TransactionNo: params['vnp_TransactionNo'],
        vnp_TxnRef: vnpTxnRef,
        vnp_Amount: params['vnp_Amount'],
        vnp_BankCode: params['vnp_BankCode'],
        vnp_PayDate: params['vnp_PayDate']
      };

      console.log("VNPAY Response:", vnpResponseData);
      setShowWebView(false); // Đóng WebView ngay khi nhận được callback

      // Kiểm tra kết quả thanh toán từ URL
      if (vnpResponseCode === '00') {
        // Thanh toán thành công - TẠO ĐƠN HÀNG TRONG HỆ THỐNG
        setLoading(true); // Thêm loading indicator

        createOrderAfterPayment(vnpResponseData)
          .then((orderResult) => {
            setLoading(false);

            if (orderResult) {
              // Xóa giỏ hàng
              clearCart();

              // Chuyển đến trang xác nhận đơn hàng
              navigation.navigate("OrderConfirmation", {
                orderDetails: {
                  ...formData,
                  totalAmount: parseInt(vnpResponseData.vnp_Amount) / 100 || totalAmount,
                  items: orderItems,
                  orderNumber: vnpTxnRef, // Sử dụng đúng mã đơn hàng từ VNPAY
                  orderDate: new Date().toISOString(),
                  paymentStatus: language === "vi" ? "Đã thanh toán" : "Paid",
                  paymentMethod: "vnpay"
                }
              });
            }
            // Không cần else vì đã xử lý ở trong hàm createOrderAfterPayment
          })
          .catch(error => {
            setLoading(false);
            console.error("Failed to process order after payment:", error);
            Alert.alert(
              language === "vi" ? "Lỗi" : "Error",
              language === "vi" ? "Lỗi xử lý đơn hàng" : "Error processing order"
            );
          });
      } else {
        // Thanh toán thất bại
        Alert.alert(
          language === "vi" ? "Thông báo" : "Notification",
          language === "vi" ? "Thanh toán không thành công hoặc bị hủy" : "Payment failed or cancelled"
        );
      }
    }
  };

  // Hiển thị WebView nếu có URL thanh toán
  if (showWebView && paymentUrl) {
    return (
      <PaymentWebView
        paymentUrl={paymentUrl}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        onClose={() => setShowWebView(false)}
        language={language}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, theme === 'dark' && styles.darkText]}>
          {language === "vi" ? "Thanh toán" : "Checkout"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        {!authLoaded ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6A5ACD" />
            <Text style={styles.loadingText}>
              {language === "vi" ? "Đang tải..." : "Loading..."}
            </Text>
          </View>
        ) : (
          <>
            {!accessToken && (
              <View style={styles.warningContainer}>
                <Icon name="exclamation-triangle" size={24} color="#FFA000" />
                <Text style={styles.warningText}>
                  {language === "vi"
                    ? "Bạn chưa đăng nhập. Đăng nhập để lưu đơn hàng vào tài khoản của bạn."
                    : "You are not logged in. Login to save your order to your account."}
                </Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => navigation.navigate("Login", { returnToPaymentScreen: true })}>
                  <Text style={styles.loginButtonText}>
                    {language === "vi" ? "Đăng nhập" : "Login"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.sectionContainer, theme === 'dark' && styles.darkSectionContainer]}>
              <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
                {language === "vi" ? "Thông tin giao hàng" : "Delivery Information"}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Họ và tên" : "Full Name"}*
                </Text>
                <TextInput
                  style={[styles.input, theme === 'dark' && styles.darkInput]}
                  placeholder={language === "vi" ? "Điền tên của bạn" : "Type your name"}
                  placeholderTextColor={theme === 'dark' ? '#777777' : '#AAAAAA'}
                  value={formData.fullName}
                  onChangeText={(text) => handleInputChange("fullName", text)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Số điện thoại" : "Phone Number"}*
                </Text>
                <TextInput
                  style={[styles.input, theme === 'dark' && styles.darkInput]}
                  placeholder="Nhập số điện thoại của bạn"
                  placeholderTextColor={theme === 'dark' ? '#777777' : '#AAAAAA'}
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange("phone", text)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Địa chỉ" : "Address"}*
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, theme === 'dark' && styles.darkInput]}
                  placeholder={language === "vi" ? "Địa chỉ của bạn" : "Address details"}
                  placeholderTextColor={theme === 'dark' ? '#777777' : '#AAAAAA'}
                  multiline
                  numberOfLines={3}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange("address", text)}
                />
              </View>

              {/* Thêm lựa chọn phương thức thanh toán */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Phương thức thanh toán" : "Payment Method"}
                </Text>
                <View style={styles.methodOptions}>
                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      !directPaymentMode && styles.methodOptionActive
                    ]}
                    onPress={() => setDirectPaymentMode(false)}>
                    <Icon
                      name="home"
                      size={20}
                      color={!directPaymentMode ? "#6A5ACD" : "#666666"}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        !directPaymentMode && styles.methodTextActive
                      ]}>
                      {language === "vi" ? "Thanh toán khi giao hàng" : "Via account"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodOption,
                      directPaymentMode && styles.methodOptionActive
                    ]}
                    onPress={() => setDirectPaymentMode(true)}>
                    <Icon
                      name="credit-card"
                      size={20}
                      color={directPaymentMode ? "#6A5ACD" : "#666666"}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        directPaymentMode && styles.methodTextActive
                      ]}>
                      {language === "vi" ? "Thanh toán qua VNPAY" : "Direct payment"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.orderSummary, theme === 'dark' && styles.darkSectionContainer]}>
              <Text style={[styles.sectionTitle, theme === 'dark' && styles.darkText]}>
                {language === "vi" ? "Tổng thanh toán" : "Order Summary"}
              </Text>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Tổng tiền hàng" : "Subtotal"}
                </Text>
                <Text style={[styles.summaryValue, theme === 'dark' && styles.darkText]}>
                  {totalAmount.toLocaleString()} đ
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryText, theme === 'dark' && styles.darkSubText]}>
                  {language === "vi" ? "Phí vận chuyển" : "Shipping Fee"}
                </Text>
                <Text style={[styles.summaryValue, theme === 'dark' && styles.darkText]}>
                  {language === "vi" ? "Miễn phí" : "Free"}
                </Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.totalText, theme === 'dark' && styles.darkText]}>
                  {language === "vi" ? "Tổng thanh toán" : "Total"}
                </Text>
                <Text style={styles.totalValue}>
                  {totalAmount.toLocaleString()} đ
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#6A5ACD" />
        ) : (
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              directPaymentMode && styles.directPaymentButton
            ]}
            onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderButtonText}>
              {directPaymentMode
                ? (language === "vi" ? "Thanh toán qua VNPay" : "Direct Payment")
                : (language === "vi" ? "Đặt hàng" : "Place Order")}
            </Text>
          </TouchableOpacity>
        )}
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
  darkSectionContainer: {
    backgroundColor: "#1E1E1E",
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
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  darkText: {
    color: "#FFFFFF",
  },
  darkSubText: {
    color: "#AAAAAA",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#000000",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555555",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#333333",
  },
  darkInput: {
    backgroundColor: "#333333",
    borderColor: "#555555",
    color: "#FFFFFF",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  orderSummary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 15,
    color: "#666666",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6A5ACD",
  },
  buttonContainer: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  placeOrderButton: {
    backgroundColor: "#6A5ACD",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6A5ACD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  directPaymentButton: {
    backgroundColor: "#4CAF50",
  },
  placeOrderButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 10,
  },
  webViewHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6A5ACD"
  },
  paymentMethodContainer: {
    marginTop: 10,
  },
  methodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  methodOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  methodOptionActive: {
    borderColor: '#6A5ACD',
    backgroundColor: '#F0EEFA',
  },
  methodText: {
    color: '#666666',
  },
  methodTextActive: {
    color: '#6A5ACD',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF8E1',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: 10,
    color: '#795548',
    flex: 1,
    textAlign: 'center',
    marginVertical: 10,
  },
  loginButton: {
    backgroundColor: '#FFA000',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 5,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
  }
});

export default PaymentScreen;