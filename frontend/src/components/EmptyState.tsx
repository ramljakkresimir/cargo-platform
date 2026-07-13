import { ReactNode } from 'react';

interface Props {
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ message, action }: Props) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
