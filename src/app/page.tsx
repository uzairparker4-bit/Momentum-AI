import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { getActiveGoal } from "@/actions/goals";

export default async function RootPage() {
  const session = await auth();

  // Not logged in — show login
  if (!session?.user?.id) {
    return <LoginPage />;
  }

  // Check if user has an active goal
  const goal = await getActiveGoal(session.user.id);

  if (!goal) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
