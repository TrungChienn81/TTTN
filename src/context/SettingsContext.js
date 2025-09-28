import React, { createContext, useState, useContext } from "react";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [language, setLanguage] = useState("vi");
    const [theme, setTheme] = useState("light");

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    const changeLanguage = (lang) => {
        setLanguage(lang);
    };

    return (
        <SettingsContext.Provider value={{ language, theme, toggleTheme, changeLanguage }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
