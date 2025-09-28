import React from "react";
import ProductList from "../components/ProductList";

// URL cho danh mục Đầm
const API_DRESS_URL = "http://10.0.2.2:3055/v1/api/product?page=1&limit=12&priceRange=0%2C10000000000&status=&category=67b88373ece26a7c1401f954&searchText=";

const DressScreen = () => {
  return <ProductList apiUrl={API_DRESS_URL} />;
};

export default DressScreen;
