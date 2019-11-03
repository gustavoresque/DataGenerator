const electron = require('electron');
const dialog = electron.dialog;

const spawn = require('cross-spawn');

// Module to control application life.
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

const app = electron.app;
const ipcMain = require('electron').ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
const net = require('net')
const { promisify } = require('util')

const menu = new Menu();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, visWindows = [], visDimenWindows = [];
let visDimensionWindow;

let sockets = [];

ipcMain.on("get-path2", function (event, arg) {
    mainWindow.webContents.send('get-path', arg);
});

function createWindow () {

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 900, height: 600, icon: "icon3.png"});
  mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    let configDatagenWindow;
    ipcMain.on('open-config-datagen-window', (event, arg) => {
        configDatagenWindow = new BrowserWindow({
            parent: mainWindow,
            width: 675,
            height: 500,
            show: false,
            resizable: true,
            closable: false,
            minimizable: false,
            maximizable: false
        });
        // configDatagenWindow.setMenu(null);
        configDatagenWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'pages/configDatagen.html'),
            protocol: 'file:',
            slashes: true
        }));
        configDatagenWindow.on('closed', function () {
            configDatagenWindow = undefined;
        });
        configDatagenWindow.once('ready-to-show', () => {
            configDatagenWindow.show();
            configDatagenWindow.webContents.send('configure-datagen', arg);
        });
    });

    let drawWindow;
    ipcMain.on('draw-window', (event, message) => {
        drawWindow = new BrowserWindow({
            parent: mainWindow,
            width: 1000,
            height: 700,
            show: false,
            resizable: true,
            closable: true,
            minimizable: true,
            maximizable: true
        });

        drawWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'pages/drawWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        drawWindow.on('closed', function () {
            drawWindow = undefined;
        });
        drawWindow.once('ready-to-show', () => {
            drawWindow.maximize();
            drawWindow.show();
            drawWindow.webContents.send('open-window', message);
        });
    });

    ipcMain.on('call-datagen', (event, message) => {
        mainWindow.webContents.send('call-datagen', message);
    });
    ipcMain.on('receive-datagen', (event, message) => {
        if (message)
            configDatagenWindow.webContents.send('receive-datagen', message);
    });
    ipcMain.on('change-datagen', (event, message) => {
        if(message)
            mainWindow.webContents.send('change-datagen', message);
        if(configDatagenWindow){
            configDatagenWindow.setClosable(true);
            configDatagenWindow.close();
        }
    });

    ipcMain.on('change-WebService', (event, message) => {
        if(message) {
            mainWindow.webContents.send('change-WebService', message);
        } else {
            mainWindow.webContents.send('change-WebService', 'error');
        }
    });

    ipcMain.on('change-DistributedSystem', (event, message) => {
        if(message) {
            mainWindow.webContents.send('change-DistributedSystem', message);
        } else {
            mainWindow.webContents.send('change-DistributedSystem', 'error');
        }
    });

    ipcMain.on('change-datasample', (event, message) => {
        if(message)
            for(let s of sockets)
                s.send(JSON.stringify({
                    act:'change-datasample',
                    msg: message
                }));
    });
    ipcMain.on('update-sampledata', function () {
        mainWindow.webContents.send('update-sampledata');
    });

    ipcMain.on('generator-model', function () {
        mainWindow.webContents.send('update-sampledata');
    });

    ipcMain.on('receive-dimension-generator', (event, message) => {
        if (message)
            funcOpenVisDimenWindow(message);
    });

    let funcOpenVisDimenWindow = (message) => {
        let visDimenWindow = new BrowserWindow({width: 900, height: 600, show: false,});
        visDimenWindows.push(visDimenWindow);
        visDimenWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'pages/visDimension.html'),
            protocol: 'file:',
            slashes: true
        }));
        visDimenWindow.on('closed', function () {
            let i = visDimenWindows.indexOf(visDimenWindow);
            visDimenWindows.splice(i,1);
            visDimenWindow = undefined;
        });
        visDimenWindow.once('ready-to-show', () => {
            visDimenWindow.show();
            visDimenWindow.webContents.send('update-dimen-data', message);
        });
    };

    let funcOpenVisWindow = () => {

        child = spawn('npm', ['start', 'websocketmode=on', 'port=6661'], {cwd: "../VisApplication"});
        child.on("error", (message)=>{
            console.log(message);
        }).on("close", ()=>{
            console.log("child closed!");
        });
        initServerWebSocket();

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (data) => {

            if(typeof data === 'string'){
                let obj = {act:""};
                try{
                    obj = JSON.parse(data);
                }catch (e){
                    obj = {act:""};
                }
                if(obj && obj.act){
                    switch (obj.act){
                        case "init":
                            console.log("foi aqui");

                            break;
                        case "cl":
                            console.log("cl", obj.msg);
                            break;
                    }
                }
            }
        });
    };



    const menuTemplateElectron = {
        label: 'Electron',
        submenu:
            [
                {
                    label: 'Quit App',
                    accelerator: process.platform === "darwin" ? 'Cmd+Q' : '',
                    click: () => {
                        mainWindow.webContents.send('quit-child-process');
                        app.quit();
                    }
                }
            ]
    }
    const menuTemplateFile = {
        label: 'File',
        submenu:
            [
                {
                    label: 'New Model',
                    accelerator: process.platform === "darwin" ? 'Cmd+M' : 'Ctrl+M',
                    click () {
                        mainWindow.webContents.executeJavaScript('createNewModel();');
                    }
                },
                {
                    label: 'Delete Model',
                    accelerator: process.platform === "darwin" ? 'Cmd+W' : 'Ctrl+W',
                    click () {
                        mainWindow.webContents.send('delete-model');
                    }
                },
                {
                    label: 'New Dimension',
                    accelerator: process.platform === "darwin" ? 'Cmd+D' : 'Ctrl+D',
                    click () {
                        mainWindow.webContents.executeJavaScript('addGenerator();');
                    }
                },
                {
                    label: 'Open Model',
                    click () {
                        let pathFile = dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile']
                        });
                    if(!pathFile) return;
                    mainWindow.webContents.send('open-datagen', pathFile.toString());
                    }
                },
                {
                    label: 'Save Model',
                    accelerator: process.platform === "darwin" ? 'Cmd+S' : 'Ctrl+S',
                    click () {
                        mainWindow.webContents.send('export-datagen', "save");
                    }
                },
                {
                    label: 'Save Model As',
                    click () {
                        mainWindow.webContents.send('export-datagen', "saveas");
                    }
                },
                { type: 'separator' },
                {
                    label: 'Import Real DataSet', click (){
                        dialog.showOpenDialog(mainWindow,
                            {
                                title:"Open DataSet",
                                properties: ['openFile'],
                                filters:
                                    [
                                        {
                                            name: 'JSON',
                                            extensions:['json']
                                        }, {
                                            name: 'CSV',
                                            extensions:['csv']
                                        }, {
                                            name: 'TSV',
                                            extensions:['tsv']
                                        }
                                    ]
                            },
                            function(targetPath) {
                                if(!targetPath) return;
                                mainWindow.webContents.executeJavaScript(`createModelFromDataSet("${targetPath[0].replace(/\\/g,'\\\\')}");`);
                            }
                        );
                    }
                }
        ]
    };
    const menuTemplateEdit = {
        label: "Edit",
        submenu:
        [
            {
                label: 'Undo',
                accelerator: process.platform === "darwin" ? 'Cmd+Z' : 'Ctrl+Z',
                click () {
                    mainWindow.webContents.send('undo-datagen');
                }
            },
            {
                label: 'Redo',
                accelerator: process.platform === "darwin" ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z',
                click () {
                    mainWindow.webContents.send('redo-datagen');
                }
            }
        ]
    };
    const menuTemplateDataModel = {
        label: 'Data Model',
        submenu:
            [
                {
                    label: 'Rename',
                    click () {
                        mainWindow.webContents.executeJavaScript('renameModel();');
                    }
                },
                {
                    label: 'Export',
                    click () {
                        mainWindow.webContents.executeJavaScript('exportModelDot();');
                    }
                },
                {
                    label: 'Delete',
                    click () {
                        mainWindow.webContents.executeJavaScript('deleteModel();');
                    }
                },
                {
                    label: 'Model ID to Clipboard',
                    click () {
                        mainWindow.webContents.executeJavaScript('CopyModelId();');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Web Service',
                    click () {
                        mainWindow.webContents.executeJavaScript('toggleWS();');
                    }
                },
                {
                    label: 'Open Web Service',
                    click () {
                        mainWindow.webContents.executeJavaScript('openWS();');
                    }
                },
                {
                    label: 'Web Service URI to Clipboard',
                    click () {
                        mainWindow.webContents.executeJavaScript('uriWS();');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Server Distributed System',
                    click () {
                        mainWindow.webContents.executeJavaScript('startServerSocket();');
                    }
                },
                {
                    label: 'Toggle Client Distributed System',
                    click () {
                        mainWindow.webContents.executeJavaScript('startClientSocket();');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    click () {
                        mainWindow.webContents.executeJavaScript('configGeneration();');
                    }
                }
            ]
    };
    const menuTemplateVisualize = {
        label: 'Visualize',
        submenu: [
            {
                label: "Sample",
                click(){ funcOpenVisWindow(); }
            },
            {
                label: "Dimension",
                submenu: [
                    {
                        label: 'Histogram Cascade',
                        click() {
                            visDimensionWindow = new BrowserWindow({width: 900, height: 600, show: false,});
                            visDimensionWindow.loadURL(url.format({
                                pathname: path.join(__dirname, 'pages/visDimension.html'),
                                protocol: 'file:',
                                slashes: true
                            }));
                            visDimensionWindow.on('closed', function () {
                                visDimensionWindow = undefined;
                            });
                            mainWindow.webContents.send('getDataModel');

                        }
                    }
                ]
            }
        ]
    };

    const menuTemplateDebug = {
        label: 'Debug',
        submenu: [
            {
                label: 'Toggle Developer Tools',
                accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                click (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                }
            }
        ]
    };

    const menuTemplateAbout = {
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click(){ funcOpenAboutWindow(); }
            }
        ]
    };

    let aboutWindow;
    let funcOpenAboutWindow = () => {
        aboutWindow = new BrowserWindow({
            parent: mainWindow,
            width: 675,
            height: 500,
            show: false,
            resizable: true,
            closable: true,
            minimizable: false,
            maximizable: false
        });
        aboutWindow.setMenu(null);
        aboutWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'pages/aboutWindow.html'),
            protocol: 'file:',
            slashes: true
        }));
        aboutWindow.on('closed', function () {
            aboutWindow = undefined;
        });
        aboutWindow.once('ready-to-show', () => {
            aboutWindow.show();
        });
    };

    //Work on Mac.
    if(process.platform === 'darwin'){
        mainWindow.on("focus", ()=>{
            const menuTemplate = [menuTemplateElectron,menuTemplateFile, menuTemplateEdit, menuTemplateDataModel, menuTemplateVisualize, menuTemplateDebug];
            Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
        });
    }

    //Work on Windows.
    menu.append(new MenuItem(menuTemplateFile));
    menu.append(new MenuItem(menuTemplateEdit));
    menu.append(new MenuItem(menuTemplateDataModel));
    menu.append(new MenuItem(menuTemplateVisualize));
    menu.append(new MenuItem(menuTemplateDebug));
    menu.append(new MenuItem(menuTemplateAbout));
    mainWindow.setMenu(menu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

      mainWindow = null;

    app.quit();
  });

}


