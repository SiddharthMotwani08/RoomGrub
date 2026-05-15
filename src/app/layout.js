import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Pocket — Roommate Expenses',
    template: '%s | Pocket',
  },
  description:
    'Pocket helps roommates instantly know who owes whom with the minimum settlement transactions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className={`${jakarta.className} min-h-screen text-slate-950 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
