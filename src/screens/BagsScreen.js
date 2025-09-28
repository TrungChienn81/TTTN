import React from "react";
import ProductList from "../components/ProductList";

// URL cho danh mục Túi đeo
const API_BAGS_URL = "http://10.0.2.2:3055/v1/api/product?page=1&limit=6&priceRange=0%2C10000000000&status=&category=67b93e2d722783a60c163466&searchText=";

const BagsScreen = () => {
  return <ProductList apiUrl={API_BAGS_URL} />;
};

export default BagsScreen;
