import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          borderRadius: 8,
          color: '#f8fafc',
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
