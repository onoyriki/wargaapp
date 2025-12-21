
import * as admin from 'firebase-admin';


const ADMIN_APP_NAME = 'ADMIN_APP';

function getAdminApp() {
    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
    if (existingApp) return existingApp;

    try {
        const serviceAccount = {
            projectId: "wargaapp-56a1f",
            clientEmail: "firebase-adminsdk-fbsvc@wargaapp-56a1f.iam.gserviceaccount.com",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCoZkj/wxc11u8e\ns38r2t9jjHtVFkmdTXN67SJCMN5nN3PUoQLnQUnnW4B8SKa54GpXwhQM1331jT1Z\n5HRFHdxaqEcPul1YLLVWljHE57iq6O86rZ/lQNlDW+vZ0jetjTMFopXV0GlNWTyj\nWT3o5cLGfVrnBrce0s/prignt0DbyLQACQhuZI61Cbv1KylhTO8gCpZbe1yOHFHy\n/FU4ci8L/qLY79wE1yhe+mlC5cFm6Bdhx6DWUlujAUyAUtKtDzONocIhmfJuVMJj\nJ5uPX8Xx/hY7d4+s7ifFGRBlKtze31sZWg7J3DES3qt0duYF2PF5mNicRt52ixZX\nW4WVe29DAgMBAAECggEAPgMIj7KCSg+/l3Em+/nJ+Gkjg5ZE/nmmdFZ9np1LUPwR\nGfQ+0vTuZ5WA74N7bghvcKil5IK4PiPIO2GO1WLlIbdFD8wjkpRIJL4DTsy76qgD\nbHrCXlQujYj8hYZNfYn5B3KzNXzdQiAB3e8/hpORUbGYt2l4JpAgAx/gZpurdSNO\nwX21DyEou0RCohV7qgk6HdTZ61rmYeQq1gCNlIGsoHKi97ZHUuulOEB6DHOJiknB\nzeZU+2NtFwDDBBK34U+Hsi1Lo9DWhnocihcxc6ElNhkBHUon+jC8d+lWRIjtKNNr\n/U0LCxsi7sLIJV/j2cXawkajqiIuYc2DZ1zwozr1uQKBgQDcUTZwV+i9wV9B1xx0\nb+G5/16aKAJyv8kdV0N8T0T/arSUV42qUUrJBO5Ss1xwAEmr9pLtTC8vHP1oPt1o\n35Rzsp8fxzbStrRhJLb8ODIVn2nRU5hal3gj9Y0AVkb9hHMM/injhvCrIhP2clWs\nL9OxBWp4p6JeSBwAUFIgqMuCawKBgQDDrHZ7X+b7SaxFUcYcUzpWH0RCwtOADhpi\nFjsqt2yDK1xyKSLFQy6Drx+25BV3a6o4Ota6s+aWp2YqhckQ2LQOqFp+fMWtEld9\nOC8q2rkaBSFeuhuKeMnzndd4f0wmJsCVviB18BEkku7WdpXrHWW0942FWEFmAdRv\nTC3Y8wjsiQKBgQDCe35O1YtCVny8JiOcNVdRVTgxZLgki2ABYpLUHTWPMqaNfGw1\nuOUHZi7rGiGzTM2720H/74yHTlPzveq9NQBa0YbeCoE+qMG6LyrIouKza7GBcwW+\nko8fTxdVANRR3qWhBov7qZaxurdciblO8jkwvtMqBvCxwX3WWRDme5qKWQKBgQCr\nm+SpnVlRh7J7dRVfoCqof3F5b67YPwYqgj7P3uBfRbclNCiXgq0Xto4E85JUEuvN\ntuS+B6sy84tpvb2ydaussz/ycPFZMZ3jZ1QOrJbsWBWFI4ml7vuHGiZwOoyJZTE/\n4uhLJwmR3v9yvbwL4NNjXD0U9msc0HwERHZtL/DiqQKBgCAEHB0L3U2hPSV8c1/O\nJtmradltzNBCNhrLz53LO9RiWrDK+5GwBvwlVB81rKbojjlGhLfp1rcrN9ppuKiK\nnJE0sSBaMoE263B3tpNKnxH4N3RGVbXqOw4zP02eH7vwjxJed5Y0FRUGiFlRGDAV\ngc0lXJMF0qABzSu22cEs0dGc\n-----END PRIVATE KEY-----\n"
        };

        // Ensure literal \n are treated as actual newlines
        serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');

        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        }, ADMIN_APP_NAME);

        console.log('[Admin] Firebase Admin initialized with cert (Named App)');
        return app;
    } catch (error) {
        console.error('[Admin Error] Firebase Admin initialization failed:', error);
        throw error;
    }
}

export const getAdminAuth = () => {
    return admin.auth(getAdminApp());
};

export const getAdminDb = () => {
    return admin.firestore(getAdminApp());
};
