import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X, Search } from "lucide-react";

export const AdvancedFilters = ({ filters, setFilters, onApply, onClear }) => {
  const shiftTypes = [
    { value: "all", label: "Todos los turnos" },
    { value: "normal", label: "Turno normal" },
    { value: "permiso_retribuido", label: "Permiso retribuido" },
    { value: "incapacidad_temporal", label: "Incapacidad temporal" },
    { value: "accidente_trabajo", label: "Accidente de trabajo" }
  ];

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="w-4 h-4" />
          Filtros Avanzados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by comment */}
          <div className="space-y-2">
            <Label className="text-xs">Buscar en comentarios</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>

          {/* Filter by type */}
          <div className="space-y-2">
            <Label className="text-xs">Tipo de turno</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shiftTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by date range */}
          <div className="space-y-2">
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={onApply} size="sm" className="gap-1">
            <Filter className="w-3 h-3" />
            Aplicar filtros
          </Button>
          <Button onClick={onClear} variant="outline" size="sm" className="gap-1">
            <X className="w-3 h-3" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
