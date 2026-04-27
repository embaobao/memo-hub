import React, { useState, useRef, useCallback } from 'react';

interface TextareaAutosizeProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  minRows?: number;
}

export const TextareaAutosize = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(({ maxRows = 10, minRows = 1, className = '', value = '', onChange, onFocus, onBlur, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState('auto');

  // 合并 refs
  const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    internalRef.current = node;
  }, [ref]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const element = e.target;

    // 重置高度以正确计算新的高度
    element.style.height = 'auto';

    // 计算新高度
    const newHeight = calculateHeight(element, minRows, maxRows);
    element.style.height = newHeight;
    setHeight(newHeight);

    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <textarea
      {...props}
      ref={setRefs}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      style={{
        height,
        overflowY: 'auto',
        resize: 'none',
      }}
    />
  );
});

TextareaAutosize.displayName = 'TextareaAutosize';

function calculateHeight(
  element: HTMLTextAreaElement,
  minRows: number,
  maxRows: number
): string {
  const lineHeight = parseInt(getComputedStyle(element).lineHeight);
  const paddingTop = parseInt(getComputedStyle(element).paddingTop);
  const paddingBottom = parseInt(getComputedStyle(element).paddingBottom);

  // 计算单行高度
  const singleRowHeight = lineHeight + paddingTop + paddingBottom;

  // 计算内容高度
  const scrollHeight = element.scrollHeight;

  // 计算行数
  const rows = Math.max(minRows, Math.min(maxRows, Math.ceil(scrollHeight / singleRowHeight)));

  return `${rows * singleRowHeight}px`;
}

export default TextareaAutosize;
