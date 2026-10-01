export type Exercise = {
  id: string;
  title: string;
  procedure: string;
  suitable_for: string | null;
  tags: string[];
  online: boolean | null;
  origin: string | null;
  group_size: string | null;
  material: string | null;
  created_at: string;
  updated_at: string;
};

export type CommentPhoto = {
  id: string;
  path: string;
};

export type Comment = {
  id: string;
  exercise_id: string;
  body: string;
  practiced_on: string;
  created_at: string;
  comment_photos: CommentPhoto[];
};

export type TagCount = {
  tag: string;
  count: number;
};

/** Spalten für Listen und Details; fts und owner_id bleiben in der Datenbank. */
export const EXERCISE_COLUMNS =
  "id, title, procedure, suitable_for, tags, online, origin, group_size, material, created_at, updated_at";
