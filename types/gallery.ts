import type { EntryCategory, PreviewFileType } from "@/types/review";

export interface GalleryEntry {
  entryId: string;
  category: EntryCategory;
  workTitle?: string;
  workConcept?: string;
  fileId?: string | null;
  thumbnailUrl?: string | null;
  thumbnailType?: PreviewFileType | null;
  displayRotation?: number;
  voteCount?: number;
}

export type GalleryEntryWithVotes = GalleryEntry & { voteCount: number };

/** Payload for the single shared gallery lightbox (parent-managed state). */
export interface GalleryLightboxSelection {
  entryId: string;
  title: string;
  imageUrl: string;
  displayRotation?: number;
}

export interface GalleryEntriesResponse {
  ok: boolean;
  error?: string;
  entries?: GalleryEntry[];
}
