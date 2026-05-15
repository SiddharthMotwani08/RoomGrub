import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'prisma/seed.js',
      'src/app/[[]room_id[]]/**',
      'src/app/create_room/**',
      'src/app/invite/**',
      'src/app/(auth)/**',
      'src/components/Notification*.jsx',
      'src/components/BottomNav.jsx',
      'src/components/NavBar*.jsx',
      'src/hooks/**',
      'src/services/**',
      'src/utils/**',
    ],
  },
];

export default config;
