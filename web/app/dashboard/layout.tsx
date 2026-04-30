import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server-auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
