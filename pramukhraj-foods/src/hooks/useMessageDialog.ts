import { useState, useCallback } from "react";
import type { MessageDialogVariant } from "@/components/ui/MessageDialog";

interface DialogState {
  open: boolean;
  variant: MessageDialogVariant;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const INITIAL: DialogState = {
  open: false,
  variant: "success",
  message: "",
};

export function useMessageDialog() {
  const [state, setState] = useState<DialogState>(INITIAL);

  const show = useCallback(
    (opts: Omit<DialogState, "open">) => setState({ ...opts, open: true }),
    []
  );

  const success = useCallback(
    (
      message: string,
      opts?: { title?: string; actionLabel?: string; onAction?: () => void }
    ) => show({ variant: "success", message, ...opts }),
    [show]
  );

  const error = useCallback(
    (
      message: string,
      opts?: { title?: string; actionLabel?: string; onAction?: () => void }
    ) => show({ variant: "error", message, ...opts }),
    [show]
  );

  const close = useCallback(() => setState(s => ({ ...s, open: false })), []);

  return {
    show,
    success,
    error,
    close,
    props: {
      open: state.open,
      onOpenChange: (open: boolean) => setState(s => ({ ...s, open })),
      variant: state.variant,
      title: state.title,
      message: state.message,
      actionLabel: state.actionLabel,
      onAction: state.onAction,
    },
  };
}
