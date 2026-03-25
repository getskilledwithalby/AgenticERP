import { ToolLoopAgent, stepCountIs } from "ai";
import { buildSystemPrompt } from "./system-prompt";
import { createAccountingTools } from "./tools";

export function createAccountingAgent(
  companyId: string,
  companyName: string,
  fiscalYearName: string
) {
  return new ToolLoopAgent({
    model: "anthropic/claude-sonnet-4.6",
    instructions: buildSystemPrompt(companyName, fiscalYearName),
    tools: createAccountingTools(companyId),
    stopWhen: stepCountIs(15),
  });
}
