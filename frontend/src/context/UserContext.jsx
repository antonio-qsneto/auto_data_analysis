// context/UserContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { getAccessToken } from "../utils/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const loadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await axiosInstance.get("/user/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []); // ✅ referência estável, sem dependências que mudam

  useEffect(() => {
    loadUser(); // chamado apenas 1 vez ao montar o contexto
  }, [loadUser]);

  return (
    <UserContext.Provider value={{ user, setUser, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};
