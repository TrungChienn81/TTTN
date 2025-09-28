import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome5";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import PantsScreen from "../screens/PantsScreen";
import ShirtsScreen from "../screens/ShirtsScreen";
import CartScreen from "../screens/CartScreen";
import UserScreen from "../screens/UserScreen";
import SearchScreen from "../screens/SearchScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import TopRatedScreen from "../screens/TopRatedScreen";
import PaymentScreen from "../screens/PaymentScreen";
import OrderConfirmationScreen from "../screens/OrderConfirmationScreen";
import OrderTrackingScreen from "../screens/OrderTrackingScreen";
import HistoryOrderScreen from '../screens/HistoryOrderScreen';
// Other screens
import DressScreen from "../screens/DressScreen";
import ShoesScreen from "../screens/ShoesScreen";
import BagsScreen from "../screens/BagsScreen";
import AdminOrderScreen from '../screens/AdminOrderScreen';
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  const { language } = useSettings();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={HistoryOrderScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Chi tiết sản phẩm" : "Product Detail",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
      <Stack.Screen
        name="AdminOrder"
        component={AdminOrderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TopRated"
        component={TopRatedScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Sản phẩm nổi bật" : "Top Rated",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
      <Stack.Screen
        name="Pants"
        component={PantsScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Quần" : "Pants",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
      <Stack.Screen
        name="Shirts"
        component={ShirtsScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Áo" : "Shirts",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
      <Stack.Screen
        name="ShoesScreen"
        component={ShoesScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Giày" : "Shoes",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
      <Stack.Screen
        name="BagsScreen"
        component={BagsScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Túi" : "Bags",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
      <Stack.Screen
        name="DressScreen"
        component={DressScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Váy" : "Dress",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
    </Stack.Navigator>
  );
};

const CartStack = () => {
  const { language } = useSettings();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  );
};

const SearchStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
    </Stack.Navigator>
  );
};

const UserStack = () => {
  const { language } = useSettings();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="UserScreen"
        component={UserScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          headerShown: true,
          title: language === "vi" ? "Đăng xuất" : "Logout",
          headerBackTitle: language === "vi" ? "Quay lại" : "Back"
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const { language } = useSettings();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          tabBarLabel: language === "vi" ? "Trang chủ" : "Home",
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchStack"
        component={SearchStack}
        options={{
          tabBarLabel: language === "vi" ? "Tìm kiếm" : "Search",
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CartStack"
        component={CartStack}
        options={{
          tabBarLabel: language === "vi" ? "Giỏ hàng" : "Cart",
          tabBarIcon: ({ color, size }) => (
            <Icon name="shopping-cart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="UserStack"
        component={UserStack}
        options={{
          tabBarLabel: language === "vi" ? "Người dùng" : "User",
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoggedIn } = useAuth();
  const { language } = useSettings();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                headerShown: true,
                title: language === "vi" ? "Đăng ký" : "Register",
                headerBackTitle: language === "vi" ? "Quay lại" : "Back"
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <AuthProvider>
    <SettingsProvider>
      <AppNavigator />
    </SettingsProvider>
  </AuthProvider>
);

export default App;
