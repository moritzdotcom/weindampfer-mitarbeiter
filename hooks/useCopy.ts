import { showError, showSuccess } from '@/lib/toast';
import { useState } from 'react';

export default function useCopy() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async ({
    link,
    title,
  }: {
    link: string;
    title: string;
  }) => {
    if (typeof window === 'undefined' || !navigator?.clipboard) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url: link,
        });
        showSuccess('Link geteilt!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        showSuccess('Link kopiert!');
        setTimeout(() => setCopied(false), 4000);
      } else {
        showError('Teilen nicht unterstützt.');
      }
    } catch (err) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        showSuccess('Link kopiert!');
        setTimeout(() => setCopied(false), 4000);
      } else {
        showError('Teilen fehlgeschlagen.');
      }
    }
  };

  return {
    copied,
    handleCopy,
  };
}
