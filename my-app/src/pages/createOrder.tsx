import React, { useState, ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

interface OrderData {
  customerId: number;
  amount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

const CreateOrder: React.FC = () => {
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<OrderData>({
    customerId: 0,
    amount: 0,
    status: "PENDING",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: e.target.type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure the data types match the schema
      const payload: OrderData = {
        customerId: Number(orderData.customerId),
        amount: Number(orderData.amount),
        status: orderData.status as "PENDING" | "COMPLETED" | "CANCELLED",
      };

      const response = await axios.post(
        "https://crm-app-xeno-1.onrender.com/api/data-ingestion/orders",
        payload,
        { withCredentials: true }
      );
      alert(response.data.message);
      
      // Reset form after successful submission
      setOrderData({
        customerId: 0,
        amount: 0,
        status: "PENDING",
      });
    } catch (error: any) {
      if (error.response?.data?.error) {
        // Display the validation error from the backend
        alert(`Failed to create order: ${JSON.stringify(error.response.data.error)}`);
      } else {
        alert("Failed to create order");
      }
      console.error("Error creating order:", error);
    }
  };

  // Check if the user has a role of Admin (roleId: 1) or Manager (roleId: 2)
  const hasAccess = user?.roles.some(role => role.id === 1 || role.id === 2);

  if (!hasAccess) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">You do not have access to create an order</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Create Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="customerId">
            Customer ID
          </label>
          <input
            type="number"
            name="customerId"
            id="customerId"
            value={orderData.customerId}
            onChange={handleChange}
            placeholder="Enter customer ID"
            min="1"
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="amount">
            Order Amount
          </label>
          <input
            type="number"
            name="amount"
            id="amount"
            value={orderData.amount}
            onChange={handleChange}
            placeholder="Enter order amount"
            min="0"
            step="0.01"
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="status">
            Order Status
          </label>
          <select
            name="status"
            id="status"
            value={orderData.status}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-300"
        >
          Create Order
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;