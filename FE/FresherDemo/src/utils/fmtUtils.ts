import { ShiftStatus } from "../types/shift";

export const mapInactiveToStatus = (inactive: boolean): ShiftStatus =>
  inactive ? ShiftStatus.Inactive : ShiftStatus.Active;
