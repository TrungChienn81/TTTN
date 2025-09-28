import React from "react";
import ProductList from "../components/ProductList";

const API_SHIRTS_URL = "http://10.0.2.2:3055/v1/api/product?page=1&limit=12&priceRange=0%2C10000000000&status=&category=67b87add4c53e8e91ac4511c&searchText=";

const ShirtsScreen = () => {
  return <ProductList apiUrl={API_SHIRTS_URL} />;
};

export default ShirtsScreen;