function addVisWindowMenu(visWindow){
    let visMenu = new Menu();
    visMenu.append(new MenuItem({
        label: 'Select',
        submenu: [
            {
                label: "Type",
                submenu: [
                    {
                        label: 'New',
                        type: 'radio',
                        click(){  }
                    },
                    {
                        label: 'Add',
                        type: 'radio',
                        click(){  }
                    },
                    {
                        label: 'Subtract',
                        type: 'radio',
                        click(){  }
                    }
                ]
            },

            {type: 'separator'},

            {
                label: "Click",
                click(){  }
            },
            {
                label: "Rect",
                click(){  }
            },
            {
                label: "Free Drawing",
                click(){  }
            },
            {
                label: "Lasso",
                click(){  }
            },
        ]
    }));

    visMenu.append(new MenuItem({
        label: 'Filter',
        submenu: [
            {
                label: "Type",
                click(){  }
            },

            {type: 'separator'},

            {
                label: "Click",
                click(){  }
            },
            {
                label: "Rect",
                click(){  }
            },
            {
                label: "Free Drawing",
                click(){  }
            },
            {
                label: "Lasso",
                click(){  }
            },
        ]
    }));

    visMenu.append(new MenuItem({
        label: 'Color',
        submenu: [
            {
                label: "Type",
                click(){  }
            },

            {type: 'separator'},

            {
                label: "Click",
                click(){  }
            },
            {
                label: "Rect",
                click(){  }
            },
            {
                label: "Free Drawing",
                click(){  }
            },
            {
                label: "Lasso",
                click(){  }
            },
        ]
    }));

    visMenu.append(new MenuItem({
        label: 'Hierarchy',
        submenu: [
            {
                label: "Type",
                click(){  }
            },

            {type: 'separator'},

            {
                label: "Click",
                click(){  }
            },
            {
                label: "Rect",
                click(){  }
            },
            {
                label: "Free Drawing",
                click(){  }
            },
            {
                label: "Lasso",
                click(){  }
            },
        ]
    }));

    visMenu.append(new MenuItem({
        label: 'Details',
        submenu: [
            {
                label: "Type",
                click(){  }
            },

            {type: 'separator'},

            {
                label: "Click",
                click(){  }
            },
            {
                label: "Rect",
                click(){  }
            },
            {
                label: "Free Drawing",
                click(){  }
            },
            {
                label: "Lasso",
                click(){  }
            },
        ]
    }));

    visMenu.append(new MenuItem({
        label: 'Debug',
        submenu: [
            {
                label: 'Toggle Developer Tools',
                accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                click (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.webContents.toggleDevTools()
                }
            }
        ]
    }));


    visWindow.setMenu(visMenu);
    if(process.platform === 'darwin'){
        visWindow.on("focus", ()=>{
            Menu.setApplicationMenu(visMenu);
        });
    }
}

