// Assets domain types

export type PresignInput = {
  fileName: string;
  fileType: string;
};

export type PresignOutput = {
  result: true;
  data: {
    uploadUrl: string;
    fileUrl: string;
    fileName?: string;
  };
};

