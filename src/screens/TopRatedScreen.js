// src/screens/TopRatedScreen.js
import React from "react";
import ProductList from "../components/ProductList";

const API_URL = "http://10.0.2.2:3055/v1/api/product-top-rate";

const TopRatedScreen = () => {
  return <ProductList apiUrl={API_URL} />;
};

export default TopRatedScreen;
