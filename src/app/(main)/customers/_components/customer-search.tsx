"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface CustomerSearchProps {
  currentSearch: string;
}

export function CustomerSearch({ currentSearch }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to first page
      router.push(`/dashboard/customers?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearchTerm("");
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      params.set("page", "1");
      router.push(`/dashboard/customers?${params.toString()}`);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8"
          disabled={isPending}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2"
            onClick={handleClear}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} disabled={isPending}>
        Buscar
      </Button>
    </div>
  );
}
