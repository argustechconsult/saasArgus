import React from 'react';
import { useNavigate, useLocation, Link as RRLink } from 'react-router-dom';

// Emulates next/navigation useRouter
export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {
       // In a real Next.js app this refreshes server components. 
       // Here we can simulate a simple re-render or do nothing.
       window.location.reload(); 
    }
  };
};

// Emulates next/navigation usePathname
export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

// Emulates next/link
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ href, children, className, ...props }) => {
  return (
    <RRLink to={href} className={className} {...props as any}>
      {children}
    </RRLink>
  );
};