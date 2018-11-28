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
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, visWindows = [], visDimenWindows = [];
let visDimensionWindow;

let sockets = [];



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
        // if(message)
        //     for(let w of visWindows)
        //         w.webContents.send('change-datasample', message);
        if(message)
            for(let s of sockets)
                s.send(JSON.stringify({act:'change-datasample', msg: message}));
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

    let funcOpenVisWindow = (visType) => {
        // let visWindow = new BrowserWindow({width: 900, height: 600, show: false,});
        // addVisWindowMenu(visWindow);
        // visWindows.push(visWindow);


        child = spawn('npm', ['start', 'websocketmode=on'], {cwd: "../VisApplication"});
        child.on("error", (message)=>{
            console.log(message);
        });



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
                            initServerWebSocket();
                            break;
                        case "cl":
                            console.log("cl", obj.msg);
                            break;
                    }
                }
            }
        });

        // visWindow.loadURL(url.format({
        //     pathname: path.join(__dirname, 'pages/visualization.html'),
        //     protocol: 'file:',
        //     slashes: true
        // }));
        // visWindow.on('closed', function () {
        //     let i = visWindows.indexOf(visWindow);
        //     visWindows.splice(i,1);
        //     visWindow = undefined;
        // });
        // visWindow.once('ready-to-show', () => {
        //     visWindow.show();
        //     visWindow.webContents.send('add-vis', visType);
        //     mainWindow.webContents.send('update-sampledata');
        // });
    };

    const menu = new Menu();

    const menuTemplateFile = {
        label: 'File',
        submenu: [
            {label: 'New Model', click (){
                    mainWindow.webContents.executeJavaScript('createNewModel();');
                }},
            {label: 'Import Model', click (){
                    let pathFile = dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile']
                    });
                    if(pathFile){
                        fs.readFile(pathFile.toString(), 'utf8', (err, data) => {
                            if (err) throw err;

                            console.log("foi aqui");
                            mainWindow.webContents.send('open-datagen', data);
                            // let name = pathFile.toString().split('\\')[pathFile.toString().split('\\').length-1];
                            // mainWindow.webContents.executeJavaScript("createImportModel('"+ name.split('.')[0] +"','"+ data +"');");
                        });
                    }
                    //mainWindow.webContents.executeJavaScript('createImportModel("'+ str +'");');
                }},
            {label: 'Export Model', click (){
                    dialog.showSaveDialog({title:"Salvar modelo", filters:[{name: 'json', extensions: ['json']}]}, function(targetPath) {
                        if(targetPath){
                            let partsOfStr = targetPath.split('\\');
                            targetPath = "";
                            for (let i = 0; i < partsOfStr.length; i++){
                                let backslash = i == partsOfStr.length - 1 ? "" : "\\\\";
                                targetPath += partsOfStr[i] + backslash;
                            }
                            mainWindow.webContents.executeJavaScript("createExportModel('" + targetPath + "');");
                        }
                    });
                    //mainWindow.webContents.executeJavaScript('createExportModel("' + str + '");');
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
            {role: 'close'}
        ]
    };

    const menuTemplateVisualize = {
        label: 'Visualize',
        submenu: [
            {
                label: "Sample",
                submenu: [
                    {
                        label: 'Parallel Coordinates',
                        click(){ funcOpenVisWindow('ParallelCoordinates'); }
                    },
                    {
                        label: 'Bundled Parallel Coordinates',
                        click(){ funcOpenVisWindow('ParallelBundling'); }
                    },
                    {
                        label: 'Scatterplot Matrix',
                        click(){ funcOpenVisWindow('ScatterplotMatrix'); }
                    },
                    {
                        label: 'Beeswarm Plot',
                        click(){ funcOpenVisWindow('BeeswarmPlot'); }
                    },
                    {
                        label: 'Treemap',
                        click(){ funcOpenVisWindow('Treemap'); }
                    }
                ]
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
            const menuTemplate = [menuTemplateFile, menuTemplateVisualize, menuTemplateDebug];
            Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
        });
    }

    //Work on Windows.
    menu.append(new MenuItem(menuTemplateFile));
    menu.append(new MenuItem(menuTemplateVisualize));
    menu.append(new MenuItem(menuTemplateDebug));
    mainWindow.setMenu(menu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

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

function initServerWebSocket() {
    const WebSocket = require('ws');

    const ws = new WebSocket('ws://127.0.0.1:6661/');

    ws.on('open', function () {
        sockets.push(ws);
        console.log("WebSocket Opened!");
        ws.send('something');
    });

    ws.on('message', function (data) {
        console.log(data);
    });

    ws.on('close', function(){
        let i = sockets.indexOf(ws);
        sockets.splice(i,1);
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
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
