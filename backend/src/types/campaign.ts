export interface CreateCampaignDTO {
    name: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    targetAudience: string;
    messageTemplate: string;
    audienceSegmentIds: number[];
  }