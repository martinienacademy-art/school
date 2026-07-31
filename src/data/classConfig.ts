import { useStore } from '../store/useStore';

export const getCycle = (classe: string) => {
  return useStore.getState().getCycleByClass(classe) as any;
};

export const getEcolage = (classe: string) => {
  return useStore.getState().getEcolageByClass(classe);
};

// Proxies for array exports to keep existing code working
export const CLASS_CONFIG = new Proxy([], {
  get: (target, prop) => {
    const classes = useStore.getState().classes || [];
    const mapped = classes.map((c: any) => ({ name: c.nom, cycle: c.cycle, ecolage: c.ecolage }));
    const val = (mapped as any)[prop];
    if (typeof val === 'function') {
      return val.bind(mapped);
    }
    return val;
  }
}) as any;

export const CLASSES_BY_CYCLE = CLASS_CONFIG;
