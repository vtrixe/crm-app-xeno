import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CampaignAPI } from './api';

interface EditCampaignProps {
  editCampaign: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    budget: number;
  };
  setEditCampaign: (campaign: any) => void;
  closeEditModal: () => void;
  fetchCampaigns: () => void;
}

const EditCampaignModal: React.FC<EditCampaignProps> = ({ 
  editCampaign, 
  setEditCampaign, 
  closeEditModal, 
  fetchCampaigns 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const payload = {
        name: editCampaign.name,
        status: editCampaign.status,
        startDate: new Date(editCampaign.startDate).toISOString(),
        endDate: new Date(editCampaign.endDate).toISOString(),
        budget: editCampaign.budget // Ensure it's a number
      };
  
      console.log('Sending payload:', JSON.stringify(payload, null, 2)); // Debug log
      
      const response = await CampaignAPI.updateCampaign(Number(editCampaign.id), payload);
      console.log('Response:', response); // Debug log
      
      toast.success('Campaign updated successfully!');
      closeEditModal();
      fetchCampaigns();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error details:', (error as any).response?.data || error.message); // Debug log
      } else {
        console.error('Error details:', error);
      }
      const errorMessage = (error instanceof Error && (error as any)?.response?.data?.error) || 'Failed to update campaign';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h3 className="text-lg font-bold mb-4">Edit Campaign</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={editCampaign.name || ''}
              onChange={(e) => setEditCampaign({ ...editCampaign, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={editCampaign.status || ''}
              onChange={(e) => setEditCampaign({ ...editCampaign, status: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={editCampaign.startDate ? new Date(editCampaign.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setEditCampaign({ ...editCampaign, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={editCampaign.endDate ? new Date(editCampaign.endDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setEditCampaign({ ...editCampaign, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Budget</label>
            <input
              type="number"
              value={editCampaign.budget || ''}
              onChange={(e) => setEditCampaign({ ...editCampaign, budget: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeEditModal}
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCampaignModal;