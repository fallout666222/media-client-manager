
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useClients } from '@/hooks/useClients';
import { AddClientForm } from '@/components/ClientTree/AddClientForm';
import { ClientsTable } from '@/components/ClientTree/ClientsTable';
import { Pagination } from '@/components/ClientTree/Pagination';
import { ClientSearch } from '@/components/ClientTree/ClientSearch';
import { ITEMS_PER_PAGE_OPTIONS } from '@/components/ClientTree/constants';

const ClientTree: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { clients, isLoading } = useClients();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
        />

        <ClientsTable 
          clients={clients} 
          paginatedClients={paginatedClients} 
        />

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          startIndex={startIndex}
          totalItems={filteredClients.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};

export default ClientTree;
