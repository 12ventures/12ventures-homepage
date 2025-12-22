// Cal.com booking utility

declare global {
  interface Window {
    Cal?: {
      (action: string, ...args: unknown[]): void;
      ns?: {
        booking?: (action: string, ...args: unknown[]) => void;
      };
    };
  }
}

const CAL_LINK = "razer-46vfoo/otterworks-demo";

export const openCalendarBooking = () => {
  if (window.Cal?.ns?.booking) {
    window.Cal.ns.booking("modal", {
      calLink: CAL_LINK,
      config: {
        layout: "month_view",
        theme: "light"
      }
    });
  } else {
    // Fallback: open in new tab if embed script failed to load
    window.open(`https://cal.com/${CAL_LINK}`, "_blank");
  }
};
