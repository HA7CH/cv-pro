"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export default function Cursor() {
  const [isHover, setIsHover] = useState(false);
  const [isText, setIsText] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [cursorSize, setCursorSize] = useState({ width: 20, height: 20 });
  const [mouseDown, setMouseDown] = useState(false);
  const [currentHoverElement, setCurrentHoverElement] =
    useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<Rect>({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
  });
  const [isMouseInPage, setIsMouseInPage] = useState(true);

  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };
  const smoothMouse = {
    x: useSpring(mouse.x, { damping: 20, stiffness: 300, mass: 0.5 }),
    y: useSpring(mouse.y, { damping: 20, stiffness: 300, mass: 0.5 }),
  };

  useEffect(() => {
    const manageMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target?.hasAttribute) return;
      if (target.hasAttribute("data-cursor")) {
        const cursorType = target.getAttribute("data-cursor");
        if (cursorType === "block") {
          setIsText(false);
          setIsUnderline(false);
          setIsHover(true);
        } else if (cursorType === "a") {
          setIsHover(false);
          setIsText(false);
          setIsUnderline(true);
        } else {
          setIsHover(false);
          setIsUnderline(false);
          setIsText(true);
        }
      }
    };

    const manageMouseLeave = () => {
      setIsHover(false);
      setIsText(false);
      setIsUnderline(false);
      if (currentHoverElement) {
        currentHoverElement.style.transform = "translate(0, 0)";
        currentHoverElement.style.scale = "1.0";
        setCurrentHoverElement(null);
      }
    };

    const manageMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      if (isHover) {
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const distance = { x: clientX - center.x, y: clientY - center.y };
        const elementSizeFactor = Math.min(
          1,
          100 / Math.max(rect.width, rect.height),
        );
        setCursorSize({
          width: rect.width * (1 + 0.12 * elementSizeFactor),
          height: rect.height * 1.1,
        });
        mouse.x.set(center.x - cursorSize.width / 2 + distance.x * 0.1);
        mouse.y.set(center.y - cursorSize.height / 2 + distance.y * 0.1);
        if (currentHoverElement) {
          const moveX = distance.x * 0.05 * elementSizeFactor;
          const moveY = distance.y * 0.05 * elementSizeFactor;
          currentHoverElement.style.transform = `translate(${moveX}px, ${moveY}px)`;
          currentHoverElement.style.scale = `${1 + 0.02 * elementSizeFactor}`;
        }
      } else if (isText) {
        const target = e.target as HTMLElement;
        const lineHeight = parseInt(
          window.getComputedStyle(target).lineHeight || "0",
        );
        setCursorSize({ width: 4, height: lineHeight });
        mouse.x.set(clientX - cursorSize.width / 2);
        mouse.y.set(clientY - cursorSize.height / 2);
      } else if (isUnderline) {
        const center = { x: rect.left + rect.width / 2, y: rect.bottom + 2 };
        const distance = { x: clientX - center.x, y: clientY - center.y };
        const elementSizeFactor = Math.min(
          1,
          100 / Math.max(rect.width, rect.height),
        );
        setCursorSize({ width: rect.width, height: 3 });
        mouse.x.set(center.x - cursorSize.width / 2 + distance.x * 0.1);
        mouse.y.set(center.y - cursorSize.height / 2 + distance.y * 0.1);
        if (currentHoverElement) {
          const moveX = distance.x * 0.05 * elementSizeFactor;
          const moveY = distance.y * 0.05 * elementSizeFactor;
          currentHoverElement.style.transform = `translate(${moveX}px, ${moveY}px)`;
          currentHoverElement.style.scale = `${1 + 0.02 * elementSizeFactor}`;
        }
      } else {
        setCursorSize({ width: 20, height: 20 });
        mouse.x.set(clientX - cursorSize.width / 2);
        mouse.y.set(clientY - cursorSize.height / 2);
        document.querySelectorAll('[data-cursor="block"]').forEach((el) => {
          (el as HTMLElement).style.transform = "translate(0, 0)";
          (el as HTMLElement).style.scale = "1.0";
        });
      }
    };

    const manageMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.hasAttribute && target.hasAttribute("data-cursor")) {
        setRect(target.getBoundingClientRect());
        target.style.transition = "transform 0.3s ease, scale 0.3s ease";
        setCurrentHoverElement(target);
      }
    };

    const manageMouseDown = () => setMouseDown(true);
    const manageMouseUp = () => setMouseDown(false);

    const handleDocLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 ||
        e.clientY >= window.innerHeight ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth
      ) {
        setIsMouseInPage(false);
      }
    };
    const handleDocEnter = () => setIsMouseInPage(true);

    const els = document.querySelectorAll("*");
    els.forEach((el) => {
      el.addEventListener("mouseenter", manageMouseEnter as EventListener);
      el.addEventListener("mouseleave", manageMouseLeave);
    });
    window.addEventListener("mousemove", manageMouseMove);
    window.addEventListener("mouseover", manageMouseOver);
    window.addEventListener("mousedown", manageMouseDown);
    window.addEventListener("mouseup", manageMouseUp);
    document.addEventListener("mouseleave", handleDocLeave);
    document.addEventListener("mouseenter", handleDocEnter);

    return () => {
      els.forEach((el) => {
        el.removeEventListener("mouseenter", manageMouseEnter as EventListener);
        el.removeEventListener("mouseleave", manageMouseLeave);
      });
      window.removeEventListener("mousemove", manageMouseMove);
      window.removeEventListener("mouseover", manageMouseOver);
      window.removeEventListener("mousedown", manageMouseDown);
      window.removeEventListener("mouseup", manageMouseUp);
      document.removeEventListener("mouseleave", handleDocLeave);
      document.removeEventListener("mouseenter", handleDocEnter);
    };
  });

  const calculateBorderRadius = (rect: Rect) => {
    if (isUnderline) return 2;
    if (isHover) return Math.round(Math.min(rect.width, rect.height) * 0.16);
    return 20;
  };

  return (
    <AnimatePresence>
      {isMouseInPage && (
        <motion.div
          style={{ left: smoothMouse.x, top: smoothMouse.y }}
          initial={{ opacity: 0, scale: 3 }}
          animate={{
            opacity: 1,
            scale: mouseDown ? 0.9 : 1,
            width: cursorSize.width,
            height: cursorSize.height,
            borderRadius: calculateBorderRadius(rect),
            backgroundColor: isHover
              ? "rgba(140,140,140,0.2)"
              : "rgba(140,140,140,0.65)",
          }}
          className="pointer-events-none fixed z-50 hidden md:block"
        />
      )}
    </AnimatePresence>
  );
}
