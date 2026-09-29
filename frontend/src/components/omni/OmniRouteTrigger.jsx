"use client";
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OmniRouteTrigger() {
  const params = useSearchParams();
  const open = params.get('omni') === '1';
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event('studenthub:omni-open')));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return null;
}
