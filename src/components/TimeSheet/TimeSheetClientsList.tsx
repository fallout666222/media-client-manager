import React, { useMemo } from 'react';
import { TimeEntry, Client, TimeSheetStatus } from '@/types/timesheet';

// Define the system default clients
const DEFAULT_SYSTEM_CLIENTS = [
  "Administrative",
  "Education/Training", 
  "General Research",
  "Network Requests",
  "New Business",
  "Sick Leave",
  "VACATION"
];

interface TimeSheetClientsListProps {
  clientObjects: Client[];
  userRole: 'admin' | 'user' | 'manager';
  adminOverride?: boolean;
  clientsWithEntries: string[];
  selectedClients: string[];
}

export const TimeSheetClientsList = ({
  clientObjects,
  userRole,
  adminOverride = false,
  clientsWithEntries,
  selectedClients
}: TimeSheetClientsListProps) => {
  
  // UPDATED: Filter out hidden clients for regular users, EXCEPT those with time entries
  const visibleClientObjects = useMemo(() => {
    if (userRole === 'admin' || adminOverride) {
      return clientObjects;
    }
    
    // We want to include hidden clients if they have time entries
    return clientObjects.filter(client => 
      !client.hidden || clientsWithEntries.includes(client.name)
    );
  }, [clientObjects, userRole, adminOverride, clientsWithEntries]);

  // Get list of visible client names
  const visibleClientNames = useMemo(() => {
    return visibleClientObjects.map(client => client.name);
  }, [visibleClientObjects]);
  
  // Combine selected clients/media types with those that have entries
  const effectiveClients = useMemo(() => {
    // Get unique clients, filtering out hidden ones for regular users EXCEPT those with entries
    const uniqueClients = [...new Set([
      ...selectedClients.filter(client => 
        userRole === 'admin' || 
        adminOverride || 
        visibleClientNames.includes(client)
      ), 
      ...clientsWithEntries
    ])];
    
    // Keep the order of selectedClients (user's preferred order)
    const orderedClients = [...selectedClients].filter(client => 
      userRole === 'admin' || 
      adminOverride || 
      visibleClientNames.includes(client)
    );
    
    // Add any clients with entries that aren't already in the ordered list
    clientsWithEntries.forEach(client => {
      // UPDATED: Include client if admin, override, OR the client is visible OR has entries
      if (!orderedClients.includes(client) && visibleClientNames.includes(client)) {
        orderedClients.push(client);
      }
    });
    
    // Filter to only include unique clients that are in our combined set
    return orderedClients.filter(client => uniqueClients.includes(client));
  }, [selectedClients, clientsWithEntries, userRole, adminOverride, visibleClientNames]);

  return {
    effectiveClients,
    visibleClientObjects
  };
};
