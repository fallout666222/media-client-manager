
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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
}

export function TeamMemberSelector({
  currentUser,
  users,
  onUserSelect,
  selectedUser,
  placeholder = "Select team member"
}: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Get initial team members
  const teamMembers = getTeamMembers();
  
  // Filter team members by search term
  const filteredTeamMembers = searchTerm 
    ? teamMembers.filter(member => 
        (member.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (member.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (member.login?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      )
    : teamMembers;
  
  // Disable the dropdown if there's only one team member (themselves)
  const isDisabled = teamMembers.length === 1;

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
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
          {selectedUser?.username || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 md:w-[250px]">
        <Command>
          <div className="flex items-center px-3 border-b">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Search team member..." 
              className="h-9 w-full border-0 outline-none focus:ring-0 px-0"
              onValueChange={handleSearchChange}
            />
          </div>
          <CommandEmpty>No team member found.</CommandEmpty>
          <CommandGroup>
            {filteredTeamMembers.map((user) => (
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
                    selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
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
