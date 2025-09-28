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
import Icon from "react-native-vector-icons/FontAwesome5";
import * as Animatable from 'react-native-animatable';
import { useSettings } from "../context/SettingsContext";

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordMatch, setPasswordMatch] = useState(true);
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

    // Update password strength when password changes
    const handlePasswordChange = (password) => {
        setPassword(password);
        setPasswordStrength(checkPasswordStrength(password));
        if (confirmPassword.length > 0) {
            setPasswordMatch(confirmPassword === password);
        }
    };

    // Update password match when confirm password changes
    const handleConfirmPasswordChange = (password) => {
        setConfirmPassword(password);
        setPasswordMatch(password === '' || password === password);
    };

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{6,}$/;
        return regex.test(password);
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

    const handleRegister = async () => {
        if (!username || !email || !phone || !password || !confirmPassword) {
            Alert.alert(
                language === "vi" ? "Đăng ký thất bại" : "Registration Failed",
                language === "vi" ? "Vui lòng điền đầy đủ thông tin." : "All fields are required."
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                language === "vi" ? "Đăng ký thất bại" : "Registration Failed",
                language === "vi" ? "Mật khẩu không khớp." : "Passwords do not match."
            );
            return;
        }

        if (!validatePassword(password)) {
            Alert.alert(
                language === "vi" ? "Đăng ký thất bại" : "Registration Failed",
                language === "vi"
                    ? "Mật khẩu phải có ít nhất 6 ký tự, chứa ít nhất một chữ hoa và một ký tự đặc biệt."
                    : "Password must be at least 6 characters long, contain an uppercase letter and a special character."
            );
            return;
        }

        setLoading(true);

        try {
            console.log("Attempting to register with:", { username, email, phone, password });
            const response = await fetch("http://10.0.2.2:3055/v1/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, phone, password }),
            });

            const data = await response.json();
            console.log("Register API response:", data);

            if (data.status === 200) {
                Alert.alert(
                    language === "vi" ? "Đăng ký thành công" : "Registration Successful",
                    language === "vi" ? "Bạn đã đăng ký thành công." : "You have successfully registered.",
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate("Login")
                        }
                    ]
                );
            } else {
                Alert.alert(
                    language === "vi" ? "Đăng ký thất bại" : "Registration Failed",
                    data.message
                );
            }
        } catch (error) {
            console.error("Error registering:", error);
            Alert.alert(
                language === "vi" ? "Đăng ký thất bại" : "Registration Failed",
                language === "vi" ? "Đã xảy ra lỗi. Vui lòng thử lại." : "An error occurred. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[
            styles.container,
            theme === "dark" && styles.darkContainer
        ]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                <Animatable.View animation="fadeIn" duration={800}>
                    <Animatable.Text animation="fadeInDown" duration={800} style={[
                        styles.title,
                        theme === "dark" && styles.darkText
                    ]}>
                        {language === "vi" ? "Đăng Ký" : "Register"}
                    </Animatable.Text>

                    <Animatable.View animation="fadeInUp" duration={800} delay={300}>
                        <View style={[
                            styles.inputContainer,
                            theme === "dark" && styles.darkInputContainer
                        ]}>
                            <Icon name="user" size={18} color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"} style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholder={language === "vi" ? "Tên người dùng" : "Username"}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={400}>
                        <View style={[
                            styles.inputContainer,
                            theme === "dark" && styles.darkInputContainer
                        ]}>
                            <Icon name="envelope" size={18} color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"} style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholder={language === "vi" ? "Email" : "Email"}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={500}>
                        <View style={[
                            styles.inputContainer,
                            theme === "dark" && styles.darkInputContainer
                        ]}>
                            <Icon name="phone" size={18} color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"} style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.input,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholder={language === "vi" ? "Số điện thoại" : "Phone Number"}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={600}>
                        <View style={[
                            styles.passwordContainer,
                            theme === "dark" && styles.darkPasswordContainer
                        ]}>
                            <Icon name="lock" size={18} color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"} style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholder={language === "vi" ? "Mật khẩu" : "Password"}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Icon name={showPassword ? "eye-slash" : "eye"} size={20} color={theme === "dark" ? "#aaa" : "#333"} />
                            </TouchableOpacity>
                        </View>

                        {password.length > 0 && (
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
                            <Icon name="lock" size={18} color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"} style={styles.inputIcon} />
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholder={language === "vi" ? "Xác nhận mật khẩu" : "Confirm Password"}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Icon name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color={theme === "dark" ? "#aaa" : "#333"} />
                            </TouchableOpacity>
                        </View>

                        {confirmPassword.length > 0 && !passwordMatch && (
                            <Animatable.Text animation="shake" duration={500} style={styles.errorText}>
                                {language === "vi" ? "Mật khẩu không khớp" : "Passwords don't match"}
                            </Animatable.Text>
                        )}
                    </Animatable.View>

                    <Animatable.View animation="fadeInUp" duration={800} delay={800}>
                        <View style={[styles.passwordRules, theme === "dark" && styles.darkPasswordRules]}>
                            <Text style={[styles.rulesTitle, theme === "dark" && styles.darkSubText]}>
                                {language === "vi" ? "Yêu cầu mật khẩu:" : "Password requirements:"}
                            </Text>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={password.length >= 6 ? "check-circle" : "circle"}
                                    size={14}
                                    color={password.length >= 6 ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 6 ký tự" : "• At least 6 characters"}
                                </Text>
                            </View>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={/[A-Z]/.test(password) ? "check-circle" : "circle"}
                                    size={14}
                                    color={/[A-Z]/.test(password) ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 1 chữ hoa" : "• At least 1 uppercase letter"}
                                </Text>
                            </View>
                            <View style={styles.ruleItem}>
                                <Icon
                                    name={/[!@#$%^&*]/.test(password) ? "check-circle" : "circle"}
                                    size={14}
                                    color={/[!@#$%^&*]/.test(password) ? "#4CAF50" : (theme === "dark" ? "#777" : "#999")}
                                />
                                <Text style={[styles.ruleText, theme === "dark" && styles.darkSubText]}>
                                    {language === "vi" ? "• Ít nhất 1 ký tự đặc biệt" : "• At least 1 special character"}
                                </Text>
                            </View>
                        </View>
                    </Animatable.View>

                    <Animatable.View animation="fadeIn" duration={800} delay={900}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                loading && styles.buttonDisabled
                            ]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {language === "vi" ? "Đăng Ký" : "Register"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => navigation.navigate("Login")}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.loginLinkText, theme === "dark" && { color: "#8A7ADC" }]}>
                                {language === "vi" ? "Quay lại đăng nhập" : "Back to Login"}
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
        backgroundColor: "#f5f5f5",
    },
    darkContainer: {
        backgroundColor: "#121212",
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
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
    inputContainer: {
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
    darkInputContainer: {
        backgroundColor: "#2A2A2A",
        borderColor: "#444",
    },
    inputIcon: {
        marginLeft: 15,
    },
    input: {
        flex: 1,
        height: 55,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#333",
    },
    darkInput: {
        color: "#FFFFFF",
        backgroundColor: "transparent",
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
    darkPasswordContainer: {
        backgroundColor: "#2A2A2A",
        borderColor: "#444",
    },
    passwordInput: {
        flex: 1,
        height: 55,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    toggleButton: {
        padding: 15,
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
    darkPasswordRules: {
        backgroundColor: 'rgba(106, 90, 205, 0.15)',
        borderLeftColor: '#8A7ADC',
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
    loginLink: {
        alignItems: "center",
        paddingVertical: 12,
    },
    loginLinkText: {
        color: "#6A5ACD",
        fontSize: 16,
    }
});

export default RegisterScreen;
