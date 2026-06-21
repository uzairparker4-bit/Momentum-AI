import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveGoal } from "@/actions/goals";
import OnboardingFlow from "@/components/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // If they already have a goal, go to dashboard
  const goal = await getActiveGoal(session.user.id);
  if (goal) redirect("/dashboard");

  return <OnboardingFlow userId={session.user.id} />;
}
