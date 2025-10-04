import React from "react";
import { cn } from "@/utils/cn";

export const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-input bg-white px-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-800",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export const SelectOption = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);
