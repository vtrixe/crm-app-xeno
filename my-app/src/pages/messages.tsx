import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../context/AuthContext";



interface SendFormData {
  campaignId: string;
  customerId: string;
  messageContent: string;
}

interface StatusFormData {
  messageId: string;
  deliveryStatus: string;
}

interface CampaignStats {
  SENT: number;
  DELIVERED: number;
  FAILED: number;
  PENDING: number;
}

const MessagesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState({
    send: false,
    status: false,
    stats: false
  });
  const [error, setError] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState<SendFormData>({
    campaignId: "",
    customerId: "",
    messageContent: "",
  });
  const [statusForm, setStatusForm] = useState<StatusFormData>({
    messageId: "",
    deliveryStatus: "",
  });
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [campaignIdForStats, setCampaignIdForStats] = useState("");

  const api = axios.create({
    baseURL: 'https://crm-app-xeno-1.onrender.com/api',
    withCredentials: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const hasRequiredRole = () => {
    return user?.roles.some(role => ['Admin', 'Manager'].includes(role.name));
  };

  const validateNumericInput = (value: string): boolean => {
    return /^\d+$/.test(value);
  };

  const handleError = (error: any) => {
    if (error.response?.data?.error?.includes("Foreign key constraint violated")) {
      setError("Invalid Campaign ID or Customer ID. Please verify they exist in the system.");
      toast.error("Invalid Campaign ID or Customer ID");
    } else if (error.response?.status === 401) {
      setError("Your session has expired. Please login again.");
      toast.error("Session expired");
    } else {
      setError(error.response?.data?.error || "An unexpected error occurred");
      toast.error("An error occurred");
    }
  };

  const checkPermissionAndExecute = async (
    operation: () => Promise<void>,
    loadingKey: keyof typeof loading
  ) => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      return;
    }
    
    if (!hasRequiredRole()) {
      toast.error("You don't have permission to perform this action");
      return;
    }

    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);
    
    try {
      await operation();
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleSendMessage = () => {
    if (!sendForm.campaignId || !sendForm.customerId || !sendForm.messageContent.trim()) {
      setError("All fields are required");
      return;
    }

    if (!validateNumericInput(sendForm.campaignId) || !validateNumericInput(sendForm.customerId)) {
      setError("Campaign ID and Customer ID must be numbers");
      return;
    }

    checkPermissionAndExecute(async () => {
      const payload = {
        campaignId: parseInt(sendForm.campaignId, 10),
        customerId: parseInt(sendForm.customerId, 10),
        messageContent: sendForm.messageContent.trim()
      };

      const response = await api.post("/message/send", payload);
      toast.success("Message queued for sending");
      setSendForm({ campaignId: "", customerId: "", messageContent: "" });
    }, 'send');
  };

  const handleUpdateDeliveryStatus = () => {
    if (!statusForm.messageId || !statusForm.deliveryStatus) {
      setError("Message ID and Status are required");
      return;
    }

    if (!validateNumericInput(statusForm.messageId)) {
      setError("Message ID must be a number");
      return;
    }

    checkPermissionAndExecute(async () => {
      const payload = {
        id: parseInt(statusForm.messageId, 10),
        deliveryStatus: statusForm.deliveryStatus
      };

      await api.post("/message/delivery-status", payload);
      toast.success("Delivery status updated successfully");
      setStatusForm({ messageId: "", deliveryStatus: "" });
    }, 'status');
  };

  const handleFetchCampaignStats = () => {
    if (!campaignIdForStats) {
      setError("Campaign ID is required");
      return;
    }

    if (!validateNumericInput(campaignIdForStats)) {
      setError("Campaign ID must be a number");
      return;
    }

    checkPermissionAndExecute(async () => {
      const response = await api.get(`/message/campaign/${parseInt(campaignIdForStats, 10)}/stats`);
      setCampaignStats(response.data.stats);
      toast.success("Campaign stats fetched successfully");
    }, 'stats');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to access message management.</p>
        </div>
      </div>
    );
  }

  if (!hasRequiredRole()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access message management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Message Management</h1>
          <div className="text-sm text-gray-600">
            Logged in as: {user?.name} ({user?.roles.map(role => role.name).join(', ')})
          </div>
        </div>

  

        {/* Send Message Form */}
        <div className="mb-6 rounded border bg-white p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold">Send Message</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Campaign ID</label>
              <input
                type="text"
                placeholder="Enter campaign ID"
                value={sendForm.campaignId}
                onChange={(e) => {
                  if (e.target.value === '' || validateNumericInput(e.target.value)) {
                    setSendForm(prev => ({ ...prev, campaignId: e.target.value }));
                  }
                }}
                className="w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Customer ID</label>
              <input
                type="text"
                placeholder="Enter customer ID"
                value={sendForm.customerId}
                onChange={(e) => {
                  if (e.target.value === '' || validateNumericInput(e.target.value)) {
                    setSendForm(prev => ({ ...prev, customerId: e.target.value }));
                  }
                }}
                className="w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message Content</label>
              <textarea
                placeholder="Enter message content"
                value={sendForm.messageContent}
                onChange={(e) => setSendForm(prev => ({ ...prev, messageContent: e.target.value }))}
                className="w-full rounded border p-2"
                rows={4}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading.send}
              className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading.send ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>

        {/* Status Update Form */}
        <div className="mb-6 rounded border bg-white p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold">Update Delivery Status</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message ID</label>
              <input
                type="text"
                placeholder="Enter message ID"
                value={statusForm.messageId}
                onChange={(e) => {
                  if (e.target.value === '' || validateNumericInput(e.target.value)) {
                    setStatusForm(prev => ({ ...prev, messageId: e.target.value }));
                  }
                }}
                className="w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusForm.deliveryStatus}
                onChange={(e) => setStatusForm(prev => ({ ...prev, deliveryStatus: e.target.value }))}
                className="w-full rounded border p-2"
              >
                <option value="">Select Status</option>
                <option value="SENT">SENT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
            <button
              onClick={handleUpdateDeliveryStatus}
              disabled={loading.status}
              className="rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:bg-green-300"
            >
              {loading.status ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="rounded border bg-white p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold">Campaign Stats</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Campaign ID</label>
              <input
                type="text"
                placeholder="Enter campaign ID"
                value={campaignIdForStats}
                onChange={(e) => {
                  if (e.target.value === '' || validateNumericInput(e.target.value)) {
                    setCampaignIdForStats(e.target.value);
                  }
                }}
                className="w-full rounded border p-2"
              />
            </div>
            <button
              onClick={handleFetchCampaignStats}
              disabled={loading.stats}
              className="rounded bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600 disabled:bg-yellow-300"
            >
              {loading.stats ? "Fetching..." : "Fetch Stats"}
            </button>
          </div>
          {campaignStats && (
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold">Campaign Statistics:</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded bg-blue-100 p-3">
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-xl font-bold">{campaignStats.SENT}</p>
                </div>
                <div className="rounded bg-green-100 p-3">
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-xl font-bold">{campaignStats.DELIVERED || 0}</p>
                </div>
                <div className="rounded bg-red-100 p-3">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-xl font-bold">{campaignStats.FAILED}</p>
                </div>
                <div className="rounded bg-yellow-100 p-3">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-xl font-bold">{campaignStats.PENDING}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;