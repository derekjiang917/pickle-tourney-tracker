export interface Tournament {
  id: string;
  name: string;
  sourceUrl: string;
  source: string;
  location: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  skillLevels: string[];
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
