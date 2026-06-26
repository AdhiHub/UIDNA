import { DesignProfile, GeneratedComponent, ComponentCategory } from '../types';

const btnColor = (token: any, fallback: string) => token?.hex || fallback;

export function generateComponents(profile: DesignProfile, framework: 'react' | 'vue' | 'html' = 'react'): GeneratedComponent[] {
  const components: GeneratedComponent[] = [];

  const accent = profile.colors.find(c => c.role === 'accent');
  const bg = profile.colors.find(c => c.role === 'background');
  const surface = profile.colors.find(c => c.role === 'surface');
  const textPrimary = profile.colors.find(c => c.role === 'text-primary');
  const textMuted = profile.colors.find(c => c.role === 'text-muted');
  const border = profile.colors.find(c => c.role === 'border');
  const spacing = profile.spacing.base;
  const primaryFont = profile.typography.find(t => t.role === 'body')?.fontFamily || 'sans-serif';
  const borderRadius = profile.borderRadius.filter(r => !r.includes('9999'));
  const radius = borderRadius[Math.floor(borderRadius.length / 2)] || '8px';

  components.push(generateButton(profile, accent, textPrimary, border, spacing, primaryFont, radius, framework));
  components.push(generateCard(profile, surface, bg, border, textPrimary, textMuted, spacing, primaryFont, radius, framework));
  components.push(generateInput(profile, bg, border, textPrimary, accent, spacing, radius, framework));
  components.push(generateNav(profile, textMuted, textPrimary, accent, border, spacing, radius, framework));
  components.push(generateModal(profile, surface, border, spacing, radius, framework));

  return components;
}

function generateButton(
  profile: DesignProfile,
  accent: any, textPrimary: any, border: any,
  spacing: number, font: string, radius: string, framework: string
): GeneratedComponent {
  const ac = btnColor(accent, '#6366f1');
  const tc = btnColor(textPrimary, '#ffffff');
  const bc = btnColor(border, '#e5e7eb');

  if (framework === 'react') {
    return {
      name: 'Button',
      framework: 'react',
      category: 'data-input',
      code: `import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const styles = {
  primary: {
    backgroundColor: '${ac}',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '${tc}',
    border: '1px solid ${bc}',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '${tc}',
    border: 'none',
  },
  base: {
    fontFamily: '"${font}", sans-serif',
    borderRadius: '${radius}',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'opacity 150ms ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { padding: '${spacing * 1}px ${spacing * 2}px', fontSize: '12px' },
  md: { padding: '${spacing * 2}px ${spacing * 4}px', fontSize: '14px' },
  lg: { padding: '${spacing * 3}px ${spacing * 6}px', fontSize: '16px' },
};

export function Button({ variant = 'primary', size = 'md', children, onClick, disabled }: ButtonProps) {
  return (
    <button
      style={{ ...styles.base, ...styles[variant], ...styles[size], opacity: disabled ? 0.5 : 1 }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={e => { if (!disabled) (e.target as HTMLElement).style.opacity = '0.9'; }}
      onMouseLeave={e => { if (!disabled) (e.target as HTMLElement).style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}`,
    };
  }

  if (framework === 'vue') {
    return {
      name: 'Button',
      framework: 'vue',
      category: 'data-input',
      code: `<template>
  <button
    :class="['btn', \`btn--\${variant}\`, \`btn--\${size}\`]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
});
defineEmits(['click']);
</script>

<style scoped>
.btn {
  font-family: "${font}", sans-serif;
  border-radius: ${radius};
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 150ms ease;
  border: none;
}
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: ${ac}; color: #fff; }
.btn--secondary { background: transparent; color: ${tc}; border: 1px solid ${bc}; }
.btn--ghost { background: transparent; color: ${tc}; }
.btn--sm { padding: ${spacing * 1}px ${spacing * 2}px; font-size: 12px; }
.btn--md { padding: ${spacing * 2}px ${spacing * 4}px; font-size: 14px; }
.btn--lg { padding: ${spacing * 3}px ${spacing * 6}px; font-size: 16px; }
</style>`,
    };
  }

  return {
    name: 'Button',
    framework: 'html',
    category: 'data-input',
    code: `<button class="btn btn-primary" style="
  background: ${ac};
  color: #fff;
  border: none;
  border-radius: ${radius};
  padding: ${spacing * 2}px ${spacing * 4}px;
  font-family: '${font}', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 150ms ease;
">Click me</button>

<button class="btn btn-ghost" style="
  background: transparent;
  color: ${tc};
  border: 1px solid ${bc};
  border-radius: ${radius};
  padding: ${spacing * 2}px ${spacing * 4}px;
  font-family: '${font}', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
">Secondary</button>`,
  };
}

function generateCard(
  profile: DesignProfile,
  surface: any, bg: any, border: any,
  textPrimary: any, textMuted: any,
  spacing: number, font: string, radius: string, framework: string
): GeneratedComponent {
  const sc = btnColor(surface || bg, '#1a1a1a');
  const bc = btnColor(border, '#e5e7eb');
  const tc = btnColor(textPrimary, '#ffffff');
  const mc = btnColor(textMuted, '#888888');

  return {
    name: 'Card',
    framework: framework as any,
    category: 'data-display',
    code: framework === 'react'
      ? `import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ title, children, style }: CardProps) {
  return (
    <div style={{
      background: '${sc}',
      border: '1px solid ${bc}',
      borderRadius: '${radius}',
      padding: '${spacing * 4}px',
      fontFamily: '"${font}", sans-serif',
      ...style,
    }}>
      {title && <h3 style={{ margin: '0 0 ${spacing * 2}px', color: '${tc}', fontSize: '18px' }}>{title}</h3>}
      <div style={{ color: '${mc}', fontSize: '14px', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}`
      : `<div class="card" style="
  background: ${sc};
  border: 1px solid ${bc};
  border-radius: ${radius};
  padding: ${spacing * 4}px;
  font-family: '${font}', sans-serif;
">
  <h3 style="margin: 0 0 ${spacing * 2}px; color: ${tc}; font-size: 18px;">Card Title</h3>
  <p style="color: ${mc}; font-size: 14px; line-height: 1.5;">Card content goes here.</p>
</div>`,
  };
}

function generateInput(
  profile: DesignProfile,
  bg: any, border: any, textPrimary: any, accent: any,
  spacing: number, radius: string, framework: string
): GeneratedComponent {
  const bc = btnColor(bg, '#000000');
  const boc = btnColor(border, '#e5e7eb');
  const tc = btnColor(textPrimary, '#ffffff');
  const ac = btnColor(accent, '#6366f1');

  return {
    name: 'Input',
    framework: framework as any,
    category: 'data-input',
    code: framework === 'react'
      ? `import React from 'react';

interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

export function Input({ placeholder, value, onChange, type = 'text' }: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        background: '${bc}',
        border: '1px solid ${boc}',
        borderRadius: '${radius}',
        padding: '${spacing * 2}px ${spacing * 3}px',
        color: '${tc}',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 150ms ease',
      }}
      onFocus={e => { e.target.style.borderColor = '${ac}'; }}
      onBlur={e => { e.target.style.borderColor = '${boc}'; }}
    />
  );
}`
      : `<input type="text" placeholder="Enter text..." style="
  background: ${bc};
  border: 1px solid ${boc};
  border-radius: ${radius};
  padding: ${spacing * 2}px ${spacing * 3}px;
  color: ${tc};
  font-size: 14px;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 150ms ease;
" />`,
  };
}

