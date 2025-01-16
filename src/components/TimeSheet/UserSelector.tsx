import React from 'react';
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
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/timesheet";

interface UserSelectorProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const UserSelector = ({
  users,
  selectedUser,
  onUserSelect,
  open,
  setOpen
}: UserSelectorProps) => {
  return (
    <div className="w-full max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUser ? selectedUser.username : "Select user..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command className="w-full bg-popover">
            <CommandInput 
              placeholder="Search users..." 
              className="h-9 border-none focus:ring-0"
            />
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {users.map((user) => (
                <CommandItem
                  key={user.username}
                  value={user.username}
                  onSelect={() => {
                    onUserSelect(user);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUser?.username === user.username ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.username}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};