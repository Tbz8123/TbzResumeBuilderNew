import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParallaxSectionProps {
  backgroundImage?: string;
  backgroundColor?: string;
  children: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  speed?: number; // Positive for slower, negative for faster than scroll
  direction?: "up" | "down";
  fullHeight?: boolean;
  minHeight?: string;
  id?: string;
  darkMode?: boolean;
}

export const ParallaxSection = ({
  backgroundImage,
  backgroundColor = "bg-white",
  children,
  className = "",
  overlay = false,
  overlayOpacity = 0.5,
  overlayColor = "black",
  speed = 0.15,
  direction = "up",
  fullHeight = false,
  minHeight = "min-h-[500px]",
  id,
  darkMode = false,
}: ParallaxSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // The direction of the transform depends on the direction prop
  const speedFactor = direction === "up" ? -speed : speed;
  
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${speedFactor * 100}%`]
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        backgroundColor,
        fullHeight ? "min-h-screen" : minHeight,
        darkMode ? "text-white" : "text-black",
        className
      )}
    >
      {/* Parallax Background */}
      {backgroundImage && mounted && (
        <motion.div
          style={{
            y,
            position: "absolute",
            height: `${100 + Math.abs(speedFactor) * 100}%`,
            width: "100%",
            top: direction === "up" ? 0 : `-${Math.abs(speedFactor) * 100}%`,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Optional overlay */}
      {overlay && (
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-20">
        {children}
      </div>
    </section>
  );
};

interface ParallaxTextProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down" | "left" | "right";
  tag?: keyof JSX.IntrinsicElements;
}

export const ParallaxText = ({
  children,
  className = "",
  speed = 0.1,
  direction = "up",
  tag = "div",
}: ParallaxTextProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  let x = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);
  let y = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);

  if (direction === "up") {
    y = useTransform(scrollYProgress, [0, 1], ["0%", `${-speed * 100}%`]);
  } else if (direction === "down") {
    y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  } else if (direction === "left") {
    x = useTransform(scrollYProgress, [0, 1], ["0%", `${-speed * 100}%`]);
  } else if (direction === "right") {
    x = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  }

  const Tag = tag;

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        style={{ x, y }}
        transition={{ type: "tween", ease: "linear" }}
      >
        <Tag>{children}</Tag>
      </motion.div>
    </div>
  );
};

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  speed?: number;
  delay?: number;
  scale?: number;
}

export const ParallaxImage = ({
  src,
  alt,
  className = "",
  imgClassName = "",
  speed = 0.1,
  delay = 0,
  scale = 1.1,
}: ParallaxImageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${-speed * 100}%`]
  );

  const scaleValue = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [scale, 1, scale]
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay }}
      className={cn("overflow-hidden", className)}
    >
      <motion.div style={{ y }}>
        <motion.img
          src={src}
          alt={alt}
          style={{ scale: scaleValue }}
          className={cn("w-full h-auto transition-transform", imgClassName)}
        />
      </motion.div>
    </motion.div>
  );
};