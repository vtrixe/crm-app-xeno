import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const CreateCustomer: React.FC = () => {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    totalSpending: 0,
    visits: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/data-ingestion/customers",
        customerData,
        { withCredentials: true }
      );
      alert(response.data.message);
    } catch (error) {
      alert("Failed to create customer");
    }
  };

  // Check if the user has a role of Admin (roleId: 1) or Manager (roleId: 2)
  const hasAccess = user?.roles.some(role => role.id === 1 || role.id === 2);

  if (!hasAccess) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">You do not have access to create a customer</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Create Customer</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="name">Customer Name</label>
          <input
            type="text"
            name="name"
            id="name"
            value={customerData.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="email">Customer Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={customerData.email}
            onChange={handleChange}
            placeholder="Enter customer email"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="phone">Customer Phone</label>
          <input
            type="text"
            name="phone"
            id="phone"
            value={customerData.phone}
            onChange={handleChange}
            placeholder="Enter customer phone number"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="totalSpending">Total Spending</label>
          <input
            type="number"
            name="totalSpending"
            id="totalSpending"
            value={customerData.totalSpending}
            onChange={handleChange}
            placeholder="Enter total spending"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="visits">Total Visits</label>
          <input
            type="number"
            name="visits"
            id="visits"
            value={customerData.visits}
            onChange={handleChange}
            placeholder="Enter number of visits"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
        >
          Create Customer
        </button>
      </form>
    </div>
  );
};

export default CreateCustomer;
