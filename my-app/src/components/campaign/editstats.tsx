import React, { useState } from "react";
import { toast } from "react-toastify";
import { CampaignAPI } from "./api";

interface EditStatsProps {
  editStats: {
    id: string;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    ctr?: number;
    cpc?: number;
    cpa?: number;
    roi?: number;
  };
  setEditStats: (stats: any) => void;
  closeStatsModal: () => void;
  fetchCampaignStats: () => void;
}

const EditStatsModal: React.FC<EditStatsProps> = ({
  editStats,
  setEditStats,
  closeStatsModal,
  fetchCampaignStats,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        impressions: editStats.impressions,
        clicks: editStats.clicks,
        conversions: editStats.conversions,
        cost: editStats.cost,
        ctr: editStats.ctr,
        cpc: editStats.cpc,
        cpa: editStats.cpa,
        roi: editStats.roi,
      };

      console.log("Submitting stats payload:", JSON.stringify(payload, null, 2)); // Debug log

      const response = await CampaignAPI.updateStats(Number(editStats.id), payload);
      console.log("Stats update response:", response); // Debug log

      toast.success("Campaign stats updated successfully!");
      closeStatsModal();
      fetchCampaignStats();
    } catch (error) {
      console.error("Error updating stats:", error);
      toast.error(
        (error as any)?.response?.data?.error || "Failed to update campaign stats"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h3 className="text-lg font-bold mb-4">Edit Campaign Stats</h3>
        <form onSubmit={handleSubmit}>
          {["impressions", "clicks", "conversions", "cost", "ctr", "cpc", "cpa", "roi"].map(
            (field) => (
              <div className="mb-4" key={field}>
                <label className="block text-sm font-medium mb-2">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="number"
                  value={editStats[field as keyof typeof editStats] || ""}
                  onChange={(e) =>
                    setEditStats({
                      ...editStats,
                      [field]: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            )
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeStatsModal}
              className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStatsModal;
