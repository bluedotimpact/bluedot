import type { IconType } from "react-icons";
import {
  FaCircleCheck,
  FaCircleInfo,
  FaCircleXmark,
  FaTriangleExclamation,
} from "react-icons/fa6";

// Shared by Callout and Toast.

export type Tone = "info" | "success" | "warning" | "error";

export const TONE_STYLES: Record<
  Tone,
  { surface: string; fg: string; Icon: IconType }
> = {
  info: {
    surface: "border-info-border bg-info-bg",
    fg: "text-info-fg",
    Icon: FaCircleInfo,
  },
  success: {
    surface: "border-success-border bg-success-bg",
    fg: "text-success-fg",
    Icon: FaCircleCheck,
  },
  warning: {
    surface: "border-warning-border bg-warning-bg",
    fg: "text-warning-fg",
    Icon: FaTriangleExclamation,
  },
  error: {
    surface: "border-error-border bg-error-bg",
    fg: "text-error-fg",
    Icon: FaCircleXmark,
  },
};
