
import React from 'react';
import { Client } from '@/types/timesheet';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SortConfig {
  key: 'name' | 'parentName' | 'hidden';
  direction: 'asc' | 'desc';
}

interface ClientsTableProps {
  clients: Client[];
  paginatedClients: Client[];
  onSort: (config: SortConfig) => void;
  sortConfig: SortConfig;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  paginatedClients,
  onSort,
  sortConfig,
}) => {
  const handleSort = (key: 'name' | 'parentName' | 'hidden') => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSort({ key, direction });
  };

  const getSortIcon = (key: 'name' | 'parentName' | 'hidden') => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const getParentName = (client: Client) => {
    if (!client.parentId) return '';
    const parent = clients.find(c => c.id === client.parentId);
    return parent ? parent.name : '';
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[300px] cursor-pointer"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span>Client Name</span>
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('parentName')}
            >
              <div className="flex items-center space-x-1">
                <span>Parent Client</span>
                {getSortIcon('parentName')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('hidden')}
            >
              <div className="flex items-center space-x-1">
                <span>Status</span>
                {getSortIcon('hidden')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                No clients found
              </TableCell>
            </TableRow>
          ) : (
            paginatedClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{getParentName(client)}</TableCell>
                <TableCell>
                  {client.hidden ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
                      Hidden
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                      Visible
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
