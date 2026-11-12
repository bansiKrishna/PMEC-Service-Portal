import type { FC } from 'react';
import { BonafideApplicationsView } from '../../components/bonafide/BonafideApplicationsView';

export const DswApplicationsPage: FC = () => (
  <BonafideApplicationsView
    viewer="dsw"
    title="Bonafide Applications"
    description="Review, approve or reject Bonafide certificate requests."
  />
);
