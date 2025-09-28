import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    TextInput,
    Alert,
    SafeAreaView,
    ActivityIndicator
} from "react-native";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import Icon from "react-native-vector-icons/FontAwesome5";
import * as Animatable from 'react-native-animatable';

const CartScreen = ({ navigation }) => {
    const { cartItems, removeFromCart, clearCart, updateQuantity } = useCart();
    const { language, theme } = useSettings();
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState({}); // Track image loading errors

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            Alert.alert(
                language === "vi" ? "Giỏ hàng trống" : "Empty Cart",
                language === "vi" ? "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán." : "Please add items to your cart before checkout."
            );
            return;
        }

        setCheckingOut(true);

        // Using simple navigation since PaymentScreen is now in the same stack
        setTimeout(() => {
            setCheckingOut(false);
            navigation.navigate('PaymentScreen', {
                totalAmount: calculateTotal(),
                cartItems: cartItems
            });
        }, 500);
    };

    // Image error handling
    const handleImageError = (itemId) => {
        setImageLoadErrors(prev => ({
            ...prev,
            [itemId]: true
        }));
    };

    const applyPromoCode = () => {
        if (!promoCode.trim()) {
            Alert.alert(
                language === "vi" ? "Lỗi" : "Error",
                language === "vi" ? "Vui lòng nhập mã giảm giá" : "Please enter a promo code"
            );
            return;
        }

        setIsApplyingPromo(true);
        // Simulate API call delay
        setTimeout(() => {
            if (promoCode.toUpperCase() === "DISCOUNT10") {
                setDiscount(0.1); // 10% discount
                Alert.alert(
                    language === "vi" ? "Mã Khuyến Mãi Đã Được Áp Dụng" : "Promo Code Applied",
                    language === "vi" ? "Bạn đã nhận được giảm giá 10%." : "You have received a 10% discount."
                );
            } else if (promoCode.toUpperCase() === "SUPER20") {
                setDiscount(0.2); // 20% discount
                Alert.alert(
                    language === "vi" ? "Mã Khuyến Mãi Đã Được Áp Dụng" : "Promo Code Applied",
                    language === "vi" ? "Bạn đã nhận được giảm giá 20%." : "You have received a 20% discount."
                );
            } else {
                Alert.alert(
                    language === "vi" ? "Mã Khuyến Mãi Không Hợp Lệ" : "Invalid Promo Code",
                    language === "vi" ? "Mã khuyến mãi bạn nhập không hợp lệ." : "The promo code you entered is not valid."
                );
            }
            setIsApplyingPromo(false);
        }, 800);
    };

    const calculateTotal = () => {
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return subtotal - subtotal * discount;
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const calculateDiscountAmount = () => {
        const subtotal = calculateSubtotal();
        return subtotal * discount;
    };

    const handleRemoveItem = (itemId) => {
        Alert.alert(
            language === "vi" ? "Xóa Sản Phẩm" : "Remove Item",
            language === "vi" ? "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?" : "Are you sure you want to remove this item from your cart?",
            [
                {
                    text: language === "vi" ? "Hủy" : "Cancel",
                    style: "cancel"
                },
                {
                    text: language === "vi" ? "Xóa" : "Remove",
                    onPress: () => removeFromCart(itemId),
                    style: "destructive"
                }
            ]
        );
    };

    const handleClearCart = () => {
        if (cartItems.length === 0) return;

        Alert.alert(
            language === "vi" ? "Xóa Giỏ Hàng" : "Clear Cart",
            language === "vi" ? "Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?" : "Are you sure you want to remove all items from your cart?",
            [
                {
                    text: language === "vi" ? "Hủy" : "Cancel",
                    style: "cancel"
                },
                {
                    text: language === "vi" ? "Xóa" : "Clear",
                    onPress: () => clearCart(),
                    style: "destructive"
                }
            ]
        );
    };

    // Modify this function to handle quantity changes
    const handleQuantityChange = (id, newQuantity) => {
        // If attempting to decrement when quantity is 1, confirm removal
        if (newQuantity < 1) {
            Alert.alert(
                language === "vi" ? "Xóa Sản Phẩm" : "Remove Item",
                language === "vi" ? "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?" : "Are you sure you want to remove this item from your cart?",
                [
                    {
                        text: language === "vi" ? "Hủy" : "Cancel",
                        style: "cancel"
                    },
                    {
                        text: language === "vi" ? "Xóa" : "Remove",
                        onPress: () => removeFromCart(id),
                        style: "destructive"
                    }
                ]
            );
        } else {
            // If incrementing or decrementing to quantity > 1, just update
            updateQuantity(id, newQuantity);
        }
    };

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={[
                styles.container,
                theme === "dark" && styles.darkContainer
            ]}>
                <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
                    <Animatable.View animation="pulse" iterationCount="infinite" iterationDelay={1000}>
                        <Icon
                            name="shopping-cart"
                            size={80}
                            color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"}
                            style={{ opacity: 0.7 }}
                        />
                    </Animatable.View>
                    <Animatable.Text
                        animation="fadeIn"
                        delay={300}
                        style={[
                            styles.emptyText,
                            theme === "dark" && styles.darkText
                        ]}
                    >
                        {language === "vi" ? "Giỏ hàng của bạn đang trống" : "Your cart is empty"}
                    </Animatable.Text>
                    <Animatable.View animation="fadeInUp" delay={600}>
                        <TouchableOpacity
                            style={styles.continueShoppingButton}
                            onPress={() => navigation.navigate("HomeStack", { screen: "HomeScreen" })}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.continueShoppingText}>
                                {language === "vi" ? "Tiếp tục mua sắm" : "Continue Shopping"}
                            </Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </Animatable.View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[
            styles.container,
            theme === "dark" && styles.darkContainer
        ]}>
            <Animatable.View animation="fadeIn" duration={500} style={styles.headerContainer}>
                <Text style={[
                    styles.headerTitle,
                    theme === "dark" && styles.darkText
                ]}>
                    {language === "vi" ? "Giỏ Hàng" : "My Cart"}
                    <Text style={styles.itemCount}> ({cartItems.length})</Text>
                </Text>
                <TouchableOpacity onPress={handleClearCart}>
                    <Text style={[
                        styles.clearCartText,
                        theme === "dark" && { color: "#8A7ADC" }
                    ]}>
                        {language === "vi" ? "Xóa Tất Cả" : "Clear All"}
                    </Text>
                </TouchableOpacity>
            </Animatable.View>

            <FlatList
                data={cartItems}
                keyExtractor={(item, index) => `${item._id}_${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item, index }) => (
                    <Animatable.View
                        animation="fadeInUp"
                        delay={index * 100}
                        style={[
                            styles.cartItem,
                            theme === "dark" && styles.darkCartItem
                        ]}
                    >
                        {imageLoadErrors[item._id] ? (
                            <View style={[styles.image, styles.placeholderContainer]}>
                                <Icon
                                    name="image"
                                    size={30}
                                    color={theme === "dark" ? "#444" : "#ccc"}
                                />
                            </View>
                        ) : (
                            <Image
                                source={{ uri: `http://10.0.2.2:3055${item.img}` }}
                                style={styles.image}
                                onError={() => handleImageError(item._id)}
                            />
                        )}

                        <View style={styles.itemDetails}>
                            <View style={styles.itemInfo}>
                                <Text style={[
                                    styles.itemTitle,
                                    theme === "dark" && styles.darkText
                                ]} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                <Text style={[
                                    styles.itemSubInfo,
                                    theme === "dark" && styles.darkSubText
                                ]}>
                                    {language === "vi" ? "Màu:" : "Color:"} {item.color}
                                </Text>
                                <Text style={[
                                    styles.itemSubInfo,
                                    theme === "dark" && styles.darkSubText
                                ]}>
                                    {language === "vi" ? "Kích cỡ:" : "Size:"} {item.size}
                                </Text>
                                <Text style={styles.itemPrice}>
                                    {item.price?.toLocaleString()} đ
                                </Text>
                            </View>

                            <View style={styles.itemActions}>
                                <View style={styles.quantityContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.quantityButton,
                                            theme === "dark" && styles.darkQuantityButton
                                        ]}
                                        onPress={() => handleQuantityChange(item._id, item.quantity - 1)}
                                    >
                                        <Icon
                                            name="minus"
                                            size={14}
                                            color={theme === "dark" ? "#FFF" : "#333"}
                                        />
                                    </TouchableOpacity>
                                    <Text style={[
                                        styles.quantityText,
                                        theme === "dark" && styles.darkText
                                    ]}>
                                        {item.quantity}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.quantityButton,
                                            theme === "dark" && styles.darkQuantityButton
                                        ]}
                                        onPress={() => handleQuantityChange(item._id, item.quantity + 1)}
                                    >
                                        <Icon name="plus" size={14} color={theme === "dark" ? "#FFF" : "#333"} />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveItem(item._id)}
                                >
                                    <Icon name="trash-alt" size={16} color="#FF6347" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animatable.View>
                )}
            />

            <Animatable.View animation="fadeInUp" duration={800} delay={300}>
                <View style={[
                    styles.summaryContainer,
                    theme === "dark" && styles.darkSummaryContainer
                ]}>
                    <Text style={[
                        styles.summaryTitle,
                        theme === "dark" && styles.darkText
                    ]}>
                        {language === "vi" ? "Thông Tin Đơn Hàng" : "Order Information"}
                    </Text>

                    <View style={styles.promoContainer}>
                        <View style={[
                            styles.promoInputContainer,
                            theme === "dark" && styles.darkPromoInputContainer
                        ]}>
                            <Icon
                                name="ticket-alt"
                                size={16}
                                color={theme === "dark" ? "#8A7ADC" : "#6A5ACD"}
                                style={styles.promoIcon}
                            />
                            <TextInput
                                style={[
                                    styles.promoInput,
                                    theme === "dark" && styles.darkInput
                                ]}
                                placeholder={language === "vi" ? "Nhập mã giảm giá" : "Enter promo code"}
                                placeholderTextColor={theme === "dark" ? "#777" : "#999"}
                                value={promoCode}
                                onChangeText={setPromoCode}
                            />
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.promoButton,
                                isApplyingPromo && styles.disabledPromoButton
                            ]}
                            onPress={applyPromoCode}
                            disabled={isApplyingPromo}
                        >
                            {isApplyingPromo ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.promoButtonText}>
                                    {language === "vi" ? "Áp Dụng" : "Apply"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.summaryLine}>
                        <Text style={[
                            styles.summaryText,
                            theme === "dark" && styles.darkSubText
                        ]}>
                            {language === "vi" ? "Tạm tính:" : "Subtotal:"}
                        </Text>
                        <Text style={[
                            styles.summaryValue,
                            theme === "dark" && styles.darkText
                        ]}>
                            {calculateSubtotal().toLocaleString()} đ
                        </Text>
                    </View>

                    <View style={styles.summaryLine}>
                        <Text style={[
                            styles.summaryText,
                            theme === "dark" && styles.darkSubText
                        ]}>
                            {language === "vi" ? "Phí vận chuyển:" : "Shipping:"}
                        </Text>
                        <Text style={[
                            styles.summaryValue,
                            theme === "dark" && styles.darkText
                        ]}>
                            {language === "vi" ? "Miễn phí" : "Free"}
                        </Text>
                    </View>

                    {discount > 0 && (
                        <View style={styles.summaryLine}>
                            <Text style={[
                                styles.summaryText,
                                theme === "dark" && styles.darkSubText
                            ]}>
                                {language === "vi" ? "Giảm giá:" : "Discount:"}
                            </Text>
                            <Text style={styles.discountValue}>
                                -{calculateDiscountAmount().toLocaleString()} đ
                            </Text>
                        </View>
                    )}

                    <View style={styles.totalLine}>
                        <Text style={[
                            styles.totalText,
                            theme === "dark" && styles.darkText
                        ]}>
                            {language === "vi" ? "Tổng cộng:" : "Total:"}
                        </Text>
                        <Text style={styles.totalValue}>
                            {calculateTotal().toLocaleString()} đ
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.checkoutButton,
                            checkingOut && styles.disabledButton
                        ]}
                        onPress={handleCheckout}
                        disabled={checkingOut || cartItems.length === 0}
                        activeOpacity={0.7}
                    >
                        {checkingOut ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Text style={styles.checkoutButtonText}>
                                    {language === "vi" ? "Thanh Toán" : "Checkout"}
                                </Text>
                                <Icon name="arrow-right" size={16} color="#FFF" style={{ marginLeft: 10 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Animatable.View>
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
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
    },
    itemCount: {
        color: "#6A5ACD",
        fontWeight: "bold",
    },
    clearCartText: {
        color: "#6A5ACD",
        fontWeight: "500",
    },
    darkText: {
        color: "#FFFFFF",
    },
    darkSubText: {
        color: "#AAAAAA",
    },
    listContainer: {
        padding: 10,
        paddingBottom: 20,
    },
    cartItem: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 15,
        overflow: "hidden",
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    darkCartItem: {
        backgroundColor: "#2A2A2A",
        borderColor: "#444",
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: "cover",
    },
    placeholderContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0'
    },
    itemDetails: {
        flex: 1,
        padding: 12,
        flexDirection: "row",
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    itemSubInfo: {
        fontSize: 14,
        color: "#777",
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#6A5ACD",
        marginTop: 4,
    },
    itemActions: {
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        backgroundColor: "#F0F0F0",
        borderRadius: 20,
        overflow: "hidden",
    },
    darkQuantityButton: {
        backgroundColor: "#444",
    },
    quantityButton: {
        backgroundColor: "#E0E0E0",
        width: 28,
        height: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        paddingHorizontal: 12,
        fontSize: 16,
    },
    removeButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: "500",
        marginTop: 20,
        marginBottom: 30,
        color: "#555",
        textAlign: "center",
    },
    continueShoppingButton: {
        backgroundColor: "#6A5ACD",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: "#6A5ACD",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    continueShoppingText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    summaryContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    darkSummaryContainer: {
        backgroundColor: "#2A2A2A",
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },
    promoContainer: {
        flexDirection: "row",
        marginBottom: 20,
    },
    promoInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        paddingHorizontal: 10,
        marginRight: 12,
        backgroundColor: "#F9F9F9",
    },
    darkPromoInputContainer: {
        borderColor: "#444",
        backgroundColor: "#333",
    },
    promoIcon: {
        marginRight: 10,
    },
    promoInput: {
        flex: 1,
        height: 48,
        color: "#333",
    },
    darkInput: {
        color: "#FFFFFF",
    },
    promoButton: {
        backgroundColor: "#6A5ACD",
        height: 48,
        paddingHorizontal: 18,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
    disabledPromoButton: {
        backgroundColor: "#9D99BC",
    },
    promoButtonText: {
        color: "#FFF",
        fontWeight: "600",
    },
    summaryLine: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 15,
        color: "#666",
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: "500",
    },
    discountValue: {
        fontSize: 15,
        fontWeight: "500",
        color: "#4CAF50",
    },
    totalLine: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#EEE",
        marginTop: 10,
        paddingTop: 15,
        marginBottom: 20,
    },
    totalText: {
        fontSize: 18,
        fontWeight: "600",
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6A5ACD",
    },
    checkoutButton: {
        backgroundColor: "#6A5ACD",
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#6A5ACD",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: "#9D99BC",
        opacity: 0.5,
    },
    checkoutButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default CartScreen;
