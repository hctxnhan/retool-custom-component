import React, { useEffect } from 'react';
interface WrapperComponentProps {
  cssVariables: Record<string, string>;
  children: React.ReactNode;
}
export const WrapperComponent = ({
  cssVariables,
  children
}: WrapperComponentProps) => {
  useEffect(() => {
    const body = document.body;
    const previousStyles: Record<string, string> = {};
    // Apply variables to body
    Object.entries(cssVariables).forEach(([key, value]) => {
      previousStyles[key] = body.style.getPropertyValue(key);
      body.style.setProperty(key, value);
    });
    // Cleanup: restore previous styles
    return () => {
      Object.entries(previousStyles).forEach(([key, value]) => {
        if (value) {
          body.style.setProperty(key, value);
        } else {
          body.style.removeProperty(key);
        }
      });
    };
  }, [cssVariables]);
  return <>{children}</>;
};