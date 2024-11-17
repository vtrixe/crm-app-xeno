import React from "react";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Mini CRM</div>
        <div className="space-x-4">
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-600 hover:text-white" onClick={() => window.location.href = '/login'}>
            Login
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={()=>window.location.href = '/login'}>
            Signup
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-grow bg-gray-50 p-8">
        <h1 className="text-4xl font-semibold text-center mb-8">
          Build Campaigns & Manage Audiences Seamlessly
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Audience Segmentation</h2>
            <p>
              Easily define custom audience segments based on customer behavior, 
              such as total spending, visit frequency, and inactivity.
            </p>
          </div>
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Campaign Management</h2>
            <p>
              Create personalized campaigns and track their performance 
              with intuitive statistics and history logs.
            </p>
          </div>
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Google Authentication</h2>
            <p>
              Secure access with Google-based authentication for managing campaigns and audiences.
            </p>
          </div>
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Delivery Tracking</h2>
            <p>
              Track delivery statuses and understand campaign success with detailed logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center p-4">
        <p>© 2024 Mini CRM. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;
