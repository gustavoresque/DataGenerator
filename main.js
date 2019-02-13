const electron = require('electron');
const dialog = electron.dialog;

const spawn = require('cross-spawn');

// Module to control application life.
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

const app = electron.app;
const globalShortcut = electron.globalShortcut;
const ipcMain = require('electron').ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
const fs = require('fs');

const menu = new Menu();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, visWindows = [], visDimenWindows = [];
let visDimensionWindow;

let file_path = undefined;

let sockets = [];
let isCPActive = false; //isChildProcessActive;
let dtSaved = false; // Blocks de Application do quit. Set false only if the html load successfully!

ipcMain.on("active-child-process", (event) => {
    isCPActive = true;
    event.returnValue = 1;
})

ipcMain.on("child-process-ended", (event) => {
    isCPActive = false;
    event.returnValue = 1;
})

ipcMain.on("child-process-killed", (event) => {
    isCPActive = false;
    app.quit();
    event.returnValue = 1;
})

ipcMain.on("autosave-verified", (event) => {
    dtSaved = true;
    app.quit();
    event.returnValue = 1;
})

let dtChanges = [false];

ipcMain.on("dtChanges-reload", (event,value) => {
    dtChanges = [false];
    event.returnValue = 1;
})

ipcMain.on("dtChanges-add", (event,value) => {
    dtChanges.push(value);
    event.returnValue = 1;
})
ipcMain.on("dtChanges-del", (event,index) => {
    dtChanges.pop(index);
    event.returnValue = 1;
})
ipcMain.on("dtChanges-alter", (event,index,value) => {
    dtChanges[index] = value;
    event.returnValue = 1;
})

function saveExport(targetPath) {

    let partsOfStr = targetPath.split('\\');
    targetPath = "";
    for (let i = 0; i < partsOfStr.length; i++){
        let backslash = i == partsOfStr.length - 1 ? "" : "\\\\";
        targetPath += partsOfStr[i] + backslash;
    }
    mainWindow.webContents.executeJavaScript("createExportModel('" + targetPath + "');");
}

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



    const menuTemplateFile = {
        label: 'File',
        submenu: [
            {label: 'New Model', accelerator: process.platform === "darwin" ? 'Cmd+M' : 'Ctrl+M', click (){
                    mainWindow.webContents.executeJavaScript('createNewModel();');
                }},
            {label: 'New Dimension', accelerator: process.platform === "darwin" ? 'Cmd+D' : 'Ctrl+D', click (){
                    mainWindow.webContents.executeJavaScript('addGenerator();');
                }},
            {label: 'Open Model', click (){
                    let pathFile = dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile']
                    });
                    if(pathFile){
                        mainWindow.webContents.send('open-datagen', pathFile.toString());
                        // let name = pathFile.toString().split('\\')[pathFile.toString().split('\\').length-1];
                        // mainWindow.webContents.executeJavaScript("createImportModel('"+ name.split('.')[0] +"','"+ data +"');");

                    }
                    //mainWindow.webContents.executeJavaScript('createImportModel("'+ str +'");');
                }},
            {label: 'Save Model', accelerator: process.platform === "darwin" ? 'Cmd+S' : 'Ctrl+S', click (){
                    mainWindow.webContents.send('export-datagen', "save");
                }},
            {label: 'Save Model As', click (){
                    mainWindow.webContents.send('export-datagen', "saveas");
                }},
            {type: 'separator'},
            {
                label: 'Import Real DataSet', click (){
                    dialog.showOpenDialog(mainWindow, {title:"Open DataSet", properties: ['openFile'], filters:[
                                {name: 'JSON', extensions:['json']}, {name: 'CSV', extensions:['csv']}, {name: 'TSV', extensions:['tsv']}
                            ]}, function(targetPath) {
                            if(targetPath){
                                mainWindow.webContents.executeJavaScript('createModelFromDataSet("'+targetPath[0].replace(/\\/g,'\\\\')+'");');
                            }
                        }
                    );
                }
            },
            {type: 'separator'},
            {role: 'close'},
            {type: 'separator'},
            {label: 'Quit App', accelerator: process.platform === "darwin" ? 'Cmd+Q' : '', click: () => {mainWindow.webContents.send('quit-child-process');app.quit();}}
        ]
    };
    const menuTemplateEdit = {
        label: "Edit",
        submenu: [
            {label: 'Undo', accelerator: process.platform === "darwin" ? 'Cmd+Z' : 'Ctrl+Z', click () {
                mainWindow.webContents.send('undo-datagen');
            }},
            {label: 'Redo', accelerator: process.platform === "darwin" ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z', click () {
                mainWindow.webContents.send('redo-datagen');
            }}
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

    //Work on Mac.
    if(process.platform === 'darwin'){
        mainWindow.on("focus", ()=>{
            const menuTemplate = [menuTemplateFile, menuTemplateEdit, menuTemplateVisualize, menuTemplateDebug];
            Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
        });
    }

    //Work on Windows.
    menu.append(new MenuItem(menuTemplateFile));
    menu.append(new MenuItem(menuTemplateEdit));
    menu.append(new MenuItem(menuTemplateVisualize));
    menu.append(new MenuItem(menuTemplateDebug));
    mainWindow.setMenu(menu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

    mainWindow.on('close',function (e) {
        if(isCPActive) {
            e.preventDefault();
            mainWindow.webContents.send('quit-child-process');
        }
        if(!dtSaved) {
            e.preventDefault();
            if(dtChanges.length !== 0) {
                let saved = [], unsaved = [];
                for(let i in dtChanges) {if(dtChanges[i]) {unsaved.push(Number(i));} else {saved.push(Number(i));}}
                mainWindow.webContents.send('verify-autosave',saved,unsaved);
            } else {
                dtSaved = true;
                app.quit();
            }

        }
    });
    // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.

      mainWindow = null;

    // app.quit();
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
    if(!wss){
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

}
function uniqueID() {
    return (Math.random()*Date.now()/Math.random()).toString(36);
}


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
