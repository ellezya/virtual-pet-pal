import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProgressProvider } from "@/hooks/useProgress";
import { FamilyProvider } from "@/hooks/useFamily";
import { ClassroomProvider } from "@/hooks/useClassroom";
import { SelfCareProvider } from "@/hooks/useSelfCare";
import { SoundProvider } from "@/contexts/SoundContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Stats from "./pages/Stats";
import JoinClassroom from "./pages/JoinClassroom";
import JoinFamily from "./pages/JoinFamily";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import RoleSelector from "./pages/RoleSelector";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import ParentDashboardPage from "./pages/ParentDashboardPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import PrincipalDashboardPage from "./pages/PrincipalDashboardPage";
import StudentCheckin from "./pages/StudentCheckin";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FamilyProvider>
            <ClassroomProvider>
              <ProgressProvider>
                <SelfCareProvider>
                  <SoundProvider>
                    <OfflineIndicator />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/join" element={<JoinClassroom />} />
                      <Route path="/join-family" element={<JoinFamily />} />
                      <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                      <Route path="/dashboard" element={<ProtectedRoute><RoleSelector /></ProtectedRoute>} />
                      <Route path="/dashboard/parent" element={<ProtectedRoute><ParentDashboardPage /></ProtectedRoute>} />
                      <Route path="/dashboard/student" element={<ProtectedRoute><StudentDashboardPage /></ProtectedRoute>} />
                      <Route path="/dashboard/student/checkin" element={<ProtectedRoute><StudentCheckin /></ProtectedRoute>} />
                      <Route path="/dashboard/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboardPage /></ProtectedRoute>} />
                      <Route path="/dashboard/principal" element={<ProtectedRoute requiredRole="principal"><PrincipalDashboardPage /></ProtectedRoute>} />
                      <Route path="/admin" element={<ProtectedRoute requiredRole="platform_admin"><AdminDashboard /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <PWAInstallPrompt />
                  </SoundProvider>
                </SelfCareProvider>
              </ProgressProvider>
            </ClassroomProvider>
          </FamilyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
