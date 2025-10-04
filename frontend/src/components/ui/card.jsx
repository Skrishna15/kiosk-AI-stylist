import React from "react";
import { cn } from "@/utils/cn";

export const Card = ({ className, children, ...props }) => (
  <div className={cn("rounded-xl border border-neutral-200 bg-white/90 shadow-sm backdrop-blur-md", className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("p-5 border-b border-neutral-200", className)} {...props}>{children}</div>
);
export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-5", className)} {...props}>{children}</div>
);
export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn("p-5 border-t border-neutral-200", className)} {...props}>{children}</div>
);
