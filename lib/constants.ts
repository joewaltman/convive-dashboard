// Funnel Stage options with colors
export const FUNNEL_STAGES = [
  { value: 'Partial', color: '#9CA3AF' },        // gray
  { value: 'New', color: '#3B82F6' },            // blue
  { value: 'Call Scheduled', color: '#8B5CF6' }, // purple
  { value: 'Call Done', color: '#F59E0B' },      // amber
  { value: 'Dinner Ready', color: '#10B981' },   // green
  { value: 'Invited', color: '#06B6D4' },        // cyan
  { value: 'Attended', color: '#B85C38' },       // terracotta (primary)
  { value: 'Declined', color: '#EF4444' },       // red
] as const;

export const FUNNEL_STAGE_OPTIONS = FUNNEL_STAGES.map(s => s.value);

export const getFunnelStageColor = (stage: string): string => {
  const found = FUNNEL_STAGES.find(s => s.value === stage);
  return found?.color ?? '#9CA3AF';
};

// Age Range options
export const AGE_RANGE_OPTIONS = [
  'Under 30',
  '30-39',
  '40-49',
  '50-59',
  '60-69',
  '70+',
] as const;

// Solo or Couple options
export const SOLO_OR_COUPLE_OPTIONS = [
  'Solo',
  'Couple',
  'Flexible',
  'Not Discussed',
] as const;

// Available Days options
export const AVAILABLE_DAYS_OPTIONS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
  'Not Discussed',
] as const;

// Dietary Restrictions options
export const DIETARY_RESTRICTIONS_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'No Red Meat',
  'No Fish',
  'No Shellfish',
  'No Dairy',
  'Lactose Intolerant',
  'No Gluten',
  'No Pork',
  'Other',
] as const;

// Hosting Interest options
export const HOSTING_INTEREST_OPTIONS = [
  'Yes',
  'Maybe',
  'No',
  'Not Discussed',
] as const;

// Brand colors
export const COLORS = {
  terracotta: '#B85C38',
  cream: '#FAF5F0',
  terracottaLight: '#D4795A',
  terracottaDark: '#8B4730',
} as const;

// Auth
export const AUTH_COOKIE_NAME = 'convive-auth';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Routing Status Options
export const ROUTING_STATUS_OPTIONS = ['green', 'yellow', 'red', 'deprioritized'] as const;
export type RoutingStatus = typeof ROUTING_STATUS_OPTIONS[number];

// Invitation Response Options
export const INVITATION_RESPONSE_OPTIONS = [
  { value: 'Accepted', label: 'Accepted', color: '#22C55E' },
  { value: 'Declined', label: 'Declined', color: '#EF4444' },
  { value: 'Invited', label: 'Invited', color: '#F59E0B' },
  { value: null, label: 'No Response', color: '#9CA3AF' },
] as const;

// Bring Item Categories
export const BRING_ITEM_CATEGORIES = [
  'Wine',
  'Appetizer',
  'Dessert',
  'Salad',
  'Side Dish',
  'Other',
] as const;

// Dinner Defaults
export const DEFAULT_START_TIME = '18:00';
export const DEFAULT_GUEST_COUNT = 7;
export const DEFAULT_MAX_GUESTS = 8;
