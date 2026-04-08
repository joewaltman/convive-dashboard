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
