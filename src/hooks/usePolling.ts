import { useEffect, useState } from 'react';
import { useInterval } from './useInterval';

/**
 * Auto-refresh léger par polling, en remplacement d'un rafraîchissement manuel.
 * Se met en pause quand l'onglet n'est pas visible (document.hidden) pour ne
 * pas spammer l'API en arrière-plan. useInterval garde déjà la dernière
 * version de `callback` via sa propre ref, pas besoin d'en tenir une ici.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Le rendu serveur n'a pas de `document` : l'état de visibilité ne peut
    // être déterminé qu'après le montage côté client, d'où cet effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!document.hidden);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useInterval(callback, enabled && visible ? intervalMs : null);
}
