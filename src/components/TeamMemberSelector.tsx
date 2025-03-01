
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "@/types/timesheet";

interface TeamMemberSelectorProps {
  currentUser: User;
  users: User[];
  onUserSelect: (user: User) => void;
  selectedUser: User;
}

export function TeamMemberSelector({
  currentUser,
  users,
  onUserSelect,
  selectedUser,
}: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter team members (users who have this manager as their manager)
  const teamMembers = users.filter(
    (user) => user.managerId === currentUser.id || user.id === currentUser.id
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between md:w-[250px]"
        >
          {selectedUser.username}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 md:w-[250px]">
        <Command>
          <CommandInput placeholder="Search team member..." />
          <CommandEmpty>No team member found.</CommandEmpty>
          <CommandGroup>
            {teamMembers.map((user) => (
              <CommandItem
                key={user.id}
                value={user.username}
                onSelect={() => {
                  onUserSelect(user);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedUser.id === user.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {user.username} {user.id === currentUser.id ? "(myself)" : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
