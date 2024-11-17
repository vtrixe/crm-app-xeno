import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface FormData {
  name: string;
  startDate: string;
  endDate: string;
  budget: string;
  targetAudience: string;
  messageTemplate: string;
  includeAudienceSegments: boolean;
  audienceSegmentIds: string[];
}

const MAX_NAME_LENGTH = 100; // Adjust this based on your database column limit

const CreateCampaignPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    startDate: "",
    endDate: "",
    budget: "",
    targetAudience: "",
    messageTemplate: "",
    includeAudienceSegments: false,
    audienceSegmentIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newSegmentId, setNewSegmentId] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);

  // Clear name error when name changes
  useEffect(() => {
    if (nameError && formData.name.length <= MAX_NAME_LENGTH) {
      setNameError(null);
    }
  }, [formData.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for name field
    if (name === 'name') {
      if (value.length > MAX_NAME_LENGTH) {
        setNameError(`Campaign name must be ${MAX_NAME_LENGTH} characters or less`);
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      includeAudienceSegments: checked,
      audienceSegmentIds: checked ? prev.audienceSegmentIds : [],
    }));
  };

  const handleAddSegmentId = () => {
    if (newSegmentId && !formData.audienceSegmentIds.includes(newSegmentId)) {
      setFormData((prev) => ({
        ...prev,
        audienceSegmentIds: [...prev.audienceSegmentIds, newSegmentId],
      }));
      setNewSegmentId("");
    }
  };

  const handleRemoveSegmentId = (idToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      audienceSegmentIds: prev.audienceSegmentIds.filter((id) => id !== idToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name length before submission
    if (formData.name.length > MAX_NAME_LENGTH) {
      setError(`Campaign name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const requestData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        budget: parseFloat(formData.budget),
        audienceSegmentIds: formData.includeAudienceSegments 
          ? formData.audienceSegmentIds.map(id => parseInt(id, 10))
          : [],
      };

      const response = await axios.post(
        "http://localhost:5000/api/campaign",
        requestData,
        { withCredentials: true }
      );

      setSuccessMessage("Campaign created successfully!");
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        budget: "",
        targetAudience: "",
        messageTemplate: "",
        includeAudienceSegments: false,
        audienceSegmentIds: [],
      });
      console.log("Created campaign:", response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create campaign.");
      console.error("Error creating campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.roles.some((role) => ["Admin", "Manager"].includes(role.name))) {
    return (
      <div className="text-center p-4 bg-red-100 rounded-lg shadow-md">
        <p className="text-xl text-red-600">You do not have access to create campaigns</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold text-center mb-6">Create Campaign</h2>
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      {successMessage && <div className="text-center text-green-600 mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Campaign Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength={MAX_NAME_LENGTH}
            className={`w-full p-2 border rounded-md ${
              nameError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.name.length}/{MAX_NAME_LENGTH} characters
          </p>
        </div>

        <div>
          <label className="block font-medium">Start Date</label>
          <input
            type="datetime-local"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium">End Date</label>
          <input
            type="datetime-local"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium">Budget</label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            required
            min="0.01"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium">Target Audience</label>
          <input
            type="text"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block font-medium">Message Template</label>
          <textarea
            name="messageTemplate"
            value={formData.messageTemplate}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={4}
          ></textarea>
        </div>

        {/* Audience Segments Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeAudienceSegments"
              checked={formData.includeAudienceSegments}
              onChange={handleCheckboxChange}
              className="rounded border-gray-300"
            />
            <label htmlFor="includeAudienceSegments" className="font-medium">
              Include Audience Segments
            </label>
          </div>

          {formData.includeAudienceSegments && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={newSegmentId}
                  onChange={(e) => setNewSegmentId(e.target.value)}
                  placeholder="Enter segment ID"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={handleAddSegmentId}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Segment
                </button>
              </div>

              {formData.audienceSegmentIds.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium mb-2">Added Segments:</h4>
                  <div className="space-y-2">
                    {formData.audienceSegmentIds.map((id) => (
                      <div key={id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span>Segment ID: {id}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSegmentId(id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading || !!nameError}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaignPage;