import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const SearchScreen = ({ route }) => {
  const { query: initialQuery } = route.params || {};
  const [query, setQuery] = useState(initialQuery || "");
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { theme, language } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const page = 1;
  const limit = 10;

  const handleSearch = () => {
    if (query.trim()) {
      setSearchQuery(query);
      setLoading(true);
    }
  };

  useEffect(() => {
    if (!searchQuery) return;

    const searchUrl = `http://10.0.2.2:3055/v1/api/product?page=${page}&limit=${limit}&searchText=${searchQuery}`;
    console.log("Fetching:", searchUrl);
    
    fetch(searchUrl)
      .then((res) => res.json())
      .then((data) => {
        console.log("API response:", data);
        if (data.status === 200 && data.data && Array.isArray(data.data.data)) {
          setProducts(data.data.data);
        } else {
          console.error("API returned unexpected format", data);
          setProducts([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [searchQuery]);

  // Kiểm tra xem sản phẩm có hết hàng không
  const isOutOfStock = (product) => {
    if (!product.sizes || product.sizes.length === 0) return false;
    return product.sizes.every(size => size.quantity === 0);
  };

  // Xử lý URL hình ảnh
  const getImageUrl = (imgUrl) => {
    if (!imgUrl) return "";
    
    if (imgUrl.startsWith('http')) {
      return imgUrl;
    } else {
      return `http://10.0.2.2:3055${imgUrl}`;
    }
  };

  const renderItem = ({ item }) => {
    if (!item || typeof item !== "object") return null;
    
    const outOfStock = isOutOfStock(item);
    let imageSource = { uri: getImageUrl(item.img) };
    
    return (
      <View style={[styles.productContainer, theme === "dark" && styles.darkProductContainer]}>
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.productImage}
            resizeMode="cover"
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
            onPress={() => navigation.navigate('Main', {
              screen: 'HomeStack',
              params: {
                screen: 'ProductDetail',
                params: { product: item }
              }
            })}
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
    <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, theme === "dark" && styles.darkInput]}
          placeholder={language === "vi" ? "Tìm kiếm..." : "Search..."}
          placeholderTextColor={theme === "dark" ? "#aaa" : "#999"}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {products.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search-off" size={50} color="#ccc" />
              <Text style={styles.noResultsText}>Không tìm thấy sản phẩm nào</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              contentContainerStyle={styles.flatListContent}
              renderItem={renderItem}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8F9FA",
      padding: 16,
    },
    darkContainer: {
      backgroundColor: "#121212",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    searchInput: {
      flex: 1,
      height: 46,
      backgroundColor: "#fff",
      borderRadius: 23,
      paddingHorizontal: 20,
      fontSize: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    darkInput: {
      backgroundColor: "#2A2A2A",
      color: "#fff",
    },
    searchButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#6A5ACD",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    noResultsContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    noResultsText: {
      fontSize: 16,
      color: "#666",
      marginTop: 10,
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
      color: "#FF4081",
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
  });
  

export default SearchScreen;
