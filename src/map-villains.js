// Preserve legacy map counters in old saves without displaying map effects.
export const normalizeMapVillains = value => Array.from({length:5},(_,i)=>Number.isInteger(value?.[i])&&value[i]>=0&&value[i]<=3?value[i]:0);
