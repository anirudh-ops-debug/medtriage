import { createContext, useContext, ReactNode } from "react";
import { useAuth, UserRole } from "./AuthContext";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({ role: "admin", setRole: () => {} });

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { role } = useAuth();
  // setRole is a no-op now — role comes from database
  return <RoleContext.Provider value={{ role, setRole: () => {} }}>{children}</RoleContext.Provider>;
};

export const useRole = () => useContext(RoleContext);
export type { UserRole };
