const flattenClassNames = (value, classNames) => {
  if (!value) return;

  if (typeof value === 'string' || typeof value === 'number') {
    classNames.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => flattenClassNames(entry, classNames));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([className, enabled]) => {
      if (enabled) classNames.push(className);
    });
  }
};

export const cn = (...values) => {
  const classNames = [];
  values.forEach((value) => flattenClassNames(value, classNames));
  return classNames.join(' ');
};
