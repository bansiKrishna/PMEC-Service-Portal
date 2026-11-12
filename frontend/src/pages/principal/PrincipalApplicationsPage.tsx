import type { FC } from 'react';
import { BonafideApplicationsView } from '../../components/bonafide/BonafideApplicationsView';

export const PrincipalApplicationsPage: FC = () => (
  <BonafideApplicationsView
    viewer="principal"
    title="Bonafide Applications"
    description="Review applications forwarded for Principal approval."
  />
);
