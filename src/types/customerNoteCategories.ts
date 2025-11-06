// Customer Note Categories domain types

export type CustomerNoteCategory = {
  id: number;
  name: string;
  color?: string; // e.g., hex for pills
  active?: boolean;
};

export type CustomerNoteCategoriesListResponse = {
  result: true;
  data: CustomerNoteCategory[];
};

