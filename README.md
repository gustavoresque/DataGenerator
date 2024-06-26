# Blocks (DataGenerator)

This is an application for generating synthetic databases for helping the information visualization evaluation. The system aims to create a data model that allows the construction of datasets with a diversity of profiles in a controlled manner. During the data model creation, the user can visualize generated data samples in coordinated visualizations to validate if the data has the desired characteristics. The creator of the model can save it for future experiments or updates and can export it enabling other groups to replicate the experiments easily.

The [API Reference](API.md) is under construction.

## How to cite the project
If you have used the project to help you or to compare it with your proposal, we would be grateful if you cite our publications associated with this software. They are listed below:

- [A Prototype Application to Generate Synthetic Datasets for Information Visualization Evaluations](https://ieeexplore.ieee.org/document/8564154).
- [Synthetic Datasets Generator for Testing Information Visualization and Machine Learning Techniques and Tools](https://ieeexplore.ieee.org/abstract/document/9084138).

## How to build
First of all, you have to install the [electron-packager](https://github.com/electron-userland/electron-packager) in globally way running the code below:
```
npm install -g electron-packager
```
You can run the application locally running the code below:
```
npm start
```
After that you can run the following codes:
### Windows
```
electron-packager . --overwrite --asar=true --platform=win32 --arch=ia32 --prune=true --out=release-builds --version-string.ProductName="DataGenerator"
```
### Linux
```
electron-packager . --overwrite --asar=true --platform=linux --arch=x64 --prune=true --out=release-builds --version-string.ProductName="DataGenerator"
```
### MacOS
```
electron-packager . --overwrite --platform=darwin --arch=x64 --prune=true --out=release-builds --version-string.ProductName="DataGenerator"
```
## Team

This application was developed by Laboratório de Visualização, Interação e Sistemas inteligentes (LABVIS) from Universidade Federal do Para (UFPA) since 2018.
* [Page to Download Application](http://labvis.ufpa.br/datagen)

## License

[Apache 2.0 (Public Domain)](LICENSE)
