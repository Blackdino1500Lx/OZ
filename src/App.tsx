import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { HomePage } from '@/features/items/HomePage';
import { ItemDetailPage } from '@/features/items/ItemDetailPage';
import { ItemEditPage } from '@/features/items/ItemEditPage';
import { AgendaPage } from '@/features/items/AgendaPage';
import { SearchPage } from '@/features/items/SearchPage';
import { CategoriesPage } from '@/features/categories/CategoriesPage';
import { AppLayout } from '@/components/layout/AppLayout';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/items/:id" element={<ItemDetailPage />} />
                <Route path="/items/:id/edit" element={<ItemEditPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}