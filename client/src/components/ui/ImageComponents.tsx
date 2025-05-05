import { cn } from "@/lib/utils";
import React from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  objectFit?: "cover" | "contain" | "fill" | "none";
  rounded?: boolean | "sm" | "md" | "lg" | "full";
}

/**
 * Centralized Image component with consistent styling and fallback handling
 */
export const Image = ({
  src,
  alt = "",
  fallback = "https://via.placeholder.com/400x300?text=Image+Not+Found",
  aspectRatio = "auto",
  objectFit = "cover",
  rounded = false,
  className,
  ...props
}: ImageProps) => {
  // Aspect ratio classes
  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  };

  // Object fit classes
  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
  };

  // Rounded corner classes
  const getRoundedClasses = () => {
    if (rounded === true) return "rounded";
    if (rounded === false) return "";
    return {
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    }[rounded];
  };

  // Handle image loading error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = fallback;
  };

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className={cn(
        "w-full h-auto",
        aspectRatioClasses[aspectRatio],
        objectFitClasses[objectFit],
        getRoundedClasses(),
        className
      )}
      {...props}
    />
  );
};

/**
 * Centralized Template Preview component with consistent styling
 */
export const TemplatePreview = ({
  image,
  title,
  hoverText = "Preview",
  className,
}: {
  image: string;
  title: string;
  hoverText?: string;
  className?: string;
}) => {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-white", className)}>
      <Image
        src={image}
        alt={`${title} template`}
        aspectRatio="portrait"
        className="w-full h-48"
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <span className="text-white font-bold">{hoverText}</span>
      </div>
    </div>
  );
};