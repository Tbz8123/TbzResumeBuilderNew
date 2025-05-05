import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Apple-styled large heading
interface LargeHeadingProps {
  children: ReactNode;
  className?: string;
  tag?: "h1" | "h2" | "h3";
  centered?: boolean;
}

export const LargeHeading = ({
  children,
  className = "",
  tag = "h2",
  centered = false,
}: LargeHeadingProps) => {
  const Tag = tag as keyof JSX.IntrinsicElements;
  
  return (
    <Tag
      className={cn(
        "font-bold tracking-tight",
        tag === "h1" && "text-5xl md:text-6xl lg:text-7xl",
        tag === "h2" && "text-4xl md:text-5xl lg:text-6xl",
        tag === "h3" && "text-3xl md:text-4xl lg:text-5xl",
        centered && "text-center",
        className
      )}
    >
      {children}
    </Tag>
  );
};

// Apple-styled subheading
interface SubheadingProps {
  children: ReactNode;
  className?: string;
  tag?: "h3" | "h4" | "h5" | "p";
  centered?: boolean;
}

export const Subheading = ({
  children,
  className = "",
  tag = "h3",
  centered = false,
}: SubheadingProps) => {
  const Tag = tag as keyof JSX.IntrinsicElements;
  
  return (
    <Tag
      className={cn(
        "font-medium tracking-wide",
        tag === "h3" && "text-2xl md:text-3xl",
        tag === "h4" && "text-xl md:text-2xl",
        tag === "h5" && "text-lg md:text-xl",
        tag === "p" && "text-base md:text-lg",
        centered && "text-center",
        className
      )}
    >
      {children}
    </Tag>
  );
};

// Apple-styled full-width section
interface FullWidthSectionProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  dark?: boolean;
  fullHeight?: boolean;
  id?: string;
}

export const FullWidthSection = ({
  children,
  className = "",
  backgroundColor = "bg-white",
  backgroundImage,
  dark = false,
  fullHeight = false,
  id,
}: FullWidthSectionProps) => {
  const backgroundStyle = backgroundImage 
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};
  
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden",
        backgroundColor,
        dark ? "text-white" : "text-black",
        fullHeight && "min-h-screen flex items-center",
        className
      )}
      style={backgroundStyle}
    >
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        {children}
      </div>
    </section>
  );
};

// Apple-styled grid section
interface GridSectionProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: "small" | "medium" | "large";
  centered?: boolean;
}

export const GridSection = ({
  children,
  className = "",
  columns = 3,
  gap = "medium",
  centered = false,
}: GridSectionProps) => {
  const gapClass = {
    small: "gap-4",
    medium: "gap-6 md:gap-8",
    large: "gap-8 md:gap-16",
  }[gap];
  
  const columnsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];
  
  return (
    <div
      className={cn(
        "grid",
        columnsClass,
        gapClass,
        centered && "items-center justify-items-center",
        className
      )}
    >
      {children}
    </div>
  );
};

// Apple-styled product card
interface ProductCardProps {
  title: string;
  description?: string;
  image: string;
  link?: string;
  className?: string;
  dark?: boolean;
  emphasized?: boolean;
}

export const ProductCard = ({
  title,
  description,
  image,
  link,
  className = "",
  dark = false,
  emphasized = false,
}: ProductCardProps) => {
  const card = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        emphasized ? "shadow-xl hover:shadow-2xl" : "shadow-lg hover:shadow-xl",
        dark ? "bg-black text-white" : "bg-white text-black",
        className
      )}
    >
      <div className="p-6 md:p-8">
        <h3 className={cn("text-xl md:text-2xl font-bold mb-2", dark ? "text-white" : "text-black")}>{title}</h3>
        {description && <p className={cn("mb-4", dark ? "text-gray-300" : "text-gray-700")}>{description}</p>}
      </div>
      <div className="relative overflow-hidden">
        <motion.img
          src={image}
          alt={title}
          className="w-full h-auto transform transition-transform duration-700"
          whileHover={{ scale: 1.05 }}
        />
      </div>
    </div>
  );
  
  if (link) {
    return (
      <a href={link} className="block">
        {card}
      </a>
    );
  }
  
  return card;
};

// Apple-styled feature item
interface FeatureItemProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  dark?: boolean;
}

