import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { inviteLink } from "../lib/format";
import { button } from "../lib/ui";

const InviteButton = ({ roomId, label = "Copy invite link" }: { roomId: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(inviteLink(roomId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button type="button" onClick={copy} className={button.secondary}>
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
};

export default InviteButton;
