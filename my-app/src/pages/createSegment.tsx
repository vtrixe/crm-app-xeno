import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface Filter {
  field: string;
  operator: string;
  value?: number;
}

const CreateSegmentPage: React.FC = () => {
  const { user } = useAuth();
  const [segmentName, setSegmentName] = useState<string>("");
  const [filters, setFilters] = useState<Filter[]>([
    { field: "totalSpending", operator: ">", value: 0 },
  ]);
  const [logicalOperator, setLogicalOperator] = useState<string>("AND");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if the user has the necessary roles (Admin, Manager)
  const hasAccess = user?.roles.some((role) => ["Admin", "manager"].includes(role.name));

  const handleFilterChange = (index: number, field: string, value: string | number) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setFilters(updatedFilters);
  };

  const addFilter = () => {
    setFilters([...filters, { field: "totalSpending", operator: ">", value: 0 }]);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Prepare data to be sent to the backend
    const data = {
      name: segmentName,
      filters: filters.map((filter) => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
      })),
    };

    try {
      await axios.post("http://localhost:5000/api/audience-segmentation/segments", data, {
        withCredentials: true,
      });
      setSuccessMessage("Segment created successfully!");
      setSegmentName(""); // Reset form after successful submission
      setFilters([{ field: "totalSpending", operator: ">", value: 0 }]); // Reset filters
    } catch (error) {
      setError("Failed to create segment.");
      console.error("Error creating segment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">You do not have access to create segments</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Create Segment</h2>

      {loading && <div className="text-center">Creating segment...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {successMessage && <div className="text-center text-green-600">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-lg font-semibold">
            Segment Name
          </label>
          <input
            type="text"
            id="name"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-semibold">Filters</label>
          {filters.map((filter, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <select
                value={filter.field}
                onChange={(e) => handleFilterChange(index, "field", e.target.value)}
                className="w-1/4 p-3 border border-gray-300 rounded-md"
              >
                <option value="totalSpending">Total Spending</option>
                <option value="visits">Visits</option>
              </select>
              <select
                value={filter.operator}
                onChange={(e) => handleFilterChange(index, "operator", e.target.value)}
                className="w-1/4 p-3 border border-gray-300 rounded-md"
              >
                <option value=">">{'>'}</option>
                <option value="<">&lt;</option>
                <option value=">=">≥</option>
                <option value="<=">≤</option>
                <option value="=">=</option>
              </select>
              <input
                type="number"
                value={filter.value || ""}
                onChange={(e) => handleFilterChange(index, "value", +e.target.value)}
                className="w-1/4 p-3 border border-gray-300 rounded-md"
                required
              />
              <button
                type="button"
                onClick={() => removeFilter(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Filter
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-lg font-semibold">Logical Operator</label>
          <select
            value={logicalOperator}
            onChange={(e) => setLogicalOperator(e.target.value)}
            className="w-1/2 p-3 border border-gray-300 rounded-md"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default CreateSegmentPage;
