import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  href?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Centralized button component with consistent styling across the application
 */
export const AppButton = ({
  variant = "primary",
  size = "md",
  asChild = false,
  href,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className,
  children,
  ...props
}: AppButtonProps) => {
  // Map our variant names to shadcn variants
  const variantMap = {
    primary: "default",
    secondary: "secondary",
    outline: "outline",
    ghost: "ghost",
    link: "link",
    destructive: "destructive",
  };

  // Map our size names to classes
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  };

  const buttonContent = (
    <>
      {icon && iconPosition === "left" && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Button
        variant={variantMap[variant] as any}
        className={cn(
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        asChild
        {...props}
      >
        <a href={href}>{buttonContent}</a>
      </Button>
    );
  }

  return (
    <Button
      variant={variantMap[variant] as any}
      className={cn(
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      asChild={asChild}
      {...props}
    >
      {buttonContent}
    </Button>
  );
};

/**
 * Call to Action button with predefined styling
 */
export const CTAButton = ({
  children,
  className,
  ...props
}: Omit<AppButtonProps, "variant" | "size">) => {
  return (
    <AppButton
      variant="secondary"
      size="lg"
      className={cn(
        "bg-secondary hover:bg-yellow-500 text-black font-bold shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </AppButton>
  );
};