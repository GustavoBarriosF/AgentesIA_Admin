import { ConversationList } from "@/components/conversations/ConversationList";
import { ChatPanel } from "@/components/conversations/ChatPanel";

export default function ConversationsPage() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — list */}
      <div className="w-80 shrink-0 flex flex-col overflow-hidden">
        <ConversationList />
      </div>

      {/* Right panel — chat */}
      <ChatPanel />
    </div>
  );
}
