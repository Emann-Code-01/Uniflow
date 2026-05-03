// app/layout.tsx
import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import '../globals.css';
import DashboardClientWrapper from '@/components/layout/DashboardClientWrapper';

const sora = Sora({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Uniflow Admin',
  description: 'Admin dashboard',
};

// Force dynamic rendering for all routes (optional, but safe)
// export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sora.className}>
      <body>
        <DashboardClientWrapper>{children}</DashboardClientWrapper>
      </body>
    </html>
  );
}