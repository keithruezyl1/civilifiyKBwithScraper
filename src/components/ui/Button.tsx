import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-md hover:-translate-y-[1px] active:bg-orange-700 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 hover:shadow-md hover:-translate-y-[1px] active:bg-red-800 shadow-sm",
        outline: "border-2 border-orange-500 text-orange-700 bg-transparent hover:bg-transparent hover:border-orange-600 hover:text-orange-800 hover:-translate-y-[1px] active:bg-transparent shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        delete: "bg-red-600 text-white hover:bg-red-700 hover:shadow-md hover:-translate-y-[1px] active:bg-red-800 shadow-sm",
        success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-[1px] active:bg-green-800 shadow-sm",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 rounded-lg",
        lg: "h-12 px-6 rounded-2xl",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

