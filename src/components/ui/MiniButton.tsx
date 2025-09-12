// src/components/ui/MiniButton.tsx
import type { ComponentProps } from 'react';

import { Button } from './Button';

export function MiniButton(props: ComponentProps<typeof Button>) {
  // default to small outline buttons
  const { size = 'sm', variant = 'outline', ...rest } = props;
  return <Button size={size} variant={variant} {...rest} />;
}