let wss;
function initServerWebSocket() {
    if(wss) return;
    let WebSocketServer = require('ws').Server;
    wss = new WebSocketServer({port: 6661});
    wss.on("connection", (ws)=>{
        sockets.push(ws);
        console.log("WebSocket Opened!");
        mainWindow.webContents.send('update-sampledata');
        ws.on('message', function (data) {
            console.log("WS Message: ", data);
        });
        ws.on('close', function(){
            let i = sockets.indexOf(ws);
            sockets.splice(i,1);
            if(sockets.length === 0){
                wss.close(()=>console.log("WSS Closed!"));
                wss = undefined;
            }
        });
    });

}
/*

ipcMain.on("get-path2", function (event, arg) {
    mainWindow.webContents.send('get-path', arg);
});

*/

let dsServer, dsClient;

ipcMain.on("startServerSocket", function (event, arg) {
    serverSocket(...arg)
});

ipcMain.on("startClientSocket", function (event, arg) {
    clientSocket(...arg)
});

let ds_clients = {};

async function closeSocket(socket) {
    try {
        if(socket === "server") {
            if(dsServer === undefined) return

            for(let client of Object.keys(ds_clients)) {
                try {
                    if(!ds_clients[client]["socket"].destroyed)
                        ds_clients[client]["socket"].write(JSON.stringify({code: 5}))
                } catch(e) {
                    console.error(e)
                }
            }

            await dsServer.close()
            dsServer = undefined
        } else if(socket === "client"){
            try {
                if(dsClient === undefined) return
                await dsClient.destroy()
                dsClient = undefined
            } catch(e) {
                //Provavelmente o distributedSystemSocket é undefined
                console.error(e)
            }
        }
    } catch(e) {
        throw e
    }
    
}

