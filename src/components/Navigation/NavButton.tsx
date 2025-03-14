
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NavButtonProps {
  to: string;
  children: React.ReactNode;
}

export function NavButton({ to, children }: NavButtonProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to}>
      <Button 
        variant={isActive ? "active" : "outline"} 
        size="sm" 
        className="flex items-center gap-2"
      >
        {children}
      </Button>
    </Link>
  );
}
