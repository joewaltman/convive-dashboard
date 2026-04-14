export interface GuestFields {
  // Identity
  'First Name'?: string;
  'Last Name'?: string;
  'Email'?: string;
  'Phone'?: string;
  'Age Range'?: string;

  // Vetting
  'Funnel Stage'?: string;
  'Curiosity Score'?: number;
  'Spark Score'?: number;
  'Call Complete'?: boolean;
  'Call Date'?: string;
  'Priority'?: string;

  // Guest Profile
  'What Do You Do'?: string;
  'About'?: string;
  'OneThing'?: string;
  'Curious About'?: string;
  'Surprising Knowledge'?: string;

  // Logistics
  'Solo or Couple'?: string;
  'Available Days'?: string[];
  'Dietary Restrictions'?: string[];
  'Dietary Notes'?: string;
  'Hosting Interest'?: string;

  // Call Notes
  'Summarized Transcript'?: string;

  // System
  'Created Time'?: string;
  'Routing Status'?: string | null;
  'Last Replied At'?: string | null;
  'Last Message Sent At'?: string | null;
  'Sequence Completed'?: boolean;
  'Sequence Paused'?: boolean;
  'Sequence Step'?: number | null;
  'Attention Archived At'?: string | null;

  // Social Enrichment
  'Social Summary'?: {
    inferred_role: string;
    industries: string[];
    interests: string[];
    conversational_vibe: string;
    guest_note: string;
    curiosity_signals: string;
    source_url: string;
    source_platform: 'linkedin' | 'instagram';
    enriched_at: string;
  } | null;
}

export interface Guest {
  id: string;
  fields: GuestFields;
  createdTime?: string;
}

export interface GuestListItem {
  id: string;
  firstName: string;
  lastName: string;
  funnelStage: string;
  ageRange: string;
  createdTime: string;
}

// Message types
export interface Message {
  id: number;
  guest_id: number;
  direction: 'inbound' | 'outbound';
  body: string;
  sent_at: string;
  delivered: boolean;
  message_type: string | null;
  sequence_step: number | null;
  flagged: boolean;
  flagged_reason: string | null;
}

// Attention Queue types
export interface AttentionQueueItem {
  guest: Guest;
  lastActivityAt: string;
  lastInboundAt?: string;
  lastInboundMessage?: string;
}

export interface AttentionQueueData {
  items: AttentionQueueItem[];
  totalCount: number;
}
