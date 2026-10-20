import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });
const zarCents = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 });

export const formatZAR = (n: number, cents = false) => (cents ? zarCents : zar).format(n);
export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
