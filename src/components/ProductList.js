import React, { useEffect, useState } from "react";
import {
  FlatList,
  ActivityIndicator,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { StarRatingDisplay } from 'react-native-star-rating-widget';

const ProductList = ({ apiUrl, products: initialProducts }) => {
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { theme, language } = useSettings();
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Nếu products được truyền trực tiếp, sử dụng nó
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Đang gọi API:", apiUrl);
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Dữ liệu API:", JSON.stringify(data, null, 2));

        if (data.status === 200) {
          // Xử lý cho cả hai loại endpoint
          if (Array.isArray(data.data)) {
            console.log("Dữ liệu là mảng trực tiếp");
            setProducts(data.data);
          } else if (data.data && Array.isArray(data.data.data)) {
            console.log("Dữ liệu nằm trong data.data");
            setProducts(data.data.data);
          } else {
            console.log("Không tìm thấy dữ liệu sản phẩm");
            setProducts([]);
            setError("Không có sản phẩm nào.");
          }
        } else {
          console.log("API trả về lỗi:", data.status);
          setError("Không có sản phẩm nào.");
        }
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (apiUrl) {
      fetchData();
    }
  }, [apiUrl, initialProducts]);

  // Kiểm tra xem sản phẩm có hết hàng không
  const isOutOfStock = (product) => {
    if (!product.sizes || product.sizes.length === 0) return false;

    // Kiểm tra xem tất cả các size đều có số lượng = 0
    return product.sizes.every(size => size.quantity === 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    if (!item || typeof item !== "object") return null;

    // Xử lý URL ảnh
    let imageSource;
    if (item.img) {
      // Kiểm tra xem img có phải là URL đầy đủ không
      if (item.img.startsWith('http')) {
        imageSource = { uri: item.img };
      } else {
        // Nếu không phải URL đầy đủ, thêm domain vào
        imageSource = { uri: `http://10.0.2.2:3055${item.img}` };
      }
    } else if (item.image) {
      // Một số API có thể sử dụng trường "image" thay vì "img"
      imageSource = { uri: item.image };
    } else {
      // Thay vì sử dụng ảnh mặc định, sử dụng một màu nền
      imageSource = { uri: 'https://via.placeholder.com/150' };
    }

    const outOfStock = isOutOfStock(item);

    return (
      <View style={[styles.productContainer, theme === "dark" && styles.darkProductContainer]}>
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.productImage}
            resizeMode="cover"
            onError={(e) => {
              console.log("Lỗi tải ảnh:", item.title, item.img || item.image);
            }}
          />

          {outOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Hết hàng</Text>
            </View>
          )}
        </View>

        <Text style={[styles.productTitle, theme === "dark" && styles.darkText]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.productPrice}>
          {item.price?.toLocaleString()} đ
        </Text>
        {/* Thêm phần rating */}
        <View style={styles.ratingContainer}>
          <StarRatingDisplay
            rating={item.avgReview || 0}
            color="#FFD700"
            emptyColor="#ddd"
            starSize={14}
            maxStars={5}
          />
          {item.avgReview > 0 && (
            <Text style={styles.ratingText}>{item.avgReview}</Text>
          )}
        </View>


        <View style={styles.sizeContainer}>
          {Array.isArray(item.sizes) && item.sizes.length > 0 ? (
            item.sizes.map((sizeObj, index) => (
              <View key={index} style={[
                styles.sizeTag,
                sizeObj.quantity === 0 && styles.outOfStockSizeTag
              ]}>
                {sizeObj.quantity === 0 ? (
                  <View style={styles.crossLine}></View>
                ) : null}
                <Text style={[
                  styles.sizeText,
                  sizeObj.quantity === 0 && styles.outOfStockSizeText
                ]}>
                  {sizeObj.size}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noSizeText}>
              Không có size
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("ProductDetail", { product: item })}
          >
            <Text style={styles.buttonText}>
              {language === "vi" ? "Xem chi tiết" : "View Details"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, outOfStock && styles.disabledButton]}
            onPress={() => !outOfStock && addToCart(item)}
            disabled={outOfStock}
          >
            <Text style={styles.buttonText}>
              {language === "vi" ? "Thêm vào giỏ" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item, index) =>
        item._id ? `${item._id}_${index}` : `${index}`
      }
      numColumns={2}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      contentContainerStyle={styles.flatListContent}
      renderItem={renderItem}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  productContainer: {
    width: "47%",
    height: 340,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 6,
    padding: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkProductContainer: {
    backgroundColor: "#444",
  },
  imageContainer: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  outOfStockBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#FF4040",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
  darkText: {
    color: "#fff",
  },
  productPrice: {
    fontSize: 14,
    color: "#FF4081", // Thay đổi từ "green" sang "#FF4081"
    marginVertical: 5,
    textAlign: "center",
  },

  sizeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 5,
  },
  sizeTag: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  outOfStockSizeTag: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    position: "relative",
  },
  outOfStockSizeText: {
    color: "#999",
  },
  crossLine: {
    position: "absolute",
    width: "130%",
    height: 1,
    backgroundColor: "#999",
    transform: [{ rotate: "45deg" }],
  },
  noSizeText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  button: {
    flex: 1,
    paddingVertical: 5,
    backgroundColor: "#007AFF",
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 3,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default ProductList;
