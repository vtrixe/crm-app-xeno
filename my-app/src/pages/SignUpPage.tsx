import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Signup: React.FC = () => {
  const { login } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", { credentials: "include" });
        if (response.ok) {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Not authenticated, continue on signup page.");
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-semibold text-center mb-4">Signup</h2>
        <button
          onClick={login}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign up with Google
        </button>
      </div>
    </div>
  );
};

export default Signup;
