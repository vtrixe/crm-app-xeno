import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CustomerMetricsPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has necessary roles (Admin, Manager)
  const hasAccess = user?.roles.some(role => [1, 2].includes(role.id));

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the metrics from the backend
      const response = await axios.get('http://localhost:5000/api/metrics/customer', {
        withCredentials: true,
      });

      setMetrics(response.data);
    } catch (error) {
      setError('Failed to fetch customer metrics.');
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerMetricsCalculation = async () => {
    setLoading(true);
    setError(null);

    try {

      await axios.get('http://localhost:5000/api/data-ingestion/customers/metrics', {
        withCredentials: true,
      });
      alert('Customer metrics calculation initiated. Please try fetching after some time.');
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
        <p className="text-xl text-red-600">You do not have access to view metrics</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Customer Metrics</h2>
      
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
            <li><strong>Total Customers:</strong> {metrics.totalCustomers}</li>
            <li><strong>Customers with Orders:</strong> {metrics.customersWithOrders}</li>
            <li><strong>Total Spending:</strong> ${metrics.totalSpending.toFixed(2)}</li>
            <li><strong>Average Spending:</strong> ${metrics.averageSpending.toFixed(2)}</li>
            <li><strong>Calculated At:</strong> {new Date(metrics.calculatedAt).toLocaleString()}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerMetricsPage;
