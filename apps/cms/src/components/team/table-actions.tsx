import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { MoreHorizontal, User, UserMinus } from "lucide-react";
import { useState } from "react";
import type { TeamMember } from "./columns";
import { RemoveMemberModal } from "./team-modals";

export default function TableActions(props: TeamMember) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={props.role === "owner"}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <button
              type="button"
              onClick={() => {
                console.log("view profile");
              }}
            >
              View Profile
            </button>
          </DropdownMenuItem>
          {props.role !== "owner" && (
            <DropdownMenuItem>
              <button type="button" onClick={() => setShowRemoveModal(true)}>
                Remove Member
              </button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveMemberModal
        open={showRemoveModal}
        setOpen={setShowRemoveModal}
        member={props}
      />
    </>
  );
}
