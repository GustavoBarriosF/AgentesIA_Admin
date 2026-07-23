"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/lib/hooks/useLeads";
import { LeadColumn, STAGE_CONFIG } from "@/components/leads/LeadColumn";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import type { Lead, LeadStage } from "@/types/lead";

const STAGES = Object.keys(STAGE_CONFIG) as LeadStage[];

export default function LeadsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createStage, setCreateStage] = useState<LeadStage>("new");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading } = useLeads();

  // Group leads by stage client-side
  const byStage = STAGES.reduce<Record<LeadStage, Lead[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<LeadStage, Lead[]>
  );
  for (const lead of data?.leads ?? []) {
    if (lead.stage in byStage) {
      byStage[lead.stage].push(lead);
    }
  }

  const handleAddClick = (stage: LeadStage) => {
    setCreateStage(stage);
    setCreateOpen(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
        <div>
          <h1 className="text-base font-bold">Pipeline de Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.total ?? 0} leads en total
          </p>
        </div>
        <Button size="sm" onClick={() => { setCreateStage("new"); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nuevo lead
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-4 min-w-max">
          {STAGES.map((stage) => (
            <LeadColumn
              key={stage}
              stage={stage}
              leads={byStage[stage]}
              isLoading={isLoading}
              onCardClick={(lead) => setSelectedLead(lead)}
              onAddClick={() => handleAddClick(stage)}
            />
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <CreateLeadDialog
        open={createOpen}
        defaultStage={createStage}
        onOpenChange={setCreateOpen}
      />
      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(v) => { if (!v) setSelectedLead(null); }}
      />
    </div>
  );
}
