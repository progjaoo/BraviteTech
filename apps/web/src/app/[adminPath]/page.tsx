import { notFound } from 'next/navigation';
import AdminPanel from './admin-panel';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PrivateAdminPage({ params }: { params: Promise<{ adminPath: string }> }) {
  const { adminPath } = await params;
  const configuredPath = process.env.ADMIN_PANEL_PATH;

  if (!configuredPath || !/^[a-f0-9]{64}$/.test(configuredPath) || adminPath !== configuredPath) {
    notFound();
  }

  return <AdminPanel />;
}
