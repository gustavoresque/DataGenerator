const electron = require('electron');
const dialog = electron.dialog;
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
let mainWindow, visWindows = [];



function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 900, height: 600});
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

    ipcMain.on('change-datasample', (event, message) => {
        if(message)
            for(let w of visWindows)
                w.webContents.send('change-datasample', message);
    });
    ipcMain.on('update-sampledata', function () {
        mainWindow.webContents.send('update-sampledata');
    });

    let funcOpenVisWindow = (visType) => {
        let visWindow = new BrowserWindow({width: 900, height: 600, show: false,});
        visWindows.push(visWindow);
        visWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'pages/visualization.html'),
            protocol: 'file:',
            slashes: true
        }));
        visWindow.on('closed', function () {
            let i = visWindows.indexOf(visWindow);
            visWindows.splice(i,1);
            visWindow = undefined;
        });
        visWindow.once('ready-to-show', () => {
            visWindow.show();
            visWindow.webContents.send('add-vis', visType);
            mainWindow.webContents.send('update-sampledata');
        });
    };

    const menu = new Menu();
    menu.append(new MenuItem(
        {
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
                                mainWindow.webContents.executeJavaScript("createImportModel('"+ data +"');");
                            });
                        }
                        //mainWindow.webContents.executeJavaScript('createImportModel("'+ str +'");');
                    }},
                {label: 'Export Model', click (){
                        dialog.showSaveDialog({title:"Salvar modelo"}, function(targetPath) {
                            if(targetPath){
                                let partsOfStr = targetPath.split('\\');
                                targetPath = "";
                                for (let i = 0; i < partsOfStr.length; i++){
                                    targetPath += partsOfStr[i] + "\\\\";
                                }
                                console.log(targetPath);
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
        }
    ));
    menu.append(new MenuItem(
        {
            label: 'Visualize',
            submenu: [
                {
                    label: 'Parallel Coordinates',
                    click(){
                        funcOpenVisWindow('ParallelCoordinates');
                    }

                },
                {
                    label: 'Scatterplot Matrix',
                    click(){
                        funcOpenVisWindow('ScatterplotMatrix');
                    }
                },
                {
                    label: 'Beeswarm Plot',
                    click(){
                        funcOpenVisWindow('BeeswarmPlot');
                    }
                }
            ]
        }
    ));
    menu.append(new MenuItem(
        {
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
        }
    ));
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
