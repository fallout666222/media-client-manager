
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/timesheet";

interface ClientSelectorProps {
  clients: Client[];
  onClientSelect: (client: Client | null) => void;
  selectedClient?: Client | null;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  autoOpenOnFocus?: boolean;
  clearSearchOnSelect?: boolean;
  showNoResultsMessage?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ClientSelector({
  clients,
  onClientSelect,
  selectedClient,
  searchValue,
  onSearchChange,
  autoOpenOnFocus = false,
  clearSearchOnSelect = true,
  showNoResultsMessage = true,
  className = "",
  placeholder = "Search clients...",
  disabled = false
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use either the external search value or the internal one
  const searchTerm = searchValue !== undefined ? searchValue : internalSearchValue;

  // Ensure clients is always an array
  const safeClients = Array.isArray(clients) ? clients : [];
  
  // Filter clients based on search term
  const filteredClients = safeClients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      (client.name || '').toLowerCase().includes(search)
    );
  });

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchValue(value);
    }
    
    // Auto-open the dropdown when typing
    if (value.length > 0 && !open) {
      setOpen(true);
    }
  };

  // Handle selection of a client
  const handleSelect = (client: Client) => {
    onClientSelect(client);
    
    if (clearSearchOnSelect) {
      if (onSearchChange) {
        onSearchChange('');
      } else {
        setInternalSearchValue('');
      }
    }
    
    setOpen(false);
  };

  // Clear search input and selection
  const clearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    } else {
      setInternalSearchValue('');
    }
    setOpen(false);
  };

  // Clear selection (set to null)
  const clearSelection = () => {
    onClientSelect(null);
    clearSearch();
  };

  if (disabled) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between border border-input bg-muted px-3 py-2 rounded-md text-muted-foreground">
          {selectedClient ? selectedClient.name : "None"}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        {selectedClient ? (
          <div className="flex items-center justify-between border border-input px-3 py-2 rounded-md">
            <div className="pl-6">
              {selectedClient.name}
            </div>
            <button
              onClick={clearSelection}
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => autoOpenOnFocus && setOpen(true)}
            className="pl-8 pr-8"
          />
        )}
        {!selectedClient && searchTerm && (
          <button 
            className="absolute right-2 top-2.5"
            onClick={clearSearch}
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      {open && !selectedClient && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-input rounded-md shadow-lg">
          {filteredClients.length > 0 ? (
            <ul className="py-1 max-h-60 overflow-auto">
              <li 
                key="none"
                className={cn(
                  "px-3 py-2 flex items-center hover:bg-accent hover:text-accent-foreground cursor-pointer"
                )}
                onClick={() => onClientSelect(null)}
              >
                <span className="flex-1">None</span>
              </li>
              {filteredClients.map((client) => (
                <li 
                  key={client.id}
                  className={cn(
                    "px-3 py-2 flex items-center hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  )}
                  onClick={() => handleSelect(client)}
                >
                  <span className="flex-1">
                    {client.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            showNoResultsMessage && (
              <div className="p-3 text-sm text-muted-foreground">
                No clients match your search criteria
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
