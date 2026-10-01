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

// Sitzungsdoku ----------------------------------------------------------

export type SessionKind = "supervision" | "therapie";
export type SessionSetting = "einzel" | "gruppe";

export type Session = {
  id: string;
  kind: SessionKind;
  held_on: string;
  start_time: string | null;
  duration_minutes: number | null;
  participants: string | null;
  client: string | null;
  setting: SessionSetting | null;
  methods: string | null;
  observations: string | null;
  online: boolean | null;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionFile = {
  id: string;
  path: string;
  name: string;
  size: number | null;
};

export type SessionComment = {
  id: string;
  body: string;
  created_at: string;
};

export const SESSION_COLUMNS =
  "id, kind, held_on, start_time, duration_minutes, participants, client, setting, methods, observations, online, location, created_at, updated_at";

export const SESSION_KINDS: Record<SessionKind, string> = {
  supervision: "Supervision",
  therapie: "Therapie",
};
