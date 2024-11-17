import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const { login } = useAuth();

  useEffect(() => {
    // Check if the user is already logged in and redirect them
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", { credentials: "include" });
        if (response.ok) {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Not authenticated, continue on login page.");
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
        <button
          onClick={login}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
