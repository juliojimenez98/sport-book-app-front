import { sileo } from "sileo";

/**
 * Toast utility wrapper using Sileo.
 * Drop-in replacement for sonner's toast API.
 * All toasts appear at top-center by default.
 */
export const toast = {
  success: (message: string, description?: string) => {
    sileo.success({ title: message, description });
  },
  error: (message: string, description?: string) => {
    sileo.error({ title: message, description });
  },
  warning: (message: string, description?: string) => {
    sileo.warning({ title: message, description });
  },
  info: (message: string, description?: string) => {
    sileo.info({ title: message, description });
  },
  /**
   * Show a loading toast that auto-transitions to success or error.
   * Usage:
   *   toast.promise(myAsyncFn(), {
   *     loading: "Guardando...",
   *     success: "Guardado correctamente",
   *     error: "Error al guardar",
   *   })
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string;
    },
  ): Promise<T> => {
    if (typeof messages.success === "string") {
      sileo.promise(promise, {
        loading: { title: messages.loading },
        success: { title: messages.success },
        error: { title: messages.error },
      });
    } else {
      const id = sileo.show({ title: messages.loading, duration: null });
      const successFn = messages.success;
      promise
        .then((data) => {
          sileo.dismiss(id);
          sileo.success({ title: successFn(data) });
        })
        .catch(() => {
          sileo.dismiss(id);
          sileo.error({ title: messages.error });
        });
    }
    return promise;
  },
  /** Show a persistent loading toast. Call toast.dismiss(id) to remove it. */
  loading: (message: string) => {
    return sileo.show({ title: message, duration: null });
  },
  /** Dismiss a specific toast by id */
  dismiss: (id: string) => {
    sileo.dismiss(id);
  },
  /** Clear all toasts */
  clear: () => {
    sileo.clear();
  },
};
