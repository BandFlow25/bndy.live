import { db } from "./src/lib/config/firebase.js"; // Ensure the correct path

const oldCollection = "bf_nonbands"; // Existing collection
const newCollection = "bf_artists"; // New collection

async function renameCollection() {
    if (!db) {
        console.error("❌ Firestore DB is undefined. Check your Firestore setup.");
        return;
    }

    try {
        console.log(`📦 Fetching documents from collection: ${oldCollection}...`);
        const snapshot = await db.collection(oldCollection).get();

        if (snapshot.empty) {
            console.log(`⚠️ No documents found in ${oldCollection}`);
            return;
        }

        console.log(`📋 Found ${snapshot.size} documents. Copying to ${newCollection}...`);

        const batch = db.batch();
        snapshot.forEach((doc) => {
            const newDocRef = db.collection(newCollection).doc(doc.id);
            batch.set(newDocRef, doc.data());
        });

        await batch.commit();
        console.log(`✅ Successfully copied all documents to ${newCollection}`);

    } catch (error) {
        console.error("❌ Error renaming collection:", error);
    }
}

renameCollection();
