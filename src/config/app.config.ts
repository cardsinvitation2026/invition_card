// Centralized application configuration.
export const appConfig = {
  name: 'My Invitations',
  shortName: 'MyInvites',
  description:
    'AI-animated digital invitations for weddings, engagements, birthdays, anniversaries and house-warming events.',
  locale: 'en-IN',
  defaultCurrency: 'INR',
  supportEmail: 'support@myinvitations.app',
  socials: {
    twitter: '',
    instagram: '',
  },
} as const;

export type AppConfig = typeof appConfig;
