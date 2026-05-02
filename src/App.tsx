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
                      <Route path="/stats" element={<Stats />} />
                      <Route path="/join" element={<JoinClassroom />} />
                      <Route path="/join-family" element={<JoinFamily />} />
                      <Route path="/dashboard" element={<RoleSelector />} />
                      <Route path="/dashboard/teacher" element={<TeacherDashboardPage />} />
                      <Route path="/dashboard/parent" element={<ParentDashboardPage />} />
                      <Route path="/dashboard/student" element={<StudentDashboardPage />} />
                      <Route path="/dashboard/student/checkin" element={<StudentCheckin />} />
                      <Route path="/admin" element={<AdminDashboard />} />
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
