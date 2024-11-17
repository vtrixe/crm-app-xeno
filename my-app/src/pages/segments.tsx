import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface Segment {
  id: number;
  name: string;
  audienceSize: number;
  createdAt: string;
  updatedAt: string;
  filters: {
    field: string;
    operator: string;
    value?: number;
    dateValue?: string;
  }[];
}

const SegmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  const fetchSegments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        "http://localhost:5000/api/audience-segmentation/segments",
        { withCredentials: true }
      );
      setSegments(response.data);
    } catch (error) {
      setError("Failed to fetch segments.");
      console.error("Error fetching segments:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectSegment = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/audience-segmentation/segments/${id}`,
        { withCredentials: true }
      );
      setSelectedSegment(response.data);
    } catch (error) {
      setError("Failed to fetch segment details.");
      console.error("Error fetching segment details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  if (
    !user?.roles.some((role) =>
      ["Admin", "manager", "analyst", "viewer"].includes(role.name)
    )
  ) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">
          You do not have access to view segments
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Segments</h2>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}

      <table className="w-full border-collapse border border-gray-300 text-left">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Audience Size</th>
            <th className="border border-gray-300 p-2">Created At</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.id}>
              <td className="border border-gray-300 p-2">{segment.name}</td>
              <td className="border border-gray-300 p-2">{segment.audienceSize}</td>
              <td className="border border-gray-300 p-2">
                {new Date(segment.createdAt).toLocaleString()}
              </td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => selectSegment(segment.id)}
                  className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSegment && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Segment Details</h3>
          <p>
            <strong>Name:</strong> {selectedSegment.name}
          </p>
          <p>
            <strong>Audience Size:</strong> {selectedSegment.audienceSize}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(selectedSegment.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Updated At:</strong>{" "}
            {new Date(selectedSegment.updatedAt).toLocaleString()}
          </p>
          <div>
            <strong>Filters:</strong>
            <ul className="list-disc pl-5">
              {selectedSegment.filters.map((filter, index) => (
                <li key={index}>
                  <span className="font-medium">Field:</span> {filter.field},{" "}
                  <span className="font-medium">Operator:</span>{" "}
                  {filter.operator},{" "}
                  {filter.value !== undefined && (
                    <>
                      <span className="font-medium">Value:</span> {filter.value},{" "}
                    </>
                  )}
                  {filter.dateValue && (
                    <>
                      <span className="font-medium">Date Value:</span>{" "}
                      {filter.dateValue}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setSelectedSegment(null)}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SegmentsPage;
