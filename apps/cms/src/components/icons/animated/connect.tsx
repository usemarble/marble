"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const plugVariants: Variants = {
  normal: {
    x: 0,
    y: 0,
  },
  animate: {
    x: -3,
    y: 3,
  },
};

const socketVariants: Variants = {
  normal: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 3,
    y: -3,
  },
};

const pathVariants = {
  normal: (custom: { x: number; y: number }) => ({
    d: `M${custom.x} ${custom.y} l2.5 -2.5`,
  }),
  animate: (custom: { x: number; y: number }) => ({
    d: `M${custom.x + 2.93} ${custom.y - 2.93} l0.10 -0.10`,
  }),
};

const ConnectIcon = () => {
  const controls = useAnimation();

  return (
    <div
      className="ransition-colors duration-200"
      onMouseEnter={() => controls.start("animate")}
      onMouseLeave={() => controls.start("normal")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M19 5l3 -3"
          variants={{
            normal: {
              d: "M19 5l3 -3",
            },
            animate: {
              d: "M17 7l5 -5",
            },
          }}
          animate={controls}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        <motion.path
          d="m2 22 3-3"
          variants={{
            normal: {
              d: "m2 22 3-3",
            },
            animate: {
              d: "m2 22 6-6",
            },
          }}
          animate={controls}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        <motion.path
          d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"
          variants={socketVariants}
          animate={controls}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        <motion.path
          variants={pathVariants}
          custom={{ x: 7.5, y: 13.5 }}
          initial="normal"
          animate={controls}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        <motion.path
          variants={pathVariants}
          custom={{ x: 10.5, y: 16.5 }}
          initial="normal"
          animate={controls}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        <motion.path
          d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"
          variants={plugVariants}
          animate={controls}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </svg>
    </div>
  );
};

export { ConnectIcon };
