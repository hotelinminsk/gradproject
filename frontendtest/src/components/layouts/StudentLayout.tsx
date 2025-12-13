import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import StudentBottomNav from "@/components/student/StudentBottomNav";

export default function StudentLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main>{children ?? <Outlet />}</main>
      <StudentBottomNav />
    </>
  );
}
