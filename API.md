
# Blocks API Reference

- [DataGen](#datagen)
- [Column](#column)
- [Generator](#generator)
  - Accessory
  - Function
    - SwitchCaseFunction
  - Geometric
  - Random
  - Sequence
  

## [DataGen](docs/datagen.md)

Esta é a *classe* principal do Blocks, ele é responsável por organizar os geradores em colunas para gerar o conjunto de dados.

Além disso, essa é classe exportada via `module.exports` quando se utiliza o comando `require`. Por exemplo:

```javascript
//import datagen.js, this will return the class DataGen
let DataGen = require('./datagen.js').

//creating a new instance of DataGen
let dg = new DataGen();

```

## [Column](docs/column.md)

Esta classe é responsável por armazenar alguns metadados sobre os atributos da base de dados a ser gerada.

Geralmente não será necessário instaciar objetos dessa classe manualmente, uma vez que objetos Datagen já possuem o método `dg.addColumn()` que já instacia a classe internamente.

## [Generator](docs/generator.md)

> abstract class

Esta classe é o tipo mais abstrato de gerador e tem o propósito de organizar uma interface comum a todos os geradores e permitir possíveis reutilizações de código.

Os geradores podem ser encadeados para formar uma geração combinada de vários tipos. Esse encadeamento segue grande parte da lógica presente no padrão de projetos Decorator.

## [Accessory](docs/accessory.md) extends [Generator](docs/generator.md)

Essa classe é o tipo abstrato para geradores acessórios, ou seja, geradores que modificam valores já gerados na cadeia de geradores. Por tanto, esses geradores devem ser sempre usados com outros tipos de geradores para que façam sentido.

## [Function](docs/function.md) extends [Generator](docs/generator.md)

Essa classe é o tipo abstrato para geradores que utilizam valores de outras colunas (atributos) da base de dados gerada. Geradores desse tipo são especialmente úteis para criar uma correlação entre atributos da base de dados.
