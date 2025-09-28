import React from "react";
import ProductList from "../components/ProductList";

// URL cho danh mục Giày
const API_SHOES_URL = "http://10.0.2.2:3055/v1/api/product?page=1&limit=6&priceRange=0%2C10000000000&status=&category=67b93c8c722783a60c162f3e&searchText=";

const ShoesScreen = () => {
  return <ProductList apiUrl={API_SHOES_URL} />;
};

export default ShoesScreen;
