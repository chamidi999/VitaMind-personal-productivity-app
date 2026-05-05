import React from 'react';
import { format } from 'date-fns';

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-1">{format(new Date(), 'EEEE, MMMM do')}</p>
    </div>
  );
}
