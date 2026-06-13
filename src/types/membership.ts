// Stage 1: Membership type placeholder.
export type MembershipTier = 'free' | 'basic' | 'premium';
export interface Membership {
  id: string;
  userId: string;
  tier: MembershipTier;
  validUntil: string;
}
