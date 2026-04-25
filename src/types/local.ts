import type { getRecurringTemplatesWithLabels } from '@/lib/queries';

export type AwaitedRecurringTemplate = Awaited<ReturnType<typeof getRecurringTemplatesWithLabels>>[number];
