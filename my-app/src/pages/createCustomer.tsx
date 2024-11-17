import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  totalSpending: number;
  visits: number;
}

const CreateCustomer: React.FC = () => {
  const { user } = useAuth();
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [customerData, setCustomerData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    totalSpending: 0,
    visits: 0,
  });

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle number inputs
    if (name === 'totalSpending' || name === 'visits') {
      const numValue = parseFloat(value);
      setCustomerData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    }
    // Handle phone validation
    else if (name === 'phone') {
      setCustomerData(prev => ({ ...prev, [name]: value }));
      if (value && !validatePhone(value)) {
        setErrors(prev => ({
          ...prev,
          phone: "Phone number must start with + followed by 1-14 digits"
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    }
    // Handle other string inputs
    else {
      setCustomerData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    const validationErrors: Partial<Record<keyof CustomerFormData, string>> = {};
    
    if (!customerData.name) {
      validationErrors.name = "Name is required";
    }
    
    if (!customerData.email) {
      validationErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      validationErrors.email = "Invalid email format";
    }
    
    if (customerData.phone && !validatePhone(customerData.phone)) {
      validationErrors.phone = "Invalid phone number format";
    }
    
    if (customerData.totalSpending < 0) {
      validationErrors.totalSpending = "Total spending cannot be negative";
    }
    
    if (customerData.visits < 0) {
      validationErrors.visits = "Visits cannot be negative";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await axios.post(
        "https://crm-app-xeno-1.onrender.com/api/data-ingestion/customers",
        {
          ...customerData,
          totalSpending: Number(customerData.totalSpending),
          visits: Number(customerData.visits),
        },
        { withCredentials: true }
      );
      alert(response.data.message);
      // Reset form after successful submission
      setCustomerData({
        name: "",
        email: "",
        phone: "",
        totalSpending: 0,
        visits: 0,
      });
      setErrors({});
    } catch (error: any) {
      if (error.response?.data?.error) {
        alert(JSON.stringify(error.response.data.error, null, 2));
      } else {
        alert("Failed to create customer");
      }
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
          <label className="block text-lg font-medium text-gray-700" htmlFor="name">
            Customer Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={customerData.name}
            onChange={handleChange}
            placeholder="Enter customer name"
            className={`w-full p-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="email">
            Customer Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={customerData.email}
            onChange={handleChange}
            placeholder="Enter customer email"
            className={`w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="phone">
            Customer Phone
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            value={customerData.phone}
            onChange={handleChange}
            placeholder="Enter phone number (e.g., +919876543210)"
            className={`w-full p-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="totalSpending">
            Total Spending
          </label>
          <input
            type="number"
            name="totalSpending"
            id="totalSpending"
            value={customerData.totalSpending}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full p-3 border ${errors.totalSpending ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.totalSpending && <p className="mt-1 text-sm text-red-600">{errors.totalSpending}</p>}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700" htmlFor="visits">
            Total Visits
          </label>
          <input
            type="number"
            name="visits"
            id="visits"
            value={customerData.visits}
            onChange={handleChange}
            min="0"
            step="1"
            className={`w-full p-3 border ${errors.visits ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.visits && <p className="mt-1 text-sm text-red-600">{errors.visits}</p>}
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