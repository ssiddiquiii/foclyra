"use client";
import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export const WobbleCard = ({
  children,
  containerClassName,
  className,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (event) => {
    if (shouldReduceMotion) return;
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 20;
    const y = (clientY - (rect.top + rect.height / 2)) / 20;
    setMousePosition({ x, y });
  };

  const outerTransform =
    !shouldReduceMotion && isHovering
      ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1.02, 1.02, 1.02)`
      : "translate3d(0px, 0px, 0px) scale3d(1, 1, 1)";

  const innerTransform =
    !shouldReduceMotion && isHovering
      ? `translate3d(${-mousePosition.x * 0.6}px, ${-mousePosition.y * 0.6}px, 0)`
      : "translate3d(0px, 0px, 0px)";

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      style={{
        transform: outerTransform,
        transition: "transform 0.15s ease-out",
      }}
      className={cn(
        "relative rounded-2xl overflow-hidden will-change-transform",
        containerClassName
      )}
    >
      <div
        style={{
          transform: innerTransform,
          transition: "transform 0.15s ease-out",
        }}
        className={cn("h-full", className)}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default WobbleCard;
