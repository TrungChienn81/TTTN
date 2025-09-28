import React from "react";
import ProductList from "../components/ProductList";

const API_URL = "http://10.0.2.2:3055/v1/api/product?page=1&limit=12&priceRange=0%2C10000000000&status=&category=67b87b044c53e8e91ac45129&searchText=";

const PantsScreen = () => {
  return <ProductList apiUrl={API_URL} />;
};

export default PantsScreen;
