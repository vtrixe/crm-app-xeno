import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const OrderMetricsPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has necessary roles (Admin, Manager)
  const hasAccess = user?.roles.some(role => [1, 2].includes(role.id));

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the metrics from the backend
      const response = await axios.get('http://localhost:5000/api/metrics/order', {
        withCredentials: true,
      });

      setMetrics(response.data);
    } catch (error) {
      setError('Failed to fetch order metrics.');
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerMetricsCalculation = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.get('http://localhost:5000/api/data-ingestion/orders/metrics', {
        withCredentials: true,
      });
      alert('Order metrics calculation initiated. Please try fetching after some time.');
    } catch (error) {
      setError('Failed to initiate metrics calculation.');
      console.error('Error initiating metrics calculation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">You do not have access to view order metrics</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Order Metrics</h2>
      
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={triggerMetricsCalculation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Calculate Metrics
        </button>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Fetch Metrics
        </button>
      </div>

      {metrics && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Metrics Data</h3>
          <ul>
            <li><strong>Total Orders:</strong> {metrics.totalOrders}</li>
            <li><strong>Completed Orders:</strong> {metrics.completedOrders}</li>
            <li><strong>Total Revenue:</strong> ${metrics.totalRevenue.toFixed(2)}</li>
            <li><strong>Average Order Value:</strong> ${metrics.averageOrderValue.toFixed(2)}</li>
            <li>
              <strong>Orders by Status:</strong>
              <ul>
                {Object.entries(metrics.ordersByStatus).map(([status, count]) => (
                  <li key={status}>{status}: {count as number}</li>
                ))}
              </ul>
            </li>
            <li><strong>Calculated At:</strong> {new Date(metrics.calculatedAt).toLocaleString()}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrderMetricsPage;
