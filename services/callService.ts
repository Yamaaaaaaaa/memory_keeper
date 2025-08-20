import { db } from "@/firebase/firebaseConfig";
import { Call } from "@/types/call";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

// Tạo 1 cuộc gọi mới
export const createCall = async (
  callerId: string,
  calleeId: string
): Promise<string> => {
  const ref = await addDoc(collection(db, "calls"), {
    callerId,
    calleeId,
    status: "ringing",
    createdAt: Date.now(),
  });
  return ref.id;
};

// Update status cuộc gọi
export const updateCallStatus = async (
  callId: string,
  status: Call["status"]
) => {
  const callRef = doc(db, "calls", callId);
  await updateDoc(callRef, { status });
};

// Lắng nghe cuộc gọi đến
export const listenIncomingCalls = (
  userId: string,
  onCall: (call: Call) => void
) => {
  const q = query(collection(db, "calls"), where("calleeId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        const call = { callId: change.doc.id, ...change.doc.data() } as Call;
        if (call.status === "ringing") onCall(call);
      }
    });
  });
};
