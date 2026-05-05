import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ClassroomProvider } from "@/hooks/useClassroom";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RoleSelectorAdmin from "./pages/RoleSelectorAdmin";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import PrincipalDashboardPage from "./pages/PrincipalDashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import AuthorityAdminPage from "./pages/admin/AuthorityAdminPage";

const queryClient = new QueryClient();

const AppAdmin = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ClassroomProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><RoleSelectorAdmin /></ProtectedRoute>} />
              <Route path="/dashboard/teacher" element={<ProtectedRoute requiredRole={['teacher', 'school_admin']}><TeacherDashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/principal" element={<ProtectedRoute requiredRole="principal"><PrincipalDashboardPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="platform_admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/authority" element={<ProtectedRoute requiredRole="authority_admin"><AuthorityAdminPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClassroomProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppAdmin;
