import { useEffect } from "react";

export const APP_NAME = "Folio";

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} Books`;
  }, [title]);
}
