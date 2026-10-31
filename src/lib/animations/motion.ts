export const notionEase = [0.16, 1, 0.3, 1] as const;

export const notionTransition = {
  duration: 0.26,
  ease: notionEase,
};

export const notionSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.8,
} as const;

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const fadeUpItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: notionEase,
    },
  },
};

export const scaleInItem = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: notionEase,
    },
  },
};

export const notionHoverCard = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -3,
    scale: 1.004,
    transition: { duration: 0.18, ease: notionEase },
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 },
  },
};

export const dropdownMotion = {
  initial: { opacity: 0, scale: 0.96, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -4 },
  transition: { duration: 0.18, ease: notionEase },
};
