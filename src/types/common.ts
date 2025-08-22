// src/lib/types/common.ts
export type Media = { url: string; alt?: string };

export type ProfileLite = {
  name: string;
  email: string;
  bio?: string;
  avatar?: Media;
  banner?: Media;
};

export type VenueLocation = {
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
  continent?: string;
  lat?: number;
  lng?: number;
};

export type VenueMeta = {
  wifi?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  pets?: boolean;
};