function serverSocket(port, id, model, mode, chunksNumber) {

    ds_clients = {}

    let chunksCounter = 0

    let chunksRecCounter = 0

    let chunksSentCounter = 0

    let clientsCounter = 0

    dsServer = net.createServer(function (socket) {
    
        const name = socket.remoteAddress + "--" + socket.remotePort
        clientsCounter++
        console.log(name)
    
        if(!ds_clients.hasOwnProperty(name)) {
            ds_clients[name] = {};
            ds_clients[name]["socket"] = socket;
        }

        socket.on("error", function(event, err) {
            console.log(err)
        })

        socket.on("close", function() {
            if(mode === "generating") {
                clientsCounter--
                mainWindow.webContents.send('dsGeneration', {clientsCounter, chunksNumber, chunksSentCounter,chunksRecCounter});
            }
            
        })
    
        socket.on('data', function (data) {
            jdata = JSON.parse(data.toString("utf-8"))
            if(!jdata.hasOwnProperty("code")) {
                delete ds_clients[name]
                return
            }

            if(mode === "generating") {
                generatingMode(socket, jdata, name)
            } else 
            if(mode === "recovering") {
                recoveringMode(socket, jdata)
            }
        });
    
    }).listen(port);

    function generatingMode(socket, jdata, name) {
        const code = jdata['code'];

            let chunk;
    
            switch(code) {
                case 1:
 
                    ds_clients[name]["sentChunk"] = []
                    ds_clients[name]["receivedChunk"] = []
    
                    chunk = getChunkInteration()
    
                    if(chunk === "done") {generationDone()} 
                    else {
                        sentCounter()

                        socket.write(JSON.stringify(
                            {
                                code: 2,
                                "id": id,
                                "model": model,
                                "chunk": chunk
                            }
                        ))

                        mainWindow.webContents.send('dsGeneration', {clientsCounter, chunksNumber, chunksSentCounter,chunksRecCounter});
                    }
                    break;
                case 4:
                    receivedCounter()

                    chunk = getChunkInteration()
    
                    if(chunk === "done") {generationDone()} 
                    else {
                        sentCounter()
                        socket.write(JSON.stringify({code: 3,"chunk": chunk}))
                        mainWindow.webContents.send('dsGeneration', {clientsCounter, chunksNumber, chunksSentCounter,chunksRecCounter});
                    }
                    break;
                case 6:
                    receivedCounter()
                    mainWindow.webContents.send('dsGeneration', {clientsCounter, chunksNumber, chunksSentCounter,chunksRecCounter});
                    break;
            }
            function generationDone() {
                closeSocket("server")
                mainWindow.webContents.send('dsGenerationDone', [ds_clients, id]);
            }
            function sentCounter() {
                ds_clients[name]["sentChunk"].push(chunk)
                chunksSentCounter++
            }
            function receivedCounter() {
                ds_clients[name]["receivedChunk"].push(jdata["chunk"])
                chunksRecCounter++
            }
    }

    function recoveringMode(socket, jdata, name) {
        const { code } = jdata;

        switch(code) {
            case 1:
                socket.write(JSON.stringify(
                    {
                        code: 12,
                        "id": id
                    }
                ))
                break
            case 13:
                //Don't have the required model
                socket.destroy()
                clientsCounter--
                break
            case 14:
                //Have the required model
                //Receive the number of chunks
                //Receive the first chunk
                const { chunks, filename, file } = jdata
                dsClient[name]["chunks"] = chunks
                dsClient[name]["receivedChunks"] = 1
                //Send to UILogic to save the chunk
                mainWindow.webContents.send('saveRecoveringFileUpdateClient', {filename, file, clientsCounter});
                break
            case 15:
                //receive another chunk
                const { chunks, filename, file } = jdata
                dsClient[name]["receivedChunks"]++
                if(dsClient[name]["chunks"] !== dsClient[name]["receivedChunks"]) {
                    mainWindow.webContents.send('saveRecoveringFile', {filename, file});
                }
                else {
                    clientsCounter--
                    mainWindow.webContents.send('saveRecoveringFileUpdateClient', {filename, file, clientsCounter});
                    socket.destroy()
                }
                //Send to UILogic to save the chunk
                //verify if end.

                break
        }
    }

    function getChunkInteration() {
        if (chunksCounter === chunksNumber)
            return "done" // codigo 5
        
        return chunksCounter++
    }
}

