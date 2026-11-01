// Human-in-the-loop controls for the autopilot: run a task now, approve/reject queued actions, toggle tasks, add custom tasks.
import { workspaceId } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { runTasks, execute, type Action } from "@/lib/autopilot";
import { uid, defaultTasks, type Task } from "@/lib/schema";
import { audit } from "@/lib/pipeline";
export const maxDuration = 60;
export async function POST(req: Request) {
  const b = await req.json(); const ws = await workspaceId(); let result: unknown = null;
  const w = await mutate(ws, async (w) => { w.tasks ??= defaultTasks(); w.approvals ??= [];
    if (b.action === "run") result = await runTasks(w, ws, { taskId: b.taskId });
    if (b.action === "runAll") result = await runTasks(w, ws, { now: Date.now() + 1e12 });
    if (b.action === "toggle") { const t = w.tasks.find((x) => x.id === b.taskId); if (t) Object.assign(t, b.patch ?? {}); }
    if (b.action === "addTask") w.tasks.push({ id: uid("t"), name: b.name ?? "Custom task", kind: b.kind ?? "custom", schedule: b.schedule ?? "daily", enabled: true, approval: b.approval ?? true, prompt: b.prompt } as Task);
    if (b.action === "deleteTask") w.tasks = w.tasks.filter((t) => t.id !== b.taskId);
    if (b.action === "approve" || b.action === "reject") { for (const id of (b.ids ?? [b.id]) as string[]) { const a = w.approvals.find((x) => x.id === id && x.status === "pending"); if (!a) continue;
      if (b.action === "reject") { a.status = "rejected"; continue; } if (b.text && a.action.type === "message") a.action.payload.text = b.text; a.status = "approved"; result = await execute(w, a.action as Action, ws); a.status = "done"; a.detail = `${a.detail}\n→ ${result}`; }
      audit(w, "owner", `approval.${b.action}`, String((b.ids ?? [b.id]).length)); }
  });
  return Response.json({ result, tasks: w.tasks, approvals: w.approvals });
}
