import type { CSSProperties } from 'react';

export function InvitationText({
  children,
  size = 'md',
  style,
}: {
  children: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: CSSProperties;
}) {
  const sizeMap = {
    sm: 28,
    md: 40,
    lg: 56,
    xl: 72,
  };

  return (
    <div
      style={{
        fontSize: sizeMap[size],
        fontWeight: 400,
        letterSpacing: '0.04em',
        textAlign: 'center',
        color: '#f5e6c8',
        textShadow: '0 2px 12px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
