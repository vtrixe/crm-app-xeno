import React, { useState, useEffect } from "react";
import { CampaignAPI } from "../components/campaign/api";
import { toast } from "react-toastify";
import EditCampaignModal from "../components/campaign/edit";

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<"stats" | "history" | "segments" | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords] = useState(50);
  const recordsPerPage = 10;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const fetchCampaigns = async (page: number) => {
    setLoading(true);
    try {
      // Adjust your API call to include pagination parameters
      const response = await CampaignAPI.getCampaigns({
        page,
        limit: recordsPerPage
      });
      setCampaigns(response.data || []);
    } catch (error) {
      toast.error("Error fetching campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(currentPage);
  }, [currentPage]);

  const openModal = (type: "stats" | "history" | "segments", data: any) => {
    setModalType(type);
    setModalData(data);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);

  const openEditModal = (campaign: any) => {
    setEditCampaign(campaign);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditCampaign(null);
    setEditModalOpen(false);
  };

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const PaginationControls = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className={`px-3 py-1 rounded border ${
                currentPage === 1 ? "bg-blue-500 text-white" : ""
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => goToPage(number)}
            className={`px-3 py-1 rounded border ${
              currentPage === number ? "bg-blue-500 text-white" : ""
            }`}
          >
            {number}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => goToPage(totalPages)}
              className={`px-3 py-1 rounded border ${
                currentPage === totalPages ? "bg-blue-500 text-white" : ""
              }`}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Campaigns</h1>
      
      <div className="mb-4">
        Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} campaigns
      </div>

      {loading ? (
        <p>Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <p>No campaigns found.</p>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border rounded shadow p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{campaign.name}</h2>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    campaign.status === "DRAFT"
                      ? "bg-yellow-100 text-yellow-700"
                      : campaign.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              <p>
                <strong>Start Date:</strong>{" "}
                {new Date(campaign.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>End Date:</strong>{" "}
                {new Date(campaign.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Budget:</strong> ${campaign.budget}
              </p>
              <p>
                <strong>Target Audience:</strong> {campaign.targetAudience}
              </p>
              <p>
                <strong>Message Template:</strong> {campaign.messageTemplate}
              </p>
              <p>
                <strong>Created By:</strong> {campaign.creator.name} (
                {campaign.creator.email})
              </p>
              <div className="space-x-2 mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={() => openModal("stats", campaign.stats)}
                >
                  View Stats
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded"
                  onClick={() => openModal("segments", campaign.audienceSegments)}
                >
                  View Audience Segments
                </button>
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                  onClick={() => openModal("history", campaign.history)}
                >
                  View History
                </button>
                <button
                  className="px-4 py-2 bg-yellow-500 text-white rounded"
                  onClick={() => openEditModal(campaign)}
                >
                  Edit
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold mt-4">Status Details</h3>
                <p>
                  <strong>Current:</strong> {campaign.statusDetails.current}
                </p>
                <p>
                  <strong>Is Active:</strong>{" "}
                  {campaign.statusDetails.isActive ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Can Activate:</strong>{" "}
                  {campaign.statusDetails.canActivate ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mt-4">Analytics</h3>
                <p>
                  <strong>Total Updates:</strong>{" "}
                  {campaign.historyAnalytics.totalUpdates}
                </p>
                <p>
                  <strong>Last Update:</strong>{" "}
                  {new Date(campaign.historyAnalytics.lastUpdate).toLocaleString()}
                </p>
                <p>
                  <strong>Status Changes:</strong>{" "}
                  {campaign.historyAnalytics.statusChanges}
                </p>
              </div>
            </div>
          ))}
          
          <PaginationControls />
        </div>
      )}

      {modalType && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-w-full">
            <h3 className="text-lg font-bold mb-4">
              {modalType === "stats"
                ? "Stats"
                : modalType === "history"
                ? "History"
                : "Audience Segments"}
            </h3>
            <div className="space-y-4">
              {modalType === "stats" &&
                modalData.map((stat: any, index: number) => (
                  <div key={index} className="border p-2 rounded bg-gray-100">
                    <p>
                      <strong>Impressions:</strong> {stat.impressions}
                    </p>
                    <p>
                      <strong>Clicks:</strong> {stat.clicks}
                    </p>
                    <p>
                      <strong>Conversions:</strong> {stat.conversions}
                    </p>
                  </div>
                ))}
              {modalType === "history" &&
                modalData.map((history: any, index: number) => (
                  <div key={index} className="border p-2 rounded bg-gray-100">
                    <p>
                      <strong>Action:</strong> {history.action}
                    </p>
                    <p>
                      <strong>Updated By:</strong> {history.user.name} (
                      {history.user.email})
                    </p>
                    <p>
                      <strong>Updated At:</strong>{" "}
                      {new Date(history.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              {modalType === "segments" &&
                modalData.map((segment: any, index: number) => (
                  <div key={index} className="border p-2 rounded bg-gray-100">
                    <p>
                      <strong>Name:</strong> {segment.audienceSegment.name}
                    </p>
                    <p>
                      <strong>Size:</strong> {segment.audienceSegment.audienceSize}
                    </p>
                  </div>
                ))}
            </div>
            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editModalOpen && editCampaign && (
        <EditCampaignModal
          editCampaign={editCampaign}
          setEditCampaign={setEditCampaign}
          closeEditModal={closeEditModal}
          fetchCampaigns={() => fetchCampaigns(currentPage)}
        />
      )}
    </div>
  );
};

export default CampaignsPage;