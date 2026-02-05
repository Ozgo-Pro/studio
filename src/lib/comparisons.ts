'use client';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const uploadImage = async (
  storage: FirebaseStorage,
  userId: string,
  image: string
): Promise<string> => {
  const response = await fetch(image);
  const blob = await response.blob();
  const imageId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const fileType = blob.type.split('/')[1] || 'jpeg';
  const storageRef = ref(
    storage,
    `comparisons/${userId}/${imageId}.${fileType}`
  );
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const saveComparison = async (
  firestore: Firestore,
  storage: FirebaseStorage,
  userId: string,
  name: string,
  image1: string,
  image2: string
) => {
  const [image1Url, image2Url] = await Promise.all([
    uploadImage(storage, userId, image1),
    uploadImage(storage, userId, image2),
  ]);

  const comparisonData = {
    name,
    image1Url,
    image2Url,
    createdAt: serverTimestamp(),
  };

  const comparisonsCol = collection(firestore, `users/${userId}/comparisons`);

  try {
    await addDoc(comparisonsCol, comparisonData);
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: comparisonsCol.path,
      operation: 'create',
      requestResourceData: comparisonData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // rethrow to be caught by component
  }
};
