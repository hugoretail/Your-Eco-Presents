"use client";
import { useEffect } from 'react';

export default function RedirectGenerate() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/trouver');
    }
  }, []);
  return null;
}
