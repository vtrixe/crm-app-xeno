import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  ShoppingCart,
  BarChart2,
  Layers,
  MessageSquare,
  Mail,
  PieChart,
  UserPlus,
  ShoppingBag,
  ListFilter,
  PenSquare,
  List,
  MessageCircle
} from "lucide-react";

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  activeCampaigns: number;
  customerSegments: number;
}

interface UserInfo {
  name: string;
  email: string;
  roles: string[];
}


const Dashboard: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/dashboard/stats", {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setUserInfo(data.user);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        navigate("/login");
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const navigationItems = [
    {
      title: "Customers",
      items: [
        { name: "View Customers", icon: <Users size={20} />, path: "/customers" },
        { name: "Add Customer", icon: <UserPlus size={20} />, path: "/create-customer" },
        { name: "Customer Metrics", icon: <BarChart2 size={20} />, path: "/customer-metrics" },
      ]
    },
    {
      title: "Orders",
      items: [
        { name: "View Orders", icon: <ShoppingCart size={20} />, path: "/orders" },
        { name: "Create Order", icon: <ShoppingBag size={20} />, path: "/create-order" },
        { name: "Order Metrics", icon: <PieChart size={20} />, path: "/order-metrics" },
      ]
    },
    {
      title: "Segments & Campaigns",
      items: [
        { name: "View Segments", icon: <Layers size={20} />, path: "/segments" },
        { name: "Create Segment", icon: <ListFilter size={20} />, path: "/create-segment" },
        { name: "View Campaigns", icon: <Mail size={20} />, path: "/campaigns" },
        { name: "Create Campaign", icon: <PenSquare size={20} />, path: "/create-campaign" },
      ]
    },
    {
      title: "Communication",
      items: [
        { name: "Messages", icon: <MessageSquare size={20} />, path: "/messages" },
        { name: "Communication Logs", icon: <MessageCircle size={20} />, path: "/communication-logs" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          </div>
          <nav className="p-4">
            {navigationItems.map((section, idx) => (
              <div key={idx} className="mb-6">
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        to={item.path}
                        className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {item.icon}
                        <span className="ml-3 text-sm">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex-1 p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Welcome Back!</h2>
              {userInfo && (
                <p className="text-gray-600">
                  {userInfo.name} | {userInfo.roles.join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Total Customers", 
                value: stats?.totalCustomers || 0,
                icon: <Users className="text-blue-500" size={24} /> 
              },
              { 
                title: "Total Orders", 
                value: stats?.totalOrders || 0,
                icon: <ShoppingCart className="text-green-500" size={24} /> 
              },
              { 
                title: "Active Campaigns", 
                value: stats?.activeCampaigns || 0,
                icon: <Mail className="text-purple-500" size={24} /> 
              },
              { 
                title: "Customer Segments", 
                value: stats?.customerSegments || 0,
                icon: <Layers className="text-orange-500" size={24} /> 
              }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                    <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;