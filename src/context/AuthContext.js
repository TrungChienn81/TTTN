import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("accessToken");
        const storedUser = await AsyncStorage.getItem("userData");
        
        console.log("🔑 Token from storage:", storedToken ? "Found" : "Not found");
        
        if (storedToken && storedToken !== "null" && storedToken !== "undefined") {
          // Validate token format before setting
          if (typeof storedToken === 'string' && storedToken.trim() !== '') {
            setToken(storedToken.trim().replace(/^["'](.*)["']$/, '$1'));
            setIsLoggedIn(true);
            console.log("✅ User authenticated with stored token");
            
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                console.log("✅ User data loaded");
              } catch (e) {
                console.error("❌ Error parsing user data", e);
              }
            }
          } else {
            console.error("❌ Invalid token format in storage");
            await AsyncStorage.removeItem("accessToken");
          }
        } else {
          console.log("ℹ️ No token found, user not authenticated");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("❌ Error reading AsyncStorage:", error);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (newToken, userData) => {
    if (!newToken || newToken === "null" || newToken === "undefined") {
      console.error("❌ Token is invalid, cannot store in AsyncStorage");
      return;
    }
    
    try {
      // Double-check the token structure
      const parts = newToken.split('.');
      if (parts.length !== 3) {
        console.error("❌ Token format is invalid (not a proper JWT)");
        return;
      }
      
      await AsyncStorage.setItem("accessToken", newToken);
      console.log("✅ Token saved successfully!");
      
      // Save user data if provided
      if (userData) {
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        await AsyncStorage.setItem("userId", userData._id || userData.userId);
        setUser(userData);
      }
      
      setToken(newToken);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("❌ AsyncStorage error during login:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("refreshToken");
      console.log("🚪 Logged out, token removed!");
      setToken(null);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("❌ AsyncStorage error during logout:", error);
    }
  };

  // Thêm hàm refreshToken để tự động làm mới token khi cần
  const refreshToken = async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!storedRefreshToken || !userId) {
        console.log("No refresh token or userId available");
        return false;
      }
      
      const response = await fetch('http://10.0.2.2:3055/v1/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: storedRefreshToken,
          userId: userId
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('accessToken', data.accessToken);
        setToken(data.accessToken);
        console.log("Token refreshed successfully");
        return true;
      }
      
      console.log("Failed to refresh token");
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      token, 
      user, 
      loading, 
      login, 
      logout,
      refreshToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