export const FeatureItem = ({
  title,
  description,
  icon,
  className = "",
  dark = false,
}: FeatureItemProps) => {
  return (
    <div
      className={cn(
        "p-6 md:p-8",
        dark ? "text-white" : "text-black",
        className
      )}
    >
      {icon && <div className="mb-4 md:mb-6">{icon}</div>}
      <h3 className={cn("text-xl font-bold mb-2", dark ? "text-white" : "text-black")}>{title}</h3>
      {description && <p className={cn(dark ? "text-gray-300" : "text-gray-700")}>{description}</p>}
    </div>
  );
};

// Apple-styled divider
interface DividerProps {
  className?: string;
  width?: "small" | "medium" | "large" | "full";
  color?: string;
}

export const Divider = ({
  className = "",
  width = "medium",
  color = "bg-gray-200",
}: DividerProps) => {
  const widthClass = {
    small: "w-16",
    medium: "w-24",
    large: "w-32",
    full: "w-full",
  }[width];
  
  return (
    <div
      className={cn(
        "h-px my-6 mx-auto",
        widthClass,
        color,
        className
      )}
    />
  );
};

// Apple-styled button
interface AppleButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "text";
  size?: "small" | "medium" | "large";
  dark?: boolean;
  rounded?: boolean;
  icon?: ReactNode;
}

export const AppleButton = ({
  children,
  className = "",
  href,
  onClick,
  variant = "primary",
  size = "medium",
  dark = false,
  rounded = true,
  icon,
}: AppleButtonProps) => {
  const variantClass = {
    primary: cn(
      "bg-blue-500 text-white hover:bg-blue-600",
      dark && "bg-white text-black hover:bg-gray-200"
    ),
    secondary: cn(
      "bg-gray-200 text-black hover:bg-gray-300",
      dark && "bg-gray-800 text-white hover:bg-gray-700"
    ),
    text: cn(
      "text-blue-500 hover:text-blue-600 px-0",
      dark && "text-blue-400 hover:text-blue-300"
    ),
  }[variant];
  
  const sizeClass = {
    small: "text-sm py-1.5 px-3",
    medium: "text-base py-2 px-4",
    large: "text-lg py-3 px-6",
  }[size];
  
  const buttonClass = cn(
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    rounded && "rounded-full",
    variant !== "text" && "shadow-sm hover:shadow",
    variantClass,
    sizeClass,
    className
  );
  
  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );
  
  if (href) {
    return (
      <a href={href} className={buttonClass}>
        {content}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} className={buttonClass}>
      {content}
    </button>
  );
};

// Apple-styled comparison grid
interface ComparisonGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
  showDividers?: boolean;
  dark?: boolean;
}

export const ComparisonGrid = ({
  children,
  className = "",
  columns = 3,
  showDividers = true,
  dark = false,
}: ComparisonGridProps) => {
  const columnsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns];
  
  return (
    <div
      className={cn(
        "grid gap-0",
        columnsClass,
        showDividers && "divide-x",
        dark ? "divide-gray-700 text-white" : "divide-gray-200 text-black",
        className
      )}
    >
      {children}
    </div>
  );
};

// Apple-styled sticky nav
interface StickySectionNavProps {
  items: { id: string; label: string }[];
  className?: string;
  dark?: boolean;
}

export const StickySectionNav = ({
  items,
  className = "",
  dark = false,
}: StickySectionNavProps) => {
  return (
    <div
      className={cn(
        "sticky top-20 z-30 overflow-x-auto py-4",
        dark ? "bg-black text-white" : "bg-white text-black",
        className
      )}
    >
      <div className="flex space-x-6 justify-center">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "whitespace-nowrap font-medium text-sm md:text-base transition-colors duration-200",
              dark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
};

// Apple-styled specs grid
interface SpecsGridProps {
  specs: { label: string; value: string }[];
  className?: string;
  columns?: 1 | 2;
  dark?: boolean;
}

export const SpecsGrid = ({
  specs,
  className = "",
  columns = 2,
  dark = false,
}: SpecsGridProps) => {
  const columnsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
  }[columns];
  
  return (
    <div
      className={cn(
        "grid gap-6",
        columnsClass,
        dark ? "text-white" : "text-black",
        className
      )}
    >
      {specs.map((spec, index) => (
        <div key={index} className="flex flex-col">
          <span className={cn("text-sm font-medium mb-1", dark ? "text-gray-400" : "text-gray-500")}>
            {spec.label}
          </span>
          <span className={cn("text-base", dark ? "text-white" : "text-black")}>
            {spec.value}
          </span>
        </div>
      ))}
    </div>
  );
};