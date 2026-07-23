"use client";

import { BotFlowEditor } from "@/components/bot/flow/BotFlowEditor";
import type { BotStep, BotAgent } from "@/types/bot";
import type { WorkspaceMember, Department } from "@/types/workspace";

interface DecisionBotEditorProps {
  steps: BotStep[];
  onChange: (steps: BotStep[]) => void;
  allBots: BotAgent[];
  allAgents: BotAgent[];
  members?: WorkspaceMember[];
  departments?: Department[];
}

export function DecisionBotEditor(props: DecisionBotEditorProps) {
  return <BotFlowEditor {...props} />;
}
