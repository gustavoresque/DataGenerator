
const { ipcRenderer } = require('electron');



const fs = require('fs');
const net = require('net');
const { promisify } = require('util');
const electron = require('@electron/remote')
const {clipboard} = require('electron');
const dialog = electron.dialog;
const path = require('path');
const _ = require('lodash');
const DataGen = require("../datagen/datagen.js");
// const vis = require("@labvis-ufpa/vistechlib");

// console.log(window);
// // const d3 = require("d3");
// console.log(document.documentElement);
const {createServer,closeServer,changePort} = require('../WebService');
const Json2csvParser = require('json2csv').Parser;
const ipc = require('electron').ipcRenderer;



window.onload = ()=>{
  window.mainVariables.vis = require("@labvis-ufpa/vistechlib");
  window.mainVariables.onload();
}

window.mainVariables = {
  fs,
  net,
  promisify,
  electron,
  clipboard,
  dialog,
  path,
  _,
  DataGen,
  createServer,
  closeServer,
  changePort,
  Json2csvParser,
  ipc,
  process: process,
  onload: ()=>{console.log("vazio")}
};


// function init() {
//   // add global variables to your web page
// //   window.isElectron = true
// //   window.ipcRenderer = ipcRenderer
  

// }

// init();