import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  googleId: string;
  email: string;
  name: string;
  roles: Role[];
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get<{
          success: boolean;
          message: string;
          user: User;
        }>("http://localhost:5000/dashboard", {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  const logout = async () => {
    try {
      // Call backend to log the user out
      await axios.get("http://localhost:5000/logout", { withCredentials: true });
  
      // After logging out, reset user state and redirect to the login page
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  

  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
