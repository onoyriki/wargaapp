const functions = require('firebase-functions');

// admin.initializeApp(); // Commented out to prevent auth hangs

exports.testDeploy = functions.https.onRequest((req, res) => {
    res.send("Hello from Firebase Functions!");
});
