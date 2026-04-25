import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(input: string, max: number) {
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, max)}…`;
}
