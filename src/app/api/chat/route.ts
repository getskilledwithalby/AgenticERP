import { createAgentUIStreamResponse, UIMessage } from "ai";
import { createAccountingAgent } from "@/lib/agent";
import { getFirstCompany, getActiveFiscalYear } from "@/lib/db/queries/companies";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Get company context
  const company = await getFirstCompany();
  if (!company) {
    return new Response("No company found", { status: 500 });
  }

  const fiscalYear = await getActiveFiscalYear(company.id);

  const agent = createAccountingAgent(
    company.id,
    company.name,
    fiscalYear?.name ?? "—"
  );

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
