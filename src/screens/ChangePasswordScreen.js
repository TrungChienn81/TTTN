import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    ScrollView,
    ActivityIndicator
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import * as Animatable from 'react-native-animatable';

const ChangePasswordScreen = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordMatch, setPasswordMatch] = useState(true);
    const { token } = useAuth();
    const { language, theme } = useSettings();

    // Password strength checker
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 6) score += 1;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[!@#$%^&*]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        return score;
    };

    // Check if passwords match
    const checkPasswordMatch = () => {
        if (confirmNewPassword.length > 0) {
            setPasswordMatch(confirmNewPassword === newPassword);
        } else {
            setPasswordMatch(true);
        }
    };

    // Update password strength when password changes
    const handlePasswordChange = (password) => {
        setNewPassword(password);
        setPasswordStrength(checkPasswordStrength(password));
        if (confirmNewPassword.length > 0) {
            setPasswordMatch(confirmNewPassword === password);
        }
    };

    // Update password match when confirm password changes
    const handleConfirmPasswordChange = (password) => {
        setConfirmNewPassword(password);
        setPasswordMatch(newPassword === password || password === '');
    };

    const validatePassword = (password) => {
        // Check for no spaces
        if (password.includes(" ")) {
            return false;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
        return passwordRegex.test(password);
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            Alert.alert(
                language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                language === "vi" ? "Vui lòng điền đầy đủ thông tin." : "All fields are required."
            );
            return;
        }

        if (newPassword === currentPassword) {
            Alert.alert(
                language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                language === "vi"
                    ? "Mật khẩu mới không được trùng với mật khẩu hiện tại."
                    : "New password cannot be the same as the current password."
            );
            return;
        }

        if (newPassword !== confirmNewPassword) {
            Alert.alert(
                language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                language === "vi" ? "Mật khẩu mới không khớp." : "New passwords do not match."
            );
            return;
        }

        if (!validatePassword(newPassword)) {
            Alert.alert(
                language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                language === "vi"
                    ? "Mật khẩu mới phải có ít nhất 6 ký tự, không chứa khoảng trắng, bắt đầu bằng chữ hoa và chứa ký tự đặc biệt."
                    : "New password must be at least 6 characters long, contain no spaces, start with an uppercase letter, and include a special character."
            );
            return;
        }

        setLoading(true);

        try {
            // Sửa API endpoint để phù hợp với các màn hình khác
            const response = await axios.post("http://10.0.2.2:3055/v1/api/reset-password", {
                currentPassword,
                newPassword,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                Alert.alert(
                    language === "vi" ? "Thay đổi mật khẩu thành công" : "Change Password Successful",
                    language === "vi" ? "Mật khẩu của bạn đã được thay đổi." : "Your password has been changed.",
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate("UserProfile")
                        }
                    ]
                );
            } else {
                Alert.alert(
                    language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                    response.data.message || (language === "vi" ? "Thay đổi mật khẩu thất bại." : "Failed to change password.")
                );
            }
        } catch (error) {
            console.error("Change password error:", error);
            if (error.response && error.response.data) {
                Alert.alert(
                    language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                    error.response.data.message || (language === "vi" ? "Đã xảy ra lỗi. Vui lòng thử lại." : "An error occurred. Please try again.")
                );
            } else {
                Alert.alert(
                    language === "vi" ? "Thay đổi mật khẩu thất bại" : "Change Password Failed",
                    language === "vi" ? "Đã xảy ra lỗi. Vui lòng thử lại." : "An error occurred. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // Get strength level color and text
    const getStrengthColor = () => {
        if (passwordStrength === 0) return "#ccc"; // Empty
        if (passwordStrength <= 2) return "#FF6347"; // Weak (Red)
        if (passwordStrength <= 3) return "#FFA500"; // Medium (Orange)
        return "#4CAF50"; // Strong (Green)
    };

    const getStrengthText = () => {
        if (passwordStrength === 0) return language === "vi" ? "Chưa nhập" : "Empty";
        if (passwordStrength <= 2) return language === "vi" ? "Yếu" : "Weak";
        if (passwordStrength <= 3) return language === "vi" ? "Trung bình" : "Medium";
        return language === "vi" ? "Mạnh" : "Strong";
    };

    return (
        <SafeAreaView style={[
            styles.container,
            theme === "dark" && styles.darkContainer
        ]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Animatable.View animation="fadeIn" duration={800}>
                    <Text style={[
                        styles.title,
                        theme === "dark" && styles.darkText
                    ]}>
                        {language === "vi" ? "Thay đổi mật khẩu" : "Change Password"}
                    </Text>

                    <Animatable.View animation="fadeInUp" duration={800} delay={300}>
                        <View style={[
                            styles.passwordContainer,
                            theme === "dark" && styles.darkPasswordContainer
                        ]}>
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                placeholder={language === "vi" ? "Mật khẩu hiện tại" : "Current Password"}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrentPassword}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <Icon name={showCurrentPassword ? "eye-slash" : "eye"} size={20} color={theme === "dark" ? "#aaa" : "#333"} />
                            </TouchableOpacity>
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={500}>
                        <View style={[
                            styles.passwordContainer,
                            theme === "dark" && styles.darkPasswordContainer
                        ]}>
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                placeholder={language === "vi" ? "Mật khẩu mới" : "New Password"}
                                value={newPassword}
                                onChangeText={handlePasswordChange}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Icon name={showNewPassword ? "eye-slash" : "eye"} size={20} color={theme === "dark" ? "#aaa" : "#333"} />
                            </TouchableOpacity>
                        </View>

                        {newPassword.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <Text style={[styles.strengthLabel, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "Độ mạnh:" : "Strength:"}
                                    <Text style={{ color: getStrengthColor() }}> {getStrengthText()}</Text>
                                </Text>
                                <View style={styles.strengthBar}>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <View
                                            key={level}
                                            style={[
                                                styles.strengthSegment,
                                                { backgroundColor: level <= passwordStrength ? getStrengthColor() : (theme === "dark" ? '#444' : '#ddd') }
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={700}>
                        <View style={[
                            styles.passwordContainer,
                            theme === "dark" && styles.darkPasswordContainer,
                            !passwordMatch && styles.inputError
                        ]}>
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                placeholder={language === "vi" ? "Xác nhận mật khẩu mới" : "Confirm New Password"}
                                value={confirmNewPassword}
                                onChangeText={handleConfirmPasswordChange}
                                secureTextEntry={!showConfirmNewPassword}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            >
                                <Icon name={showConfirmNewPassword ? "eye-slash" : "eye"} size={20} color={theme === "dark" ? "#aaa" : "#333"} />
                            </TouchableOpacity>
                        </View>

                        {confirmNewPassword.length > 0 && !passwordMatch && (
                            <Animatable.Text animation="shake" duration={500} style={styles.errorText}>
                                {language === "vi" ? "Mật khẩu không khớp" : "Passwords don't match"}
                            </Animatable.Text>
                        )}
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={900}>
                        <View style={[styles.passwordRules, theme === "dark" && styles.darkPasswordRules]}>
                            <Text style={[styles.rulesTitle, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Yêu cầu mật khẩu:" : "Password requirements:"}
                            </Text>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={newPassword.length >= 6 ? "check-circle" : "circle"}
                                    size={14}
                                    color={newPassword.length >= 6 ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 6 ký tự" : "• At least 6 characters"}
                                </Text>
                            </View>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={/[A-Z]/.test(newPassword) ? "check-circle" : "circle"}
                                    size={14}
                                    color={/[A-Z]/.test(newPassword) ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 1 chữ hoa" : "• At least 1 uppercase letter"}
                                </Text>
                            </View>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={/[!@#$%^&*]/.test(newPassword) ? "check-circle" : "circle"}
                                    size={14}
                                    color={/[!@#$%^&*]/.test(newPassword) ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 1 ký tự đặc biệt" : "• At least 1 special character"}
                                </Text>
                            </View>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={/[0-9]/.test(newPassword) ? "check-circle" : "circle"}
                                    size={14}
                                    color={/[0-9]/.test(newPassword) ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 1 chữ số" : "• At least 1 number"}
                                </Text>
                            </View>
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeIn" duration={800} delay={1100}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                loading && styles.buttonDisabled
                            ]}
                            onPress={handleChangePassword}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {language === "vi" ? "Thay đổi mật khẩu" : "Change Password"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.cancelButtonText, theme === "dark" && { color: "#8A7ADC" }]}>
                                {language === "vi" ? "Huỷ bỏ" : "Cancel"}
                            </Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </Animatable.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    darkContainer: {
        backgroundColor: "#121212",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        textAlign: "center",
        color: "#333",
    },
    darkText: {
        color: "#FFFFFF",
    },
    darkSubText: {
        color: "#AAAAAA",
    },
    darkInput: {
        color: "#FFFFFF",
        backgroundColor: "transparent",
    },
    darkPasswordContainer: {
        backgroundColor: "#2A2A2A",
        borderColor: "#444",
    },
    darkPasswordRules: {
        backgroundColor: 'rgba(106, 90, 205, 0.15)',
        borderLeftColor: '#8A7ADC',
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: "#fff",
        marginBottom: 15,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    passwordInput: {
        flex: 1,
        height: 55,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    inputError: {
        borderColor: "#FF6347",
        borderWidth: 2,
    },
    errorText: {
        color: "#FF6347",
        fontSize: 14,
        marginBottom: 15,
        marginLeft: 5,
    },
    toggleButton: {
        padding: 15,
    },
    button: {
        backgroundColor: "#6A5ACD",
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 15,
        shadowColor: "#6A5ACD",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: "#9D99BC",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    cancelButton: {
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#6A5ACD",
        fontSize: 16,
    },
    strengthContainer: {
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    strengthLabel: {
        fontSize: 14,
        marginBottom: 5,
        color: "#777",
    },
    strengthBar: {
        flexDirection: "row",
        height: 5,
        borderRadius: 3,
        overflow: "hidden",
    },
    strengthSegment: {
        flex: 1,
        marginHorizontal: 1,
    },
    passwordRules: {
        marginBottom: 25,
        padding: 15,
        backgroundColor: 'rgba(106, 90, 205, 0.08)',
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#6A5ACD',
    },
    rulesTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
        color: "#555",
    },
    ruleItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
    },
    ruleText: {
        fontSize: 14,
        marginLeft: 8,
        color: "#666",
    },
});

export default ChangePasswordScreen;
