import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";


export interface Task {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  type: "daily" | "pending";
  status: "pending" | "completed";
  date: string;
  createdAt: Timestamp;
}


/**
 * Create New Task
 */
export const createTask = async (
  task: Omit<Task, "id" | "createdAt">
) => {

  return await addDoc(
    collection(db, "tasks"),
    {
      ...task,
      createdAt: Timestamp.now(),
    }
  );

};



/**
 * Get Daily Tasks
 */
export const getDailyTasks = async (
  userId: string
) => {

  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    where("type", "==", "daily")
  );


  const snapshot = await getDocs(q);


  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];

};



/**
 * Get Pending Tasks
 */
export const getPendingTasks = async (
  userId: string
) => {

  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    where("type", "==", "pending")
  );


  const snapshot = await getDocs(q);


  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];

};




/**
 * Complete Task
 */
export const completeTask = async (
  taskId:string
) => {

  const taskRef = doc(
    db,
    "tasks",
    taskId
  );


  await updateDoc(
    taskRef,
    {
      status:"completed"
    }
  );

};




/**
 * Delete Task
 */
export const deleteTask = async (
  taskId:string
)=>{

 await deleteDoc(
    doc(db,"tasks",taskId)
 );

};





/**
 * Pending Task → Daily Task Conversion
 *
 * Example:
 * Yesterday pending task
 * ↓
 * Today Daily Task
 */
export const convertPendingToDaily = async (
 userId:string
)=>{


 const pendingTasks = await getPendingTasks(userId);


 const today = new Date()
 .toISOString()
 .split("T")[0];


 for(const task of pendingTasks){


   if(task.id){

    await updateDoc(
      doc(db,"tasks",task.id),
      {
        type:"daily",
        date:today,
        status:"pending"
      }
    );

   }

 }


};