ipcMain.on("closeSocket", function (event, arg) {
    closeSocket(arg)
});

function clientSocket(port, ipAddress) {

    dsClient = new net.Socket(); // Todo: tornar global para melhor controle. Associar à variável generating!

    try {
        dsClient.connect(port, ipAddress, function (err) {
            if(err) 
                throw err
    
            dsClient.write(JSON.stringify({
                "code" : 1
            }))

            console.log("connect")
        })

        dsClient.on("error", function(e) {
            if(e.message.includes("ECONNREFUSED")) {
                console.error("was not possible to connect")
                mainWindow.webContents.send('dsErrorConnect');
            } else {
                console.log(e)
            }
            closeSocket("client")
        })
        
        dsClient.on('data', async function (data) {
            jdata = JSON.parse(data)
            if(!jdata.hasOwnProperty("code")) return
            mainWindow.webContents.send('dsData', jdata);
        });
    
        dsClient.on('close', function(event) {
            closeSocket("client")
            mainWindow.webContents.send('dsClientClose', event);
            console.log('DS Connection closed');
        });
    }
    catch(e) {
        console.error(e)
        //avisar ao cliente
        return
    }

}

ipcMain.on("chunkGenerated", function (event, chunk) {
    if(!dsClient) return
    dsClient.write(JSON.stringify({"code": 4, "chunk": chunk}))
})

ipcMain.on("chunkGeneratedAndDie", function (event, chunk) {
    if(!dsClient) return
    dsClient.write(JSON.stringify({"code": 6, "chunk": chunk}))
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    mainWindow.webContents.send('quit-child-process');

    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
