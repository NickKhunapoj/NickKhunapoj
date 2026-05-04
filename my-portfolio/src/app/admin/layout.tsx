import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'Admin — Portfolio',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth protection is handled by middleware.ts
  return <ToastProvider>{children}</ToastProvider>;
}
