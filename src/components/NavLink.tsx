"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function NavLink({ href, children, className = "" }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link href={href} className={`modern-nav-link ${isActive ? "active" : ""} ${className}`}>
      {children}
    </Link>
  );
}



