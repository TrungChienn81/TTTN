import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    ScrollView,
    Dimensions,
    SafeAreaView
} from "react-native";
import * as Animatable from 'react-native-animatable';
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import Icon from "react-native-vector-icons/FontAwesome5";
import CountryFlag from "react-native-country-flag";
import axios from "axios";

const { width } = Dimensions.get('window');

const UserScreen = ({ navigation }) => {
    const { language, theme, toggleTheme, changeLanguage } = useSettings();
    const { logout, token } = useAuth();
    const [user, setUser] = useState({ name: "", email: "", phone: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Generate avatar based on user's name
    const getAvatarUrl = (name) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6A5ACD&color=fff&size=256`;
    };

    // Get first letter for avatar backup
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : "?";
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) {
                console.warn("⚠️ No token found, redirecting to login...");
                navigation.navigate("Login");
                return;
            }

            console.log("🔑 Using token:", token);
            setLoading(true);

            try {
                // Extract user data from JWT token
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    try {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        console.log("✅ Token payload:", payload);

                        setUser({
                            name: payload.userName || "N/A",
                            email: payload.email || "N/A",
                            phone: payload.phone || "N/A"
                        });

                        setError(null);
                    } catch (e) {
                        console.error("Error parsing token payload:", e);
                    }
                }
            } catch (error) {
                console.error("❌ Error fetching user data:", error);
                setError("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [token, navigation]);

    const getLanguageFlag = () => {
        return language === "vi" ? "VN" : "US";
    };

    const getThemeIcon = () => {
        return theme === "light" ? "sun" : "moon";
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, theme === "dark" && styles.darkContainer]}>
                <ActivityIndicator size="large" color="#6A5ACD" />
                <Text style={[styles.loadingText, theme === "dark" && styles.darkText]}>
                    {language === "vi" ? "Đang tải thông tin..." : "Loading profile..."}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, theme === "dark" && styles.darkContainer]}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header Section */}
                <Animatable.View
                    animation="fadeIn"
                    duration={800}
                    style={styles.headerSection}
                >
                    <Animatable.View
                        animation="pulse"
                        iterationCount="infinite"
                        iterationDelay={5000}
                        duration={2000}
                        style={styles.avatarContainer}
                    >
                        <Image
                            source={{ uri: getAvatarUrl(user.name) }}
                            style={styles.avatar}
                            onError={() => (
                                <View style={[styles.avatar, styles.avatarFallback]}>
                                    <Text style={styles.avatarText}>{getInitial(user.name)}</Text>
                                </View>
                            )}
                        />
                    </Animatable.View>
                    <Animatable.Text
                        animation="fadeIn"
                        delay={300}
                        style={[styles.userName, theme === "dark" && styles.darkText]}
                    >
                        {user.name}
                    </Animatable.Text>
                    <Animatable.View
                        animation="fadeIn"
                        delay={600}
                        style={styles.statusBadge}
                    >
                        <Icon name="circle" size={8} color="#4CAF50" style={styles.statusIcon} />
                        <Text style={styles.statusText}>
                            {language === "vi" ? "Đang hoạt động" : "Active"}
                        </Text>
                    </Animatable.View>
                </Animatable.View>

                {/* User Information Card */}
                <Animatable.View
                    animation="fadeInUp"
                    duration={1000}
                    delay={300}
                    style={[styles.card, theme === "dark" && styles.darkCard]}
                >
                    <View style={styles.cardHeader}>
                        <Icon name="id-badge" size={18} color={theme === "dark" ? "#fff" : "#6A5ACD"} />
                        <Text style={[styles.cardHeaderText, theme === "dark" && styles.darkText]}>
                            {language === "vi" ? "Thông tin cá nhân" : "Personal Information"}
                        </Text>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => Alert.alert(
                                language === "vi" ? "Chỉnh sửa thông tin" : "Edit Profile",
                                language === "vi"
                                    ? "Chức năng này đang được phát triển."
                                    : "This feature is under development."
                            )}
                        >
                            <Icon name="edit" size={16} color={theme === "dark" ? "#4FD1C5" : "#6A5ACD"} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <Animatable.View animation="fadeIn" delay={400}>
                        <View style={styles.infoRow}>
                            <Icon name="user" size={16} color={theme === "dark" ? "#ddd" : "#777"} style={styles.infoIcon} />
                            <Text style={[styles.infoLabel, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Họ tên" : "Full name"}
                            </Text>
                            <Text style={[styles.infoValue, theme === "dark" && styles.darkText]}>
                                {user.name}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Icon name="envelope" size={16} color={theme === "dark" ? "#ddd" : "#777"} style={styles.infoIcon} />
                            <Text style={[styles.infoLabel, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Email" : "Email"}
                            </Text>
                            <Text style={[styles.infoValue, theme === "dark" && styles.darkText]}>
                                {user.email}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Icon name="phone-alt" size={16} color={theme === "dark" ? "#ddd" : "#777"} style={styles.infoIcon} />
                            <Text style={[styles.infoLabel, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Điện thoại" : "Phone"}
                            </Text>
                            <Text style={[styles.infoValue, theme === "dark" && styles.darkText]}>
                                {user.phone}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Icon name="calendar-alt" size={16} color={theme === "dark" ? "#ddd" : "#777"} style={styles.infoIcon} />
                            <Text style={[styles.infoLabel, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Tham gia" : "Joined"}
                            </Text>
                            <Text style={[styles.infoValue, theme === "dark" && styles.darkText]}>
                                {new Date().toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                            </Text>
                        </View>
                    </Animatable.View>

                    <TouchableOpacity
                        style={styles.viewDetailButton}
                        onPress={() => Alert.alert(
                            language === "vi" ? "Thông tin tài khoản" : "Account Information",
                            language === "vi"
                                ? "Chức năng xem chi tiết tài khoản đang được phát triển."
                                : "The account details view is under development."
                        )}
                    >
                        <Text style={styles.viewDetailText}>
                            {language === "vi" ? "Xem chi tiết tài khoản" : "View account details"}
                        </Text>
                        <Icon name="chevron-right" size={14} color={theme === "dark" ? "#4FD1C5" : "#6A5ACD"} />
                    </TouchableOpacity>
                </Animatable.View>

                {/* Settings Card */}
                <Animatable.View
                    animation="fadeInUp"
                    duration={1000}
                    delay={600}
                    style={[styles.card, theme === "dark" && styles.darkCard]}
                >
                    <View style={styles.cardHeader}>
                        <Icon name="cog" size={18} color={theme === "dark" ? "#fff" : "#6A5ACD"} />
                        <Text style={[styles.cardHeaderText, theme === "dark" && styles.darkText]}>
                            {language === "vi" ? "Cài đặt" : "Settings"}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={[styles.settingsButton, theme === "dark" && styles.darkSettingsButton]}
                        onPress={() => changeLanguage(language === "vi" ? "en" : "vi")}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingIconContainer}>
                            <CountryFlag isoCode={getLanguageFlag()} size={18} />
                        </View>
                        <Text style={[styles.settingText, theme === "dark" && styles.darkText]}>
                            {language === "vi" ? "Ngôn ngữ" : "Language"}
                        </Text>
                        <View style={styles.settingValueContainer}>
                            <Text style={[styles.settingValue, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Tiếng Việt" : "English"}
                            </Text>
                            <Icon name="chevron-right" size={14} color={theme === "dark" ? "#aaa" : "#999"} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingsButton, theme === "dark" && styles.darkSettingsButton]}
                        onPress={toggleTheme}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingIconContainer}>
                            <Icon name={getThemeIcon()} size={18} color={theme === "dark" ? "#FFD700" : "#FFA500"} />
                        </View>
                        <Text style={[styles.settingText, theme === "dark" && styles.darkText]}>
                            {language === "vi" ? "Giao diện" : "Appearance"}
                        </Text>
                        <View style={styles.settingValueContainer}>
                            <Text style={[styles.settingValue, theme === "dark" && styles.darkSubText]}>
                                {theme === "light" ?
                                    (language === "vi" ? "Sáng" : "Light") :
                                    (language === "vi" ? "Tối" : "Dark")}
                            </Text>
                            <Icon name="chevron-right" size={14} color={theme === "dark" ? "#aaa" : "#999"} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingsButton, theme === "dark" && styles.darkSettingsButton]}
                        onPress={() => navigation.navigate("ChangePassword")}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingIconContainer}>
                            <Icon name="key" size={18} color={theme === "dark" ? "#4FD1C5" : "#38B2AC"} />
                        </View>
                        <Text style={[styles.settingText, theme === "dark" && styles.darkText]}>
                            {language === "vi" ? "Đổi mật khẩu" : "Change Password"}
                        </Text>
                        <View style={styles.settingValueContainer}>
                            <Icon name="chevron-right" size={14} color={theme === "dark" ? "#aaa" : "#999"} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingsButton, theme === "dark" && styles.darkSettingsButton, { borderBottomWidth: 0 }]}
                        onPress={() => Alert.alert(
                            language === "vi" ? "Thông báo" : "Notifications",
                            language === "vi" ? "Tính năng đang phát triển" : "Feature under development"
                        )}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingIconContainer}>
                            <Icon name="bell" size={18} color={theme === "dark" ? "#F6AD55" : "#ED8936"} />
                        </View>
                        <Text style={[styles.settingText, theme === "dark" && styles.darkText]}>
                            {language === "vi" ? "Thông báo" : "Notifications"}
                        </Text>
                        <View style={styles.settingValueContainer}>
                            <Text style={[styles.settingValue, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Bật" : "On"}
                            </Text>
                            <Icon name="chevron-right" size={14} color={theme === "dark" ? "#aaa" : "#999"} />
                        </View>
                    </TouchableOpacity>
                </Animatable.View>

                {/* Logout Button */}
                <Animatable.View
                    animation="fadeInUp"
                    duration={1000}
                    delay={900}
                >
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => {
                            Alert.alert(
                                language === "vi" ? "Đăng xuất" : "Logout",
                                language === "vi"
                                    ? "Bạn có chắc chắn muốn đăng xuất không?"
                                    : "Are you sure you want to logout?",
                                [
                                    {
                                        text: language === "vi" ? "Hủy" : "Cancel",
                                        style: "cancel"
                                    },
                                    {
                                        text: language === "vi" ? "Đăng xuất" : "Logout",
                                        onPress: () => {
                                            logout();
                                            navigation.navigate("Login");
                                        },
                                        style: "destructive"
                                    }
                                ]
                            );
                        }}
                    >
                        <Icon name="sign-out-alt" size={18} color="#fff" style={styles.logoutIcon} />
                        <Text style={styles.logoutText}>
                            {language === "vi" ? "Đăng xuất" : "Logout"}
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper function for base64 (same as before)
const atob = (base64) => {
    // Add padding if needed
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }

    return global.atob ?
        global.atob(base64) :
        decodeURIComponent(escape(
            require('base-64').decode(base64)
        ));
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F9FC",
    },
    darkContainer: {
        backgroundColor: "#121212",
    },
    scrollContainer: {
        paddingVertical: 25,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#F7F9FC",
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderRadius: 70,
        backgroundColor: '#fff',
        padding: 3,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#6A5ACD',
    },
    avatarFallback: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 60,
        color: '#fff',
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        color: '#333',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginTop: 8,
    },
    statusIcon: {
        marginRight: 5,
    },
    statusText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    darkCard: {
        backgroundColor: '#1E1E1E',
        shadowColor: '#111',
        borderColor: '#333',
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardHeaderText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
        color: '#333',
        flex: 1,
    },
    editButton: {
        padding: 8,
        borderRadius: 15,
        backgroundColor: 'rgba(106, 90, 205, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    infoIcon: {
        marginRight: 10,
        width: 20,
        textAlign: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 80,
    },
    infoValue: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    viewDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    viewDetailText: {
        fontSize: 14,
        color: '#6A5ACD',
        marginRight: 5,
    },
    settingsButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    darkSettingsButton: {
        borderBottomColor: '#333',
    },
    settingIconContainer: {
        width: 32,
        alignItems: 'center',
        marginRight: 10,
    },
    settingText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    settingValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 14,
        color: '#999',
        marginRight: 5,
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#FF6347',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#FF6347',
        marginVertical: 20,
        textAlign: 'center',
    },
    darkText: {
        color: '#FFFFFF',
    },
    darkSubText: {
        color: '#AAAAAA',
    },
});

export default UserScreen;
