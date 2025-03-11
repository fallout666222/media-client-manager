
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
  onUserChange?: (userId: string) => void; // Add this prop
}

export function TeamMemberSelector({
  currentUser,
  users,
  onUserSelect,
  selectedUser,
  onUserChange
}: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter team members based on user role and user head status
  const getTeamMembers = () => {
    if (currentUser.role === "admin") {
      // Admin can see all users
      return users;
    } else if (currentUser.role === "manager") {
      // Manager can see themselves and their team members (users who have this manager set as their manager)
      return users.filter(
        (user) => user.managerId === currentUser.id || user.id === currentUser.id
      );
    } else {
      // Regular users can see themselves and users who have them set as User Head
      return users.filter(
        (user) => user.id === currentUser.id || user.user_head_id === currentUser.id
      );
    }
  };

  const teamMembers = getTeamMembers();
  
  // Disable the dropdown if there's only one team member (themselves)
  const isDisabled = teamMembers.length === 1;
  
  // Handle user selection and call the onUserChange prop if it exists
  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    if (onUserChange && user.id) {
      onUserChange(user.id);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between md:w-[250px]"
          disabled={isDisabled}
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
                onSelect={() => handleUserSelect(user)}
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
