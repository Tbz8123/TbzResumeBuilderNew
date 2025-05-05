import { ReactNode, useEffect } from "react";
import { motion, Variants, animate, useMotionValue, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";
import * as animations from "@/lib/animations";

type AnimationType = keyof typeof animations;

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
  id?: string;
}

export const AnimatedSection = ({
  children,
  className = "",
  animation = "fadeIn",
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
  id,
}: AnimatedSectionProps) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  // Need to cast as Variants to fix TypeScript errors
  const selectedAnimation = animations[animation] as Variants;
  
  return (
    <motion.div
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={selectedAnimation}
      transition={{
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  index?: number;
}

export const AnimatedItem = ({
  children,
  className = "",
  animation = "fadeInUp",
  delay = 0,
  index = 0,
}: AnimatedItemProps) => {
  // Need to cast as Variants to fix TypeScript errors
  const selectedAnimation = animations[animation] as Variants;

  return (
    <motion.div
      variants={selectedAnimation}
      custom={index}
      className={className}
      transition={{
        delay: delay + index * 0.1,
      }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedTextProps {
  text: string;
  className?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  animation?: AnimationType;
  delay?: number;
  staggerChildren?: boolean;
  highlightWords?: string[];
  highlightClass?: string;
}

export const AnimatedText = ({
  text,
  className = "",
  tag = "p",
  animation = "fadeInUp",
  delay = 0,
  staggerChildren = false,
  highlightWords = [],
  highlightClass = "text-primary font-bold",
}: AnimatedTextProps) => {
  // Need to cast as Variants to fix TypeScript errors
  const selectedAnimation = animations[animation] as Variants;
  const staggerContainerAnimation = animations.staggerContainer as Variants;
  const Tag = tag as keyof JSX.IntrinsicElements;
  
  const words = text.split(" ");

  if (staggerChildren) {
    return (
      <Tag className={className}>
        <motion.span
          initial="hidden"
          animate="visible"
          variants={staggerContainerAnimation}
        >
          {words.map((word, index) => {
            const isHighlighted = highlightWords.includes(word);
            const staggerItemAnimation = typeof animations.staggerItems === 'function' 
              ? animations.staggerItems(delay) as Variants
              : {};
              
            return (
              <motion.span
                key={index}
                variants={staggerItemAnimation}
                className="inline-block mr-1"
              >
                <span className={isHighlighted ? highlightClass : ""}>
                  {word}
                </span>
              </motion.span>
            );
          })}
        </motion.span>
      </Tag>
    );
  }

  // Apply the highlight to specific words but don't stagger each word
  let processedText = text;
  highlightWords.forEach(word => {
    processedText = processedText.replace(
      new RegExp(`\\b${word}\\b`, 'g'), 
      `<span class="${highlightClass}">${word}</span>`
    );
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={selectedAnimation}
      transition={{
        delay,
      }}
    >
      <Tag 
        className={className} 
        dangerouslySetInnerHTML={{ __html: processedText }}
      />
    </motion.div>
  );
};

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  animation?: AnimationType;
  delay?: number;
  parallax?: boolean;
  scale?: number;
}

export const AnimatedImage = ({
  src,
  alt,
  className = "",
  imgClassName = "",
  animation = "fadeIn",
  delay = 0,
  parallax = false,
  scale = 1.1,
}: AnimatedImageProps) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Need to cast as Variants to fix TypeScript errors
  const selectedAnimation = (parallax ? animations.parallaxEffect : animations[animation]) as Variants;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={selectedAnimation}
      transition={{
        delay,
      }}
      className={className}
    >
      <img 
        src={src} 
        alt={alt} 
        className={imgClassName}
        style={{ transformOrigin: "center center" }}
      />
    </motion.div>
  );
};

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = ({
  end,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) => {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const counterAnimation = animations.counterAnimation as Variants;
  const count = useMotionValue(0);
  const roundedValue = useTransform(count, (latest) => Math.floor(latest).toLocaleString());
  
  useEffect(() => {
    if (inView) {
      const controls = animate(count, end, {
        duration,
        delay,
        ease: "easeOut",
      });
      
      return controls.stop;
    }
  }, [count, end, duration, delay, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={counterAnimation}
      className={className}
    >
      <div className="relative">
        {prefix}
        <motion.span
          className="inline-block"
          style={{ opacity: inView ? 1 : 0 }}
        >
          {inView ? roundedValue : "0"}
        </motion.span>
        {suffix}
      </div>
    </motion.div>
  );
};