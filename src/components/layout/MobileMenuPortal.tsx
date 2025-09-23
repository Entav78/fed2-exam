import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

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
