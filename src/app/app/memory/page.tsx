import { redirect } from "next/navigation";
// Memory & NBA was folded into the agent + store (standard memory) and the Admin AI console.
export default function M() { redirect("/app/admin?tab=ai"); }
