import { Variants } from "framer-motion";

// Animation variants for Framer Motion components
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export const scaleUp: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const slideInBottom: Variants = {
  hidden: { 
    y: 100,
    opacity: 0 
  },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { 
      duration: 0.8,
      ease: [0.165, 0.84, 0.44, 1]
    }
  }
};

// Apple-like reveal animation
export const revealFromBottom: Variants = {
  hidden: { 
    y: 50,
    opacity: 0 
  },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { 
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// For items that should appear one after another
export const staggerItemsVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const staggerItems = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      delay,
      duration: 0.5,
      ease: "easeOut"
    }
  }
});

// Custom animation for image parallax effect
export const parallaxEffect: Variants = {
  hidden: { 
    scale: 1.2,
    opacity: 0.8 
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: { 
      duration: 1.5,
      ease: "easeOut"
    }
  }
};

// Animation for color transition
export const colorTransition = {
  transition: { 
    duration: 0.6,
    ease: "easeInOut" 
  }
};

// For subtle hover effects on cards and buttons
export const hoverScale = {
  scale: 1.03,
  transition: { 
    duration: 0.3,
    ease: "easeInOut" 
  }
};

// For text highlight animation
export const highlightText: Variants = {
  hidden: { 
    backgroundSize: "0% 100%",
    backgroundPosition: "0% 100%",
    backgroundRepeat: "no-repeat",
    backgroundImage: "linear-gradient(90deg, #7C3AED 0%, #C084FC 100%)" 
  },
  visible: { 
    backgroundSize: "100% 10px",
    transition: { 
      duration: 0.8,
      ease: "easeInOut" 
    }
  }
};

// For section dividers that animate in
export const dividerExpand: Variants = {
  hidden: { width: "0%" },
  visible: { 
    width: "100%",
    transition: { 
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// For scrolling stats counter
export const counterAnimation: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.6
    }
  }
};