

const {
    contextBridge,
    ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "ipcAPI", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ['change-WebService', 'change-DistributedSystem', 'change-datagen', 'call-datagen'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        on: (channel, func) => {
            let validChannels = ['configure-datagen', 'update-dimen-data'];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);

//Isto não foi possível... Ele passa somente os valores do objeto sem expor os métodos.
// const DataGen = require("../datagen/datagen.js");
// contextBridge.exposeInMainWorld("DataGenAPI", {
//     getNew: ()=>{
//         return new DataGen();
//     }
// });