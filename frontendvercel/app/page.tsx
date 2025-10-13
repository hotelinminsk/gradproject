import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to teacher login by default
  redirect("/teacher/login")
}
