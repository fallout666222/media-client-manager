
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useClients } from '@/hooks/useClients';
import { AddClientForm } from '@/components/ClientTree/AddClientForm';
import { ClientsTable } from '@/components/ClientTree/ClientsTable';
import { Pagination } from '@/components/ClientTree/Pagination';
import { ClientSearch } from '@/components/ClientTree/ClientSearch';
import { ITEMS_PER_PAGE_OPTIONS, DEFAULT_SYSTEM_CLIENTS } from '@/components/ClientTree/constants';
import { Client } from '@/types/timesheet';

interface SortConfig {
  key: 'name' | 'parentName' | 'hidden';
  direction: 'asc' | 'desc';
}

const ClientTree: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const { clients, isLoading } = useClients();

  // Apply filters and sorting
  const filteredAndSortedClients = React.useMemo(() => {
    // First, filter by name search
    let result = clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Then filter by parent client
    if (parentSearchQuery) {
      const parentIds = clients.filter(client => 
        client.name.toLowerCase().includes(parentSearchQuery.toLowerCase())
      ).map(client => client.id);

      result = result.filter(client => 
        client.parentId && parentIds.includes(client.parentId)
      );
    }

    // Apply sorting with system defaults always at the top
    return [...result].sort((a, b) => {
      // First sort by system default status
      const aIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(a.name);
      const bIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(b.name);
      
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      
      // Then sort by the selected column
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      if (sortConfig.key === 'parentName') {
        const aParent = clients.find(c => c.id === a.parentId);
        const bParent = clients.find(c => c.id === b.parentId);
        const aParentName = aParent ? aParent.name : '';
        const bParentName = bParent ? bParent.name : '';
        
        return sortConfig.direction === 'asc'
          ? aParentName.localeCompare(bParentName)
          : bParentName.localeCompare(aParentName);
      }
      
      if (sortConfig.key === 'hidden') {
        if (sortConfig.direction === 'asc') {
          return a.hidden === b.hidden ? 0 : a.hidden ? 1 : -1;
        } else {
          return a.hidden === b.hidden ? 0 : a.hidden ? -1 : 1;
        }
      }
      
      return 0;
    });
  }, [clients, searchQuery, parentSearchQuery, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleSort = (config: SortConfig) => {
    setSortConfig(config);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, parentSearchQuery]);

  if (isLoading) {
    return <div className="container mx-auto p-4 pt-16">Loading clients...</div>;
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Client Tree Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <AddClientForm clients={clients} />

      <div className="space-y-4">
        <ClientSearch 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          parentSearchQuery={parentSearchQuery}
          onParentSearchChange={setParentSearchQuery}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
          clients={clients}
        />

        <ClientsTable 
          clients={clients} 
          paginatedClients={paginatedClients}
          onSort={handleSort}
          sortConfig={sortConfig}
        />

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          startIndex={startIndex}
          totalItems={filteredAndSortedClients.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};

export default ClientTree;
