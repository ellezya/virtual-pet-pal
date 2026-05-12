import ClassroomPets from "@/components/ClassroomPets";

// Lola is a destination, not a forced landing. Authenticated users are routed to
// their dashboard via Auth.tsx → /dashboard → RoleSelector auto-redirect.
// This page remains accessible as the Lola experience for all users.
export default function Index() {
  return <ClassroomPets />;
}
