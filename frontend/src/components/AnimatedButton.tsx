import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue, type HTMLMotionProps } from 'framer-motion';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary';
    children: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    ...props
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Motion values for the "magnetic" effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for the movement
    const springConfig = { damping: 20, stiffness: 200 };
    const translateX = useSpring(mouseX, springConfig);
    const translateY = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);

        // Magnetic strength
        const strength = 12;
        mouseX.set(x / strength);
        mouseY.set(y / strength);

        if (props.onMouseMove) props.onMouseMove(e as any);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        mouseX.set(0);
        mouseY.set(0);
        if (props.onMouseLeave) props.onMouseLeave(e as any);
    };

    const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

    return (
        <motion.button
            {...props}
            ref={buttonRef}
            className={`${baseClass} ${className} relative overflow-hidden group`}
            style={{
                ...props.style,
                x: translateX,
                y: translateY,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Iridescent shine effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[25deg] pointer-events-none"
                initial={{ left: '-100%' }}
                whileHover={{ left: '100%' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />

            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-white/5 to-white/10 pointer-events-none" />

            <span className="relative z-10">{children}</span>
        </motion.button>
    );
};

export default AnimatedButton;
