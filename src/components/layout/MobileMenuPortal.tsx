import { createPortal } from 'react-dom';

/**
 * Props for the MobileMenuPortal component.
 */
type Props = {
  /**
   * Controls visibility of the portal. When `false`, the component renders `null`.
   */
  open: boolean;

  /**
   * Called when the backdrop is clicked. Use this to close the menu.
   */
  onClose: () => void;

  /**
   * Content to render inside the mobile drawer (e.g., menu header and nav items).
   */
  children: React.ReactNode;
};

/**
 * MobileMenuPortal
 *
 * Renders a backdrop and slide-in mobile drawer into `document.body`
 * using React portals. Intended for small screens (`sm:hidden`).
 *
 * Accessibility:
 * - The drawer uses `role="dialog"` and `aria-modal="true"`.
 * - The backdrop is marked `aria-hidden` and triggers `onClose` on click.
 * - Focus trapping/restoration is not handled here (add if needed).
 *
 * Z-index:
 * - Backdrop: `z-[9998]`
 * - Drawer:   `z-[9999]`
 *
 * @param {Props} props Component props.
 * @returns {React.ReactPortal | null} A portal containing the backdrop and drawer, or `null` if `open` is false.
 */
export default function MobileMenuPortal({ open, onClose, children }: Props) {
  if (!open) return null;
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] sm:hidden z-[9998]"
      />
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:hidden z-[9999]
                    bg-[rgb(var(--header-bg))] text-[rgb(var(--header-fg))]
                    transform transition-transform duration-300
                    translate-x-0`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
