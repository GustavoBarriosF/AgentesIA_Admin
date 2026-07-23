"use client";

import { useState } from "react";
import { CampaignList }   from "@/components/campaigns/CampaignList";
import { CampaignWizard } from "@/components/campaigns/CampaignWizard";
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { Megaphone }      from "lucide-react";

type View = "list" | "create" | "detail";

export default function CampaignsPage() {
  const [view, setView]           = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setView("detail");
  };

  const handleCreate = () => {
    setSelectedId(null);
    setView("create");
  };

  const handleWizardSuccess = (id: string) => {
    setSelectedId(id);
    setView("detail");
  };

  const handleWizardCancel = () => {
    setView(selectedId ? "detail" : "list");
  };

  const handleDeleted = () => {
    setSelectedId(null);
    setView("list");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — Campaign list */}
      <div className="w-72 shrink-0 h-full overflow-hidden">
        <CampaignList
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
        />
      </div>

      {/* Right panel */}
      <div className="flex-1 h-full overflow-hidden">
        {view === "create" && (
          <CampaignWizard
            onDone={handleWizardSuccess}
            onCancel={handleWizardCancel}
          />
        )}

        {view === "detail" && selectedId && (
          <CampaignDetail
            campaignId={selectedId}
            onDeleted={handleDeleted}
          />
        )}

        {view === "list" && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10">
            <Megaphone className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium">Selecciona una campaña</p>
            <p className="text-sm mt-1">o crea una nueva con el botón "Nueva"</p>
          </div>
        )}
      </div>
    </div>
  );
}
