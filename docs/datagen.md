
# DataGen

- [Constructor](#constructor)
  - [DataGen()](#datagen-cons)
- [Static properties](#static-properties)
- [Static methods](#static-methods)
- [Instance properties](#instance-properties)
- [Instance methods](#instance-methods)
  - [dg.**getColumnsNames**()](#dg.getColumnsNames)

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

<a href='#DataGen.listOfGens' name='DataGen.listOfGens'>></a> DataGen.**listOfGens** : `Object`

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

<br><a href='#DataGen.listOfGensHelp' name='DataGen.listOfGensHelp'>></a> DataGen.**listOfGensHelp** : `Object`

Esse objeto armazena uma lista (chave-valor) de strings contendo uma descrição sobre o que cada gerador faz.

<br><a href='#DataGen.listOfGensForNoise' name='DataGen.listOfGensForNoise'>></a> DataGen.**listOfGensForNoise** : `Object`

Esse objeto armazena uma lista (chave-valor) de classes que podem ser utilizadas para geração de ruído numérico.

<br><a href='#DataGen.listOfGensComplete' name='DataGen.listOfGensComplete'>></a> DataGen.**listOfGensComplete** : `Object`

Esse objeto armazena uma lista (chave-valor) de todas as classes de geradores que podem ser instaciadas, inclusive as que não são listadas para o usuário. Tem o mesmo formato que a `DataGen.listOfGens`

<br><a href='#DataGen.superTypes' name='DataGen.superTypes'>></a> DataGen.**superTypes** : `Object`

Esse objeto armazena uma lista (chave-valor) de todas as classes abstratas presentes nesse módulo para que possam ser instanciadas.

<br><a href='#DataGen.listOfGens' name='DataGen.listOfGens'>></a> DataGen.**Utils** : `Object`

Esse objeto armazena uma lista (chave-valor) de funções utilitárias que poupam a repetição de código.

## Static methods

## Instance properties

<br><a href='#dg.name' name='dg.name'>></a> dg.**name** : `String`

O nome do modelo gerador.

<br><a href='#dg.n_lines' name='dg.n_lines'>></a> dg.**n_lines** : `Number`

Um inteiro que identifica quantas linhas serão geradas no dataset final.

<br><a href='#dg.step_lines' name='dg.step_lines'>></a> dg.**step_lines** : `Number`

Identifica o número máximo de linha a ser gerado, quando um valor é especificado pelo método `dg.generate()`.

<br><a href='#dg.n_sample_lines' name='dg.n_sample_lines'>></a> dg.**n_sample_lines** : `Number`

Um inteiro que identifica quantas linhas serão geradas como amostras para serem avaliadas na aplicação em tempo real durante modificações no modelo. O valor padrão é `100`.

<br><a href='#dg.save_as' name='dg.save_as'>></a> dg.**save_as** : `String`

Identifica o tipo de arquivo que será utilizado para salvar a base de dados que será gerada. O valor padrão é `"csv"`. Até o momento o outro tipo possível é `"json"`.

<br><a href='#gd.header' name='dg.header'>></a> dg.**header** : `Boolean`

<br><a href='#gd.header_type' name='dg.header_type'>></a> dg.**header_type** : `Boolean`

<br><a href='#gd.columns' name='dg.columns'>></a> dg.**columns** : `Array`

<br><a href='#gd.iterator' name='dg.iterator'>></a> dg.**columns** : `Object`

<br><a href='#gd.ID' name='dg.ID'>></a> dg.**ID** : `String`

<br><a href='#gd.columnsCounter' name='dg.columnsCounter'>></a> dg.**columnsCounter** : `Number`

<br><a href='#gd.filePath' name='dg.filePath'>></a> dg.**filePath** : `String`

<br><a href='#gd.datagenChange' name='dg.datagenChange'>></a> dg.**datagenChange** : `Boolean`

<br><a href='#gd.seed' name='dg.seed'>></a> dg.**seed** : `String`

<br><a href='#gd.memento' name='dg.memento'>></a> dg.**memento** : `Object`

## Instance methods

<a href="#dg.getColumnsNames" name='dg.getColumnsNames'>></a> dg.**getColumnsNames**() : `Array`

