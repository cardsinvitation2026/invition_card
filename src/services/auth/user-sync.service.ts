// User-sync service: server-side glue between Firebase verification and the
// User repository. Used by the /api/auth/sync route handler.
import 'server-only';
import { verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { userService } from '@/features/users/user.service';
import type { AppUser } from '@/types/user';

export const userSyncService = {
  async syncFromFirebaseIdToken(idToken: string): Promise<AppUser> {
    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded.email) {
      throw new Error('Firebase token has no email claim.');
    }
    return userService.syncFromAuth({
      firebaseUid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      photoUrl: decoded.picture,
    });
  },
};
