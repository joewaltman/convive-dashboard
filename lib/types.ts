export interface GuestFields {
  // Identity
  'First Name'?: string;
  'Last Name'?: string;
  'Email'?: string;
  'Phone'?: string;
  'Gender'?: string;
  'Zip Code'?: string;
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
  'M2 Variant'?: string | null;
  'M3 Variant'?: string | null;

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

// Host types
export interface HostFields {
  'First Name'?: string;
  'Last Name'?: string;
  'Phone'?: string;
  'Email'?: string;
  'Address'?: string;
  'City'?: string;
  'Notes'?: string;
  'Max Guests'?: number;
  'Guest ID'?: number | null;
  'Active'?: boolean;
  'Created Time'?: string;
}

export interface Host {
  id: string;
  fields: HostFields;
  dinnerCount?: number;
  linkedGuest?: Guest | null;
}

// Dinner types
export interface DinnerFields {
  'Dinner Name'?: string;
  'Dinner Date'?: string;
  'Start Time'?: string;
  'Host ID'?: number | null;
  'Host'?: string; // legacy text field
  'Location'?: string;
  'Guest Count'?: number;
  'Menu'?: string;
  'Notes'?: string;
  'Created Time'?: string;
}

export interface Dinner {
  id: string;
  fields: DinnerFields;
  host?: Host | null;
  invitations?: Invitation[];
  bringItems?: BringItem[];
  confirmedCount?: number;
}

// Invitation types
export type InvitationResponse = 'Accepted' | 'Declined' | 'Invited' | null;

export interface Invitation {
  id: number;
  guestId: number;
  dinnerId: number;
  guestName: string;
  phone: string | null;
  inviteSentDate: string | null;
  response: InvitationResponse;
  responseDate: string | null;
  notes: string | null;
  guest?: Guest;
}

// Bring item types
export interface BringItem {
  id: number;
  dinnerId: number;
  category: string;
  description: string | null;
  slots: number;
  claims: BringItemClaim[];
}

export interface BringItemClaim {
  id: number;
  bringItemId: number;
  guestId: number;
  claimedAt: string;
  guest?: Guest;
}

// Reminder types
export interface GuestReminder {
  guestId: number;
  guestName: string;
  firstName: string;
  phone: string | null;
  bringItem: string | null;
  message: string;
}

export interface ReminderResponse {
  dinnerId: number;
  dinnerName: string;
  dinnerDate: string;
  reminders: GuestReminder[];
}
