import { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { getAccessToken } from "../utils/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const loadUser = async () => {
    const token = getAccessToken();
    if (!token) return setUser(null);

    try {
      const res = await axiosInstance.get("/user/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};
