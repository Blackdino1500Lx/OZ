import { useState, useMemo } from 'react';
import { useItems } from './hooks';
import { ItemCard } from './ItemCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchPage() {
  const { data: items, isLoading } = useItems();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return (items || []).filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q) || false;
      const matchNotes = item.item_notes?.some((note) => note.body.toLowerCase().includes(q)) || false;
      
      return matchTitle || matchDesc || matchNotes;
    });
  }, [items, query]);

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">Buscar</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar en títulos, descripciones y notas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-center text-muted-foreground py-4">Cargando...</p>}
        
        {!isLoading && query.trim() !== '' && results.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No se encontraron resultados para "{query}".
          </p>
        )}

        {results.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}