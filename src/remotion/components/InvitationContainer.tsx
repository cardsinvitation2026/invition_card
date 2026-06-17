import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

export function InvitationContainer({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #1a0f00 0%, #3d2a0a 45%, #5c4012 100%)',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#f5e6c8',
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
