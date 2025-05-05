import { cn } from "@/lib/utils";
import React from "react";

type CardStyleProps = {
  variant?: "default" | "feature" | "template" | "blog";
  className?: string;
  children: React.ReactNode;
};

/**
 * Centralized card styling component to ensure consistent visual styling
 * across different types of cards used throughout the application
 */
export const CardStyles = ({ 
  variant = "default", 
  className, 
  children 
}: CardStyleProps) => {
  const baseStyles = "rounded-lg overflow-hidden transition-shadow";
  
  const variantStyles = {
    default: "bg-white shadow-sm hover:shadow-md",
    feature: "bg-gray-light p-6",
    template: "bg-white shadow-md hover:shadow-lg",
    blog: "bg-gray-light overflow-hidden shadow-sm hover:shadow-md",
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </div>
  );
};

/**
 * Section container with consistent styling
 */
type SectionContainerProps = {
  background?: "white" | "light" | "primary" | "dark";
  className?: string;
  children: React.ReactNode;
};

export const SectionContainer = ({
  background = "white",
  className,
  children
}: SectionContainerProps) => {
  const bgStyles = {
    white: "bg-white",
    light: "bg-gray-light",
    primary: "bg-primary text-white",
    dark: "bg-gray-900 text-white",
  };

  return (
    <section className={cn("py-16", bgStyles[background], className)}>
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  );
};

/**
 * Section heading with consistent styling
 */
type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
};

export const SectionHeading = ({
  title,
  subtitle,
  centered = true,
  className
}: SectionHeadingProps) => {
  return (
    <div className={cn("mb-12", centered && "text-center", className)}>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      {subtitle && (
        <p className="text-lg text-gray-dark max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};