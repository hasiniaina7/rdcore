import type { HTMLAttributes, ReactNode, ButtonHTMLAttributes } from 'react';
import { createContext, useContext } from 'react';

type TabsContextValue = {
  value: string;
  onValueChange?: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ value, onValueChange, className = '', children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`cp-tabs ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`cp-tabs__list ${className}`} {...props} />;
}

interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: ReactNode;
}

export function TabsTrigger({ value, className = '', children, ...props }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;
  const base = 'cp-tabs__trigger';
  const active = isActive ? 'cp-tabs__trigger--active' : '';

  return (
    <button
      type="button"
      className={`${base} ${active} ${className}`}
      onClick={(event) => {
        ctx?.onValueChange?.(value);
        props.onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className = '', ...props }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (!ctx || ctx.value !== value) {
    return null;
  }
  return <div className={`cp-tabs__content ${className}`} {...props} />;
}

