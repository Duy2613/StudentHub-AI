"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import Link from "next/link";
import { 
  Home, 
  ShieldAlert, 
  MessageSquare, 
  LayoutDashboard, 
  User, 
  Sparkles,
  Compass,
  CreditCard,
  Scale,
  AlertOctagon,
  ShoppingBag,
  Trophy,
  Calendar,
  GraduationCap,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ITEMS = [
  {
    title: "Trang Chủ",
    icon: <Home className="w-full h-full text-teal-400" />,
    href: "/",
  },
  {
    title: "Kiểm Tra Lừa Đảo (AI 4 Lớp)",
    icon: <ShieldAlert className="w-full h-full text-rose-400" />,
    href: "/scam-check",
  },
  {
    title: "Xếp Tín Chỉ",
    icon: <Calendar className="w-full h-full text-amber-400" />,
    href: "/credit-scheduler",
  },
  {
    title: "Review GV",
    icon: <GraduationCap className="w-full h-full text-sky-400" />,
    href: "/prof-rating",
  },
  {
    title: "Radar Học Bổng",
    icon: <Award className="w-full h-full text-emerald-400" />,
    href: "/scholarships",
  },
  {
    title: "Bản Đồ An Ninh",
    icon: <Compass className="w-full h-full text-orange-400" />,
    href: "/safety-map",
  },
  {
    title: "Radar Học Phí",
    icon: <CreditCard className="w-full h-full text-emerald-400" />,
    href: "/tuition-radar",
  },
  {
    title: "Bóc Tách Hợp Đồng",
    icon: <Scale className="w-full h-full text-cyan-400" />,
    href: "/contract-check",
  },
  {
    title: "Cấp Cứu SOS",
    icon: <AlertOctagon className="w-full h-full text-red-500" />,
    href: "/sos",
  },
  {
    title: "Sàn Pass Đồ",
    icon: <ShoppingBag className="w-full h-full text-amber-400" />,
    href: "/marketplace",
  },
  {
    title: "Hiệp Sĩ",
    icon: <Trophy className="w-full h-full text-purple-400" />,
    href: "/quests",
  },
  {
    title: "Diễn Đàn Sinh Viên",
    icon: <MessageSquare className="w-full h-full text-indigo-400" />,
    href: "/forum",
  },
  {
    title: "Bảng Điều Khiển",
    icon: <LayoutDashboard className="w-full h-full text-sky-400" />,
    href: "/dashboard",
  },
  {
    title: "Hồ Sơ & Uy Tín",
    icon: <User className="w-full h-full text-amber-400" />,
    href: "/profile",
  },
];

export const FloatingDock = ({
  items = DEFAULT_ITEMS,
  desktopClassName,
  mobileClassName,
}) => {
  return (
    <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto">
        <FloatingDockDesktop items={items} className={desktopClassName} />
        <FloatingDockMobile items={items} className={mobileClassName} />
      </div>
    </div>
  );
};

const FloatingDockMobile = ({ items, className }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute bottom-full mb-3 inset-x-0 flex flex-col gap-2.5 items-center"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.04,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.04 }}
              >
                <Link
                  href={item.href}
                  className="h-11 w-11 rounded-full bg-space-900/95 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white shadow-lg"
                >
                  <div className="h-5 w-5">{item.icon}</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-teal-400 text-space-950 shadow-[0_0_20px_rgba(52,231,196,0.5)] flex items-center justify-center font-bold text-lg"
      >
        <Sparkles className="w-5 h-5 text-space-950" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({ items, className }) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden md:flex h-16 gap-3.5 items-end rounded-full bg-space-950/85 backdrop-blur-2xl border border-white/12 px-4 pb-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({ mouseX, title, icon, href }) {
  let ref = useRef(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [18, 26, 18]);
  let heightTransformIcon = useTransform(distance, [-150, 0, 150], [18, 26, 18]);

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="aspect-square rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative group hover:border-teal-400/60 hover:bg-white/10 transition-colors shadow-sm"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="px-2.5 py-1 whitespace-pre rounded-full bg-space-900/95 border border-white/15 text-white absolute left-1/2 -top-9 w-fit text-[11px] font-bold shadow-lg"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center text-gray-200 group-hover:text-white"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}

export default FloatingDock;
