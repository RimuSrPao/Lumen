const electron = require('electron');
console.log('Electron require result:', electron);
console.log('Type of electron:', typeof electron);
try {
    const { app } = electron;
    console.log('App is:', app);
} catch (e) {
    console.error(e);
}
