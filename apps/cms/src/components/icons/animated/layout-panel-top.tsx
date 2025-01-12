import { motion, useAnimation } from "motion/react";
import { LucideProps } from "lucide-react";

const LayoutPanelTopIcon = () => {
  const controls = useAnimation();

  return (
    <div
      className="select-none transition-colors duration-200"
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
        <motion.rect
          width="18"
          height="7"
          x="3"
          y="3"
          rx="1"
          initial="normal"
          animate={controls}
          variants={{
            normal: { opacity: 1, translateY: 0 },
            animate: {
              opacity: [0, 1],
              translateY: [-5, 0],
              transition: {
                opacity: { duration: 0.5, times: [0.2, 1] },
                duration: 0.5,
              },
            },
          }}
        />
        <motion.rect
          width="7"
          height="7"
          x="3"
          y="14"
          rx="1"
          initial="normal"
          animate={controls}
          variants={{
            normal: { opacity: 1, translateX: 0 },
            animate: {
              opacity: [0, 1],
              translateX: [-10, 0],
              transition: {
                opacity: { duration: 0.7, times: [0.5, 1] },
                translateX: { delay: 0.3 },
                duration: 0.5,
              },
            },
          }}
        />
        <motion.rect
          width="7"
          height="7"
          x="14"
          y="14"
          rx="1"
          initial="normal"
          animate={controls}
          variants={{
            normal: { opacity: 1, translateX: 0 },
            animate: {
              opacity: [0, 1],
              translateX: [10, 0],
              transition: {
                opacity: { duration: 0.8, times: [0.5, 1] },
                translateX: { delay: 0.4 },
                duration: 0.5,
              },
            },
          }}
        />
      </svg>
    </div>
  );
};

export { LayoutPanelTopIcon };
