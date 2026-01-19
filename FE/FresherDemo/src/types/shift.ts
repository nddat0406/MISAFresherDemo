export interface Shift {
  shiftId: string;

  shiftCode: string;
  shiftName: string;

  beginShiftTime: Date; // "HH:mm"
  endShiftTime: Date;   // "HH:mm"

  beginBreakTime?: Date; // "HH:mm"
  endBreakTime?: Date; // "HH:mm"

  workingTime: number;
  breakingTime: number;

  status?: ShiftStatus;
  inactive: boolean;

  createdBy: string;
  createdDate: Date;

  modifiedBy?: string;
  modifiedDate?: Date;

  description?: string;
}

export enum ShiftStatus {
  Active = 1,
  Inactive = 2,
}