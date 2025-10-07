import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, ...props }, ref) => {
    // Convert null to empty string for controlled inputs
    const inputValue = value === null ? '' : value;
    
    return (
      <input
        type={type}
        value={inputValue}
        className={cn(
          "flex h-11 w-full rounded-xl border border-input bg-background px-4 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

