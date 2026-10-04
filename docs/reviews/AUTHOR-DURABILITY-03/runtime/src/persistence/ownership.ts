import { isObject } from '../engine/validate';

/** Storage coordination only; never part of fictional state or portable history. */
export interface OwnershipReceipt { ownerId: string; epoch: number }
export function validOwnerId(value:unknown):value is string{return typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/.test(value);}
export function validOwnership(value:unknown):value is OwnershipReceipt{return isObject(value)&&Object.keys(value).length===2&&validOwnerId(value.ownerId)&&Number.isSafeInteger(value.epoch)&&Number(value.epoch)>=1;}
