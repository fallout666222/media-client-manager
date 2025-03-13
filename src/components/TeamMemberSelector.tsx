
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
  placeholder?: string;
  showNoneOption?: boolean;
}

export function TeamMemberSelector({
  currentUser,
  users,
  onUserSelect,
  selectedUser,
  placeholder = "Select team member",
  showNoneOption = true,
}: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter team members based on user role and user head status
  const getTeamMembers = () => {
    let teamMembers = [];
    
    // Ensure users is an array before filtering
    const usersArray = Array.isArray(users) ? users : [];
    
    if (currentUser.role === "admin") {
      // Admin can see all users
      teamMembers = usersArray;
    } else if (currentUser.role === "manager") {
      // Manager can see themselves and their team members (users who have this manager set as their manager)
      teamMembers = usersArray.filter(
        (user) => user.managerId === currentUser.id || user.id === currentUser.id
      );
    } else {
      // Regular users can see themselves and users who have them set as User Head
      teamMembers = usersArray.filter(
        (user) => user.id === currentUser.id || user.user_head_id === currentUser.id
      );
    }
    
    // Add a "None" option at the top if requested
    if (showNoneOption) {
      teamMembers = [{ id: "none", username: "No User Head" } as User, ...teamMembers];
    }
    
    return teamMembers;
  };

  const teamMembers = getTeamMembers();
  
  // Filter the team members based on search value
  const filteredTeamMembers = searchValue 
    ? teamMembers.filter(user => 
        ((user.username || "") + "").toLowerCase().includes(searchValue.toLowerCase()) ||
        ((user.login || "") + "").toLowerCase().includes(searchValue.toLowerCase())
      )
    : teamMembers;
  
  // Disable the dropdown if there's only one team member (themselves)
  const isDisabled = teamMembers.length === 1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isDisabled}
        >
          {selectedUser?.username || selectedUser?.login || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search team member..." 
            onValueChange={(value) => setSearchValue(value)}
          />
          <CommandEmpty>No team member found.</CommandEmpty>
          <CommandGroup>
            {filteredTeamMembers.map((user) => (
              <CommandItem
                key={user.id}
                value={user.username || user.login || ""}
                onSelect={() => {
                  onUserSelect(user);
                  setOpen(false);
                  setSearchValue("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {user.username || user.login} {user.id === currentUser.id ? "(myself)" : ""}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