function generateNav(
  profile: DesignProfile,
  textMuted: any, textPrimary: any, accent: any, border: any,
  spacing: number, radius: string, framework: string
): GeneratedComponent {
  const mc = btnColor(textMuted, '#888888');
  const tc = btnColor(textPrimary, '#ffffff');
  const ac = btnColor(accent, '#6366f1');
  const bc = btnColor(border, '#e5e7eb');

  return {
    name: 'Navigation',
    framework: framework as any,
    category: 'navigation',
    code: framework === 'react'
      ? `import React, { useState } from 'react';

interface NavItem { label: string; href: string; }

const links: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
];

export function Navigation() {
  const [active, setActive] = useState('/');

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '${spacing * 2}px',
      padding: '${spacing * 3}px ${spacing * 4}px',
      borderBottom: '1px solid ${bc}',
    }}>
      {links.map(link => (
        <a key={link.href} href={link.href} onClick={e => { e.preventDefault(); setActive(link.href); }}
          style={{
            color: active === link.href ? '${ac}' : '${mc}',
            padding: '${spacing * 2}px ${spacing * 3}px',
            borderRadius: '${radius}',
            textDecoration: 'none',
            fontWeight: active === link.href ? 600 : 400,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={e => { if (active !== link.href) (e.target as HTMLElement).style.color = '${tc}'; }}
          onMouseLeave={e => { if (active !== link.href) (e.target as HTMLElement).style.color = '${mc}'; }}
        >{link.label}</a>
      ))}
      <button style={{
        marginLeft: 'auto',
        background: '${ac}',
        color: '#fff',
        border: 'none',
        borderRadius: '${radius}',
        padding: '${spacing * 2}px ${spacing * 4}px',
        cursor: 'pointer',
        fontWeight: 500,
      }}>Get Started</button>
    </nav>
  );
}`
      : `<nav style="
  display: flex;
  align-items: center;
  gap: ${spacing * 2}px;
  padding: ${spacing * 3}px ${spacing * 4}px;
  border-bottom: 1px solid ${bc};
">
  <a href="/" style="color: ${ac}; padding: ${spacing * 2}px ${spacing * 3}px; text-decoration: none; font-weight: 600;">Home</a>
  <a href="/about" style="color: ${mc}; padding: ${spacing * 2}px ${spacing * 3}px; text-decoration: none;">About</a>
  <a href="/pricing" style="color: ${mc}; padding: ${spacing * 2}px ${spacing * 3}px; text-decoration: none;">Pricing</a>
  <button style="margin-left: auto; background: ${ac}; color: #fff; border: none; border-radius: ${radius}; padding: ${spacing * 2}px ${spacing * 4}px; cursor: pointer; font-weight: 500;">Get Started</button>
</nav>`,
  };
}

function generateModal(
  profile: DesignProfile,
  surface: any, border: any,
  spacing: number, radius: string, framework: string
): GeneratedComponent {
  const sc = btnColor(surface, '#1a1a1a');
  const bc = btnColor(border, '#e5e7eb');

  return {
    name: 'Modal',
    framework: framework as any,
    category: 'overlay',
    code: framework === 'react'
      ? `import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
    }} onClick={onClose}>
      <div style={{
        background: '${sc}',
        border: '1px solid ${bc}',
        borderRadius: '${radius}',
        padding: '${spacing * 6}px',
        maxWidth: '480px',
        width: '90vw',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 ${spacing * 3}px' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}`
      : `<div class="modal-backdrop" onclick="this.style.display='none'" style="
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6);
">
  <div class="modal" onclick="event.stopPropagation()" style="
    background: ${sc};
    border: 1px solid ${bc};
    border-radius: ${radius};
    padding: ${spacing * 6}px;
    max-width: 480px;
    width: 90vw;
  ">
    <h2 style="margin: 0 0 ${spacing * 3}px;">Modal Title</h2>
    <p>Modal content goes here.</p>
    <button onclick="this.closest('.modal-backdrop').style.display='none'">Close</button>
  </div>
</div>`,
  };
}
