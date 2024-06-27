const {  collection, query, orderBy, limit, getDocs,getDoc, doc, updateDoc ,deleteDoc, where, increment } = require('firebase/firestore');
const db = require('../config/firebase');
const moment = require('moment-timezone');
const cron = require('node-cron');
const rewardArray = require('../constant/rewardArray');
const topRewards = require('../constant/topRewards');

async function checkIsLoggedInToday(db) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("loggedInToday", "==", false));
        const querySnapshot = await getDocs(q);

        const updatePromises = querySnapshot.docs.map(async (item) => {
            const userId = item.data().userId;
            const usersUpdateRef = doc(db, "users", userId);
            return updateDoc(usersUpdateRef, { loginDays: 1 });
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error on checkIsLoggedInToday: ", error);
    }
}

async function checkLoginDaysSize(db, rewardArray) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("loginDays", ">=", rewardArray.length));
        const querySnapshot = await getDocs(q);

        const updatePromises = querySnapshot.docs.map(async (item) => {
            const userId = item.data().userId;
            const usersUpdateRef = doc(db, "users", userId);
            return updateDoc(usersUpdateRef, { loginDays: 0 });
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error on checkLoginDaysSize: ", error);
    }
}

async function resetLoginDays(db, rewardArray) {
    await checkIsLoggedInToday(db);
    await checkLoginDaysSize(db, rewardArray);
}

async function grantTopUserRewards(db, topRewards) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("coins", "desc"), limit(5));
        const querySnapshot = await getDocs(q);

        const updatePromises = querySnapshot.docs.map(async (item, index) => {
            const userId = item.data().userId;
            const usersUpdateRef = doc(db, "users", userId);
            return updateDoc(usersUpdateRef, { coins: increment(topRewards[index]) });
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error granting users' rewards:", error);
    }
}

async function dropLeaderboardCollection(db) {
    try {
        const yesterday = moment().tz('Asia/Kuala_Lumpur').subtract(1, 'days').format('YYYY_MM_DD');
        const usersRef = collection(db, `mascot1_${yesterday}`);
        const querySnapshot = await getDocs(usersRef);

        const deletePromises = querySnapshot.docs.map(async (item) => {
            const userId = item.data().userId;
            const deleteDocRef = collection(db, "users", userId);
            return deleteDoc(deleteDocRef);
        });

        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error deleting leaderboard docs:", error);
    }
}

// Task run every day 00:00
const task = cron.schedule('0 0 * * *', () => {
    resetLoginDays(db, rewardArray);
    grantTopUserRewards(db, topRewards);
}, {
    scheduled: true,
    timezone: "Asia/Kuala_Lumpur"
});

// Task run every day 00:01 to drop leaderboard collection
const task2 = cron.schedule('0 1 * * *', () => {
    dropLeaderboardCollection(db);
}, {
    scheduled: true,
    timezone: "Asia/Kuala_Lumpur"
});

module.exports = { task, task2 }
