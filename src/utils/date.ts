import { format } from 'date-fns';

export const dateOnly = (d: Date) => format(d, 'yyyy-MM-dd');
