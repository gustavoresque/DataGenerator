
# DataGen

- [Constructor](#constructor)
  - [**DataGen**()](#datagen-cons)
- [Static properties](#static-properties)
  - [DataGen.**listOfGens**](#DataGen.listOfGens)
  - [DataGen.**listOfGensHelp**](#DataGen.listOfGensHelp)
  - [DataGen.**listOfGensForNoise**](#DataGen.listOfGensForNoise)
  - [DataGen.**listOfGensComplete**](#DataGen.listOfGensComplete)
  - [DataGen.**superTypes**](#DataGen.superTypes)
  - [DataGen.**Utils**](#DataGen.Utils)
- [Static methods](#static-methods)
- [Instance properties](#instance-properties)
  - [dg.**name**](#dg.name)
  - [dg.**n_lines**](#dg.n_lines)
  - [dg.**step_lines**](#dg.step_lines)
  - [dg.**n_sample_lines**](#dg.n_sample_lines)
  - [dg.**save_as**](#dg.save_as)
  - [dg.**header**](#dg.header)
  - [dg.**header_type**](#dg.header_type)
  - [dg.**columns**](#dg.columns)
  - [dg.**iterator**](#dg.iterator)
  - [dg.**ID**](#dg.ID)
  - [dg.**columnsCounter**](#dg.columnsCounter)
  - [dg.**filePath**](#dg.filePath)
  - [dg.**datagenChange**](#dg.datagenChange)
  - [dg.**seed**](#dg.seed)
  - [dg.**memento**](#dg.memento)
  - [dg.**configs**](#dg.configs)
- [Instance methods](#instance-methods)
  - [dg.**getColumnsNames**()](#dg.getColumnsNames)
  - [dg.**getDisplayedColumnsNames**()](#dg.getDisplayedColumnsNames)
  - [dg.**addColumn**(name[, generator])](#dg.addColumn)
  - [dg.**changeGeneratorToIndex**(index, gen, order)](#dg.changeGeneratorToIndex)
  - [dg.**addGeneratorToIndex**(index, gen)](#dg.addGeneratorToIndex)
  - [dg.**removeLastGenerator**(index)](#dg.removeLastGenerator)
  - [dg.**removeColumn**(index)](#dg.removeColumn)
  - [dg.**generateSample**()](#dg.generateSample)
  - [dg.**generate**()](#dg.generate)
  - [dg.**resetAll**()](#dg.resetAll)
  - [dg.**exportModel**()](#dg.exportModel)
  - [dg.**importModel**(model_str, resetColumns)](#dg.importModel)
  - [dg.**saveState**()](#dg.saveState)
  - [dg.**forward**()](#dg.forward)
  - [dg.**restore**()](#dg.restore)
  - [dg.**exportDot**()](#dg.exportDot)
  - [dg.**findGenByID**(ID)](#dg.findGenByID)

## Constructor

<a href="#DataGen-cons" name="DataGen-cons">></a> **DataGen**()

Há somente construtor sem parâmetros. Exemplo:

```javascript
//import datagen.js, this will return the class DataGen
let DataGen = require('./datagen.js').

//creating a new instance of DataGen
let dg = new DataGen();
```

## Static properties

<a href='#DataGen.listOfGens' name='DataGen.listOfGens'>&raquo;</a> DataGen.**listOfGens** : `Object`

Armazena uma lista (chave-valor) das classes de geradores que podem ser listados no Block para os usuários. Todas as classes presentes na lista podem ser instanciadas. O código abaixo mostra o nome das classes no console.

```javascript
for(let name of dg.listOfGens.keys())
    console.log(name);
```

Esse objeto é utilizado principalmente para ter acesso aos construtores de cada gerador para instaciá-los. Por exemplo, o código abaixo mostra como instaciar um `GaussianGenerator`.

```javascript
let GaussianGenerator = dg.listOfGens['Gaussian Generator'];
let gaussian = new GaussianGenerator();
```

<br><a href='#DataGen.listOfGensHelp' name='DataGen.listOfGensHelp'>&raquo;</a> DataGen.**listOfGensHelp** : `Object`

Esse objeto armazena uma lista (chave-valor) de strings contendo uma descrição sobre o que cada gerador faz.

<br><a href='#DataGen.listOfGensForNoise' name='DataGen.listOfGensForNoise'>&raquo;</a> DataGen.**listOfGensForNoise** : `Object`

Esse objeto armazena uma lista (chave-valor) de classes que podem ser utilizadas para geração de ruído numérico.

<br><a href='#DataGen.listOfGensComplete' name='DataGen.listOfGensComplete'>&raquo;</a> DataGen.**listOfGensComplete** : `Object`

Esse objeto armazena uma lista (chave-valor) de todas as classes de geradores que podem ser instaciadas, inclusive as que não são listadas para o usuário. Tem o mesmo formato que a `DataGen.listOfGens`

<br><a href='#DataGen.superTypes' name='DataGen.superTypes'>&raquo;</a> DataGen.**superTypes** : `Object`

Esse objeto armazena uma lista (chave-valor) de todas as classes abstratas presentes nesse módulo para que possam ser instanciadas.

<br><a href='#DataGen.Utils' name='DataGen.Utils'>&raquo;</a> DataGen.**Utils** : `Object`

Esse objeto armazena uma lista (chave-valor) de funções utilitárias que poupam a repetição de código.

## Static methods

## Instance properties

<a href='#dg.name' name='dg.name'>&raquo;</a> dg.**name** : `String`

O nome do modelo gerador.

<br><a href='#dg.n_lines' name='dg.n_lines'>&raquo;</a> dg.**n_lines** : `Number`

Um inteiro que identifica quantas linhas serão geradas no dataset final.

<br><a href='#dg.step_lines' name='dg.step_lines'>&raquo;</a> dg.**step_lines** : `Number`

Identifica o número máximo de linha a ser gerado, quando um valor é especificado pelo método `dg.generate()`.

<br><a href='#dg.n_sample_lines' name='dg.n_sample_lines'>&raquo;</a> dg.**n_sample_lines** : `Number`

Um inteiro que identifica quantas linhas serão geradas como amostras para serem avaliadas na aplicação em tempo real durante modificações no modelo. O valor padrão é `100`.

<br><a href='#dg.save_as' name='dg.save_as'>&raquo;</a> dg.**save_as** : `String`

Identifica o tipo de arquivo que será utilizado para salvar a base de dados que será gerada. O valor padrão é `"csv"`. Até o momento o outro tipo possível é `"json"`.

<br><a href='#dg.header' name='dg.header'>&raquo;</a> dg.**header** : `Boolean`

<br><a href='#dg.header_type' name='dg.header_type'>&raquo;</a> dg.**header_type** : `Boolean`

<br><a href='#dg.columns' name='dg.columns'>&raquo;</a> dg.**columns** : `Array`

<br><a href='#dg.iterator' name='dg.iterator'>&raquo;</a> dg.**columns** : `Object`

<br><a href='#dg.ID' name='dg.ID'>&raquo;</a> dg.**ID** : `String`

<br><a href='#dg.columnsCounter' name='dg.columnsCounter'>&raquo;</a> dg.**columnsCounter** : `Number`

<br><a href='#dg.filePath' name='dg.filePath'>&raquo;</a> dg.**filePath** : `String`

<br><a href='#dg.datagenChange' name='dg.datagenChange'>&raquo;</a> dg.**datagenChange** : `Boolean`

<br><a href='#dg.seed' name='dg.seed'>&raquo;</a> dg.**seed** : `String`

<br><a href='#dg.memento' name='dg.memento'>&raquo;</a> dg.**memento** : `Object`

<br><a href='#dg.configs' name='dg.configs'>&raquo;</a> dg.**configs** : `Object`

## Instance methods

<a href="#dg.getColumnsNames" name='dg.getColumnsNames'>&raquo;</a> dg.**getColumnsNames**() : `Array`

<a href="#dg.getDisplayedColumnsNames" name='dg.getDisplayedColumnsNames'>&raquo;</a> dg.**getDisplayedColumnsNames**() : `Array`

<a href="#dg.addColumn" name='dg.addColumn'>&raquo;</a> dg.**addColumn**(name[, generator])

<a href="#dg.changeGeneratorToIndex" name='dg.changeGeneratorToIndex'>&raquo;</a> dg.**changeGeneratorToIndex**(index, gen, order)

<a href="#dg.addGeneratorToIndex" name='dg.addGeneratorToIndex'>&raquo;</a> dg.**addGeneratorToIndex**(index, gen)

<a href="#dg.removeLastGenerator" name='dg.removeLastGenerator'>&raquo;</a> dg.**removeLastGenerator**(index)

<a href="#dg.removeColumn" name='dg.removeColumn'>&raquo;</a> dg.**removeColumn**(index)

<a href="#dg.generateSample" name='dg.generateSample'>&raquo;</a> dg.**generateSample**() : `Array`

<a href="#dg.generate" name='dg.generate'>&raquo;</a> dg.**generate**() : `Array`

<a href="#dg.resetAll" name='dg.resetAll'>&raquo;</a> dg.**resetAll**()

<a href="#dg.exportModel" name='dg.exportModel'>&raquo;</a> dg.**exportModel**() : `String`

<a href="#dg.importModel" name='dg.importModel'>&raquo;</a> dg.**importModel**(model_str, resetColumns)

<a href="#dg.saveState" name='dg.saveState'>&raquo;</a> dg.**saveState**()

<a href="#dg.forward" name='dg.forward'>&raquo;</a> dg.**forward**()

<a href="#dg.restore" name='dg.restore'>&raquo;</a> dg.**restore**()

<a href="#dg.exportDot" name='dg.exportDot'>&raquo;</a> dg.**exportDot**() : `String`

<a href="#dg.findGenByID" name='dg.findGenByID'>&raquo;</a> dg.**findGenByID**(ID) : `String`
