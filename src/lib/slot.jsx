import { cloneElement, isValidElement } from 'react';
import { cn } from './cn.js';

const assignRef = (ref, value) => {
  if (typeof ref === 'function') ref(value);
  else if (ref && typeof ref === 'object') ref.current = value;
};

export const Slot = ({ children, className, style, disabled, ...slotProps }) => {
  if (!isValidElement(children)) {
    throw new Error('The asChild prop requires exactly one valid React element.');
  }

  const childProps = children.props ?? {};
  const mergedProps = {
    ...childProps,
    ...slotProps,
    className: cn(className, childProps.className),
    style: { ...style, ...childProps.style },
  };

  Object.keys(slotProps).forEach((propName) => {
    const slotHandler = slotProps[propName];
    const childHandler = childProps[propName];
    if (
      /^on[A-Z]/.test(propName) &&
      typeof slotHandler === 'function' &&
      typeof childHandler === 'function'
    ) {
      mergedProps[propName] = (event) => {
        childHandler(event);
        if (!event.defaultPrevented) slotHandler(event);
      };
    }
  });

  if (childProps.ref || slotProps.ref) {
    mergedProps.ref = (value) => {
      assignRef(childProps.ref, value);
      assignRef(slotProps.ref, value);
    };
  }

  if (disabled) {
    if (children.type === 'button') {
      mergedProps.disabled = true;
    } else {
      delete mergedProps.disabled;
      mergedProps['aria-disabled'] = true;
      mergedProps.tabIndex = -1;
      mergedProps.onClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };
    }
  }

  return cloneElement(children, mergedProps);
};
