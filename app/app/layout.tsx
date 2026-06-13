import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="lg:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto scrollbar">{children}</main>
    </div>
  );
}
