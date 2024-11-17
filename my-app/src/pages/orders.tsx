import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// Define the validation schema for orders
const orderSchema = z.object({
  customerId: z.number().int().min(1, 'Customer ID is required'),
  amount: z.number().min(0, 'Amount should be a positive number'), // Ensure amount is positive
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).refine((val) => ['PENDING', 'COMPLETED', 'CANCELLED'].includes(val), {
    message: 'Invalid order status',
  }),
});

interface Order {
  id: number;
  customerId: number;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState({
    customerId: 1,
    amount: 0,
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED',
  });

  const limit = 10; // Items per page
  const navigate = useNavigate();

  // Check if the user has access (roles 1, 2, 3, 4)
  const hasAccess = user?.roles.some(role => [1, 2, 3, 4].includes(role.id));

  // Fetch orders
  const fetchOrders = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://crm-app-xeno-1.onrender.com/api/data-ingestion/orders?page=${page}&limit=${limit}`,
        { withCredentials: true }
      );

      setOrders(response.data);
      setTotalPages(Math.ceil(response.data.length / limit)); // Assuming response contains total count
    } catch (error: any) {
      setError("Failed to fetch orders. Please try again later.");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific order's details by ID
  const fetchOrderDetails = async (id: number) => {
    try {
      const response = await axios.get(
        `https://crm-app-xeno-1.onrender.com/api/data-ingestion/orders/${id}`,
        { withCredentials: true }
      );
      setOrderDetails(response.data);
      setSelectedOrder(response.data);  // Set selected order details
      setIsModalOpen(true);  // Open the modal
    } catch (error: any) {
      alert("Failed to fetch order details.");
    }
  };

  // Update order details
  const updateOrder = async (id: number) => {
    try {
      // Validate order data using schema
      orderSchema.parse(orderDetails);  // Will throw if invalid

      await axios.put(
        `https://crm-app-xeno-1.onrender.com/api/data-ingestion/orders/${id}`,
        orderDetails,
        { withCredentials: true }
      );
      alert("Order updated successfully");
      setIsModalOpen(false); // Close the modal after update
      fetchOrders(page); // Re-fetch order list
    } catch (error: any) {
      alert("Failed to update order.");
      console.error("Error updating order:", error);
    }
  };

  // Delete order
  const deleteOrder = async (id: number) => {
    try {
      await axios.delete(`https://crm-app-xeno-1.onrender.com/api/data-ingestion/orders/${id}`, {
        withCredentials: true,
      });
      alert("Order deleted successfully");
      fetchOrders(page); // Re-fetch order list
    } catch (error: any) {
      alert("Failed to delete order.");
    }
  };

  // On page load, check if the user has access and fetch data
  useEffect(() => {
    if (hasAccess) {
      fetchOrders(page);
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
        <p className="text-xl text-red-600">You do not have access to view orders</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Orders</h2>
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}

      {!loading && !error && orders.length > 0 && (
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Customer ID</th>
              <th className="py-2 px-4 border-b">Amount</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-2 px-4 border-b">{order.id}</td>
                <td className="py-2 px-4 border-b">{order.customerId}</td>
                <td className="py-2 px-4 border-b">${order.amount}</td>
                <td className="py-2 px-4 border-b">{order.status}</td>
                <td className="py-2 px-4 border-b">
                  {user?.roles.some(role => [1, 2].includes(role.id)) && (
                    <button
                      onClick={() => fetchOrderDetails(order.id)}
                      className="text-yellow-500 hover:underline mr-4"
                    >
                      Edit
                    </button>
                  )}
                  {user?.roles.some(role => role.id === 1) && (
                    <button
                      onClick={() => deleteOrder(order.id)}
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

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-4">Order Details</h3>
            <div>
              <label className="block text-lg">Customer ID</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={orderDetails.customerId}
                onChange={(e) =>
                  setOrderDetails({ ...orderDetails, customerId: Number(e.target.value) })
                }
              />
            </div>
            <div className="mt-4">
              <label className="block text-lg">Amount</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={orderDetails.amount}
                onChange={(e) =>
                  setOrderDetails({ ...orderDetails, amount: Number(e.target.value) })
                }
              />
            </div>
            <div className="mt-4">
              <label className="block text-lg">Status</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={orderDetails.status}
                onChange={(e) =>
                  setOrderDetails({ ...orderDetails, status: e.target.value as 'PENDING' | 'COMPLETED' | 'CANCELLED' })
                }
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-md"
              >
                Close
              </button>
              <button
                onClick={() => updateOrder(selectedOrder.id)}
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

export default OrdersPage;
