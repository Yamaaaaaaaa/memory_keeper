export interface Call {
  callId: string;
  callerId: string;
  calleeId: string;
  status: "ringing" | "accepted" | "rejected" | "ended";
  createdAt: number;
}
