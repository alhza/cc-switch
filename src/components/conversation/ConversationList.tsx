import { ConversationMeta } from "../../types";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  conversations: ConversationMeta[];
  onDelete: (filePath: string) => void;
  onView: (conversation: ConversationMeta) => void;
}

export function ConversationList({
  conversations,
  onDelete,
  onView,
}: ConversationListProps) {
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
}

