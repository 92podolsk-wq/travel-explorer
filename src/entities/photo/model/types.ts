import type { Season } from "@/entities/poi/model/types";

export type PhotoStatus = "pending" | "approved";

export type AdminPhoto = {
  id: string;
  poiId: string;
  poiName: string;
  regionId: string;
  url: string;
  alt: string;
  author: string | null;
  season: Season | null;
  position: number;
  status: PhotoStatus;
  uploadedByUserId: string | null;
  uploadedByEmail: string | null;
  uploadedByName: string | null;
  createdAt: string;
};
