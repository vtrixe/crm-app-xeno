import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/protected";
import App from "./App";
import './index.css'
import Dashboard from "./pages/dashboard";
import Login from "./pages/LoginPage";
import Signup from "./pages/SignUpPage";
import CreateCustomer from "./pages/createCustomer";
import CreateOrder from "./pages/createOrder";
import CustomersPage from "./pages/customers";
import CustomerMetricsPage from "./pages/customerMetrics";
import OrdersPage from "./pages/orders";
import OrderMetricsPage from "./pages/ordersmetrics";
import CreateSegmentPage from "./pages/createSegment";
import SegmentsPage from "./pages/segments";
import CreateCampaignPage from "./pages/create-campaign";
import CampaignsPage from "./pages/campaigns";
import MessagesPage from "./pages/messages";
import MessagesListPage from "./pages/communication-logs";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} /> {/* Can reuse login page for signup */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
              <Route
            path="/create-customer"
            element={
              <ProtectedRoute>
                <CreateCustomer />
              </ProtectedRoute>
            }
          />
                  <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
                     <Route
            path="/create-segment"
            element={
              <ProtectedRoute>
                <CreateSegmentPage/>
              </ProtectedRoute>
            }
          />
                       <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
                           <Route
            path="/segments"
            element={
              <ProtectedRoute>
                <SegmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-order"
            element={
              <ProtectedRoute>
                <CreateOrder />
              </ProtectedRoute>
            }
          />
              <Route
            path="/create-campaign"
            element={
              <ProtectedRoute>
                <CreateCampaignPage />
              </ProtectedRoute>
            }
          />
               <Route
            path="/customer-metrics"
            element={
              <ProtectedRoute>
                <CustomerMetricsPage />
              </ProtectedRoute>
            }
          />
               <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            }
          />
                 <Route
            path="/order-metrics"
            element={
              <ProtectedRoute>
                <OrderMetricsPage />
              </ProtectedRoute>
            }
          />
           <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

<Route
            path="/communication-logs"
            element={
              <ProtectedRoute>
                <MessagesListPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
