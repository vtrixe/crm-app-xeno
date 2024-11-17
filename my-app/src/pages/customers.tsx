import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: number;
  name: string;
  email: string;
  _count: {
    orders: number;
  };
}

const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const limit = 10; // Items per page
  const navigate = useNavigate();

  // Check if the user has access (roles 1, 2, 3, 4)
  const hasAccess = user?.roles.some(role => [1, 2, 3, 4].includes(role.id));

  // Fetch customers
  const fetchCustomers = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://crm-app-xeno-1.onrender.com/api/data-ingestion/customers?page=${page}&limit=${limit}`,
        { withCredentials: true }
      );

      setCustomers(response.data);
      setTotalPages(Math.ceil(response.data.length / limit)); // Assuming response contains total count
    } catch (error: any) {
      setError("Failed to fetch customers. Please try again later.");
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific customer's details by ID
  const fetchCustomerDetails = async (id: number) => {
    try {
      const response = await axios.get(
        `https://crm-app-xeno-1.onrender.com/api/data-ingestion/customers/${id}`,
        { withCredentials: true }
      );
      setCustomerDetails(response.data);
      setSelectedCustomer(response.data);  // Set selected customer details
      setIsModalOpen(true);  // Open the modal
    } catch (error: any) {
      alert("Failed to fetch customer details.");
    }
  };

  // Update customer details
  const updateCustomer = async (id: number) => {
    try {
      const updatedData = { ...customerDetails }; // Use the updated details
      await axios.put(
        `https://crm-app-xeno-1.onrender.com/api/data-ingestion/customers/${id}`,
        updatedData,
        { withCredentials: true }
      );
      alert("Customer updated successfully");
      setIsModalOpen(false); // Close the modal after update
      fetchCustomers(page); // Re-fetch customer list
    } catch (error: any) {
      alert("Failed to update customer.");
    }
  };

  // Delete customer
  const deleteCustomer = async (id: number) => {
    try {
      await axios.delete(`https://crm-app-xeno-1.onrender.com/api/data-ingestion/customers/${id}`, {
        withCredentials: true,
      });
      alert("Customer deleted successfully");
      fetchCustomers(page); // Re-fetch customer list
    } catch (error: any) {
      alert("Failed to delete customer.");
    }
  };

  // On page load, check if the user has access and fetch data
  useEffect(() => {
    if (hasAccess) {
      fetchCustomers(page);
    }
  }, [page, hasAccess]);

  // Pagination handlers
  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  if (!hasAccess) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">You do not have access to view customers</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Customers</h2>
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}

      {!loading && !error && customers.length > 0 && (
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Orders Count</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="py-2 px-4 border-b">{customer.id}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => fetchCustomerDetails(customer.id)}
                    className="text-blue-500 hover:underline"
                  >
                    {customer.name}
                  </button>
                </td>
                <td className="py-2 px-4 border-b">{customer.email}</td>
                <td className="py-2 px-4 border-b">{customer._count.orders}</td>
                <td className="py-2 px-4 border-b">
                  {user?.roles.some(role => [1, 2].includes(role.id)) && (
                    <button
                      onClick={() => fetchCustomerDetails(customer.id)}
                      className="text-yellow-500 hover:underline mr-4"
                    >
                      Edit
                    </button>
                  )}
                  {user?.roles.some(role => role.id === 1) && (
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={prevPage}
          disabled={page <= 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Previous
        </button>
        <p className="text-lg">{`Page ${page} of ${totalPages}`}</p>
        <button
          onClick={nextPage}
          disabled={page >= totalPages}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Next
        </button>
      </div>

      {/* Customer Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-4">Customer Details</h3>
            <div>
              <label className="block text-lg">Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={customerDetails.name}
                onChange={(e) =>
                  setCustomerDetails({ ...customerDetails, name: e.target.value })
                }
              />
            </div>
            <div className="mt-4">
              <label className="block text-lg">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={customerDetails.email}
                onChange={(e) =>
                  setCustomerDetails({ ...customerDetails, email: e.target.value })
                }
              />
            </div>
            <div className="mt-4">
              <label className="block text-lg">Phone</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={customerDetails.phone}
                onChange={(e) =>
                  setCustomerDetails({ ...customerDetails, phone: e.target.value })
                }
              />
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => updateCustomer(selectedCustomer.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Update
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
