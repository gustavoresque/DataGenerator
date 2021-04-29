
# Blocks API Reference

- [DataGen](#datagen)
- [Column](#column)
- [Generator](#generator)
  - Function
    - SwitchCaseFunction
  - Sequence
  - Random
  - Accessory
  - Geometric

## [DataGen](docs/datagen.md)

Esta é a *classe* principal do Blocks, ele é responsável por organizar os geradores em colunas para gerar o conjunto de dados.

Além disso, essa é *classe* exportada via `module.exports` quando se utiliza o comando `require`. Por exemplo:

```javascript
//import datagen.js, this will return the class DataGen
let DataGen = require('./datagen.js').

//creating a new instance of DataGen
let dg = new DataGen();

```

## [Column](docs/column.md)

Esta *classe* é responsável por armazenar alguns metadados sobre os atributos da base de dados a ser gerada.

Geralmente não será necessário instaciar objetos dessa classe manualmente, uma vez que objetos Datagen já possuem o método `dg.addColumn()` que já instacia a classe internamente.

## [Generator](docs/generator.md)

Esta *classe* é o tipo mais abstrato de gerador e tem o propósito de organizar uma interface comum a todos os geradores e permitir possíveis reutilizações de código.

Os geradores podem ser encadeados para formar uma geração combinada de vários tipos. Esse encadeamento segue grande parte da lógica presente no padrão de projetos Decorator.
