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
  end_time: string | null;
  /** Wird beim Speichern aus Start und Ende berechnet. */
  duration_minutes: number | null;
  participants: string[];
  client: string | null;
  setting: SessionSetting | null;
  methods: string | null;
  observations: string | null;
  self_reflection: string | null;
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
  "id, kind, held_on, start_time, end_time, duration_minutes, participants, client, setting, methods, observations, self_reflection, online, location, created_at, updated_at";

export type ParticipantCount = {
  name: string;
  count: number;
};

export const SESSION_KINDS: Record<SessionKind, string> = {
  supervision: "Supervision",
  therapie: "Therapie",
};

/** Die Textfelder einer Sitzung, in Anzeige-Reihenfolge. */
export const SESSION_TEXTS = [
  { name: "methods", label: "Methoden / Programm", rows: "min-h-24" },
  { name: "observations", label: "Beobachtungen", rows: "min-h-40" },
  { name: "self_reflection", label: "Selbstreflexion", rows: "min-h-40" },
] as const;
