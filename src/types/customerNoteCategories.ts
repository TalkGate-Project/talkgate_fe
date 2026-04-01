// Customer Note Categories domain types

export type CustomerNoteCategory = {
  id: number;
  projectId: number;
  name: string;
  colorCode?: string;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerNoteCategoriesListResponse = {
  result: true;
  data: CustomerNoteCategory[];
};

