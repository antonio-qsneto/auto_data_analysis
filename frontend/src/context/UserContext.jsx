// context/UserContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { hasValidSession } from "../utils/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const loadUser = useCallback(async () => {
    if (!hasValidSession()) {
      setUser(null);
      return;
    }

    try {
      const res = await axiosInstance.get("/user/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadUser(); 
  }, [loadUser]);

  return (
    <UserContext.Provider value={{ user, setUser, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};
