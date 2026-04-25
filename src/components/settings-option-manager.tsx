import { Trash2 } from 'lucide-react';

import { SubmitButton } from '@/components/submit-button';

type Item = {
  id: string;
  name: string;
};

type Props = {
  title: string;
  description: string;
  items: Item[];
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  placeholder: string;
};

export function SettingsOptionManager({
  title,
  description,
  items,
  createAction,
  deleteAction,
  placeholder
}: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Configuration</p>
          <h2>{title}</h2>
        </div>
      </div>
      <p className="panel-copy">{description}</p>

      <form action={createAction} className="inline-form">
        <label className="grow">
          <span>Add new item</span>
          <input name="name" placeholder={placeholder} required type="text" />
        </label>
        <SubmitButton label="Add" pendingLabel="Adding..." />
      </form>

      <div className="config-list">
        {items.map((item) => (
          <div className="config-row" key={item.id}>
            <span>{item.name}</span>
            <form action={deleteAction}>
              <input name="id" type="hidden" value={item.id} />
              <button aria-label={`Delete ${item.name}`} className="icon-button" type="submit">
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
