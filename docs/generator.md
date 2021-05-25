
# Generator

> abstract class

- [Constructor](#constructor)
  - [**Generator**(name)](#Generator-cons)
- [Static properties](#static-properties)
  - [Generator.**Operators**](#Generator.Operator)
  - [Generator.**Utils**](#Generator.Utils)
  - [Generator.**listOfGenerators**](#Generator.listOfGenerators)
- [Static methods](#static-properties)
- [Instance properties](#static-properties)
  - [g.**name**](#g.name)
  - [g.**operator**](#g.operator)
  - [g.**order**](#g.order)
  - [g.**ID**](#g.ID)
  - [gen.**parent**](#gen.parent)
  - [g.**accessOperator**](#g.accessOperator)
- [Instance methods](#static-properties)
  - [g.**addGenerator**(gen)](#g.addGenerator)
  - [g.**sumOrder**()](#g.sumOrder)
  - [g.**unlink**()](#g.unlink)
  - [g.**insertGenerator**(gen)](#g.insertGenerator)
  - [g.**insertGeneratorBefore**(gen)](#g.insertGeneratorBefore)
  - [g.**getRootGenerator**()](#g.getRootGenerator)
  - [g.**changeGenerator**(gen)](#g.changeGenerator)
  - [g.**removeLastGenerator**()](#g.removeLastGenerator)
  - [g.**getFullGenerator**(generators)](#g.getFullGenerator)
  - [g.**generate**(sub_value)](#g.generate)
  - [g.**getGenParams**()](#g.getGenParams)
  - [g.**reset**()](#g.reset)
  - [g.**getModel**()](#g.getModel)
  - [g.**getReturnedType**()](#g.getReturnedType)
  - [g.**copy**()](#g.copy)
  - [g.**getEstimatedRange**()](#g.getEstimatedRange)

## Constructor

<a href="#Generator-cons" name="Generator-cons">></a> **Generator**(name)

## Static properties

<br><a href='#Generator.Operators' name='Generator.Operators'>&raquo;</a> Generator.**Operators** : `Object`

<br><a href='#Generator.Utils' name='Generator.Utils'>&raquo;</a> Generator.**Utils** : `Object`

<a href='#Generator.listOfGenerators' name='Generator.listOfGenerators'>&raquo;</a> Generator.**listOfGenerators** : `Object`

## Static methods

## Instance properties

<a href='#g.name' name='g.name'>&raquo;</a> g.**name** : `String`

O nome do gerador.

<br><a href='#g.operator' name='g.operator'>&raquo;</a> g.**operator** : `Object`

<br><a href='#g.order' name='g.order'>&raquo;</a> g.**order** : `Number`

<br><a href='#g.ID' name='g.ID'>&raquo;</a> g.**ID** : `String`
A chave de identificação do gerador.

<br><a href='#gen.parent' name='gen.parent'>&raquo;</a> gen.**parent** : `Object`

<br><a href='#g.accessOperator' name='g.accessOperator'>&raquo;</a> g.**accessOperator** : `String`

## Instance methods

<a href="#g.addGenerator" name='g.addGenerator'>&raquo;</a> g.**addGenerator**(gen)

<a href="#g.sumOrder" name='g.sumOrder'>&raquo;</a> g.**sumOrder**()

<a href="#g.unlink" name='g.unlink'>&raquo;</a> g.**unlink**()

<a href="#g.insertGenerator" name='g.insertGenerator'>&raquo;</a> g.**insertGenerator**(gen)

<a href="#g.insertGeneratorBefore" name='g.insertGeneratorBefore'>&raquo;</a> g.**insertGeneratorBefore**(gen)

<a href="#g.getRootGenerator" name='g.getRootGenerator'>&raquo;</a> g.**getRootGenerator**() : `Object`

<a href="#g.changeGenerator" name='g.changeGenerator'>&raquo;</a> g.**changeGenerator**(gen)

<a href="#g.removeLastGenerator" name='g.removeLastGenerator'>&raquo;</a> g.**removeLastGenerator**()

<a href="#g.getID" name='g.getID'>&raquo;</a> g.**getID**() : `String`

<a href="#g.getFullGenerator" name='g.getFullGenerator'>&raquo;</a> g.**getFullGenerator**(generators) : `Array`
Pega as referências de todos os Generators dentro do parâmetro de entrada (generators), de forma recursiva, alocando-as em uma lista

<a href="#g.generate" name='g.generate'>&raquo;</a> g.**generate**(sub_value) : `Object`
Recebe um valor que é inserido no operador juntamente com um segundo valor gerado pelo Generator inserido neste.
Caso não exista um operador, o valor inserido é somado ao valor gerado e retornado

<a href="#g.getGenParams" name='g.getGenParams'>&raquo;</a> g.**getGenParams**() : `Object`

<a href="#g.reset" name='g.reset'>&raquo;</a> g.**reset**()

<a href="#g.getModel" name='g.getModel'>&raquo;</a> g.**getModel**() : `Object`
Retorna o gerador com seus parâmetros para ser serializado pelo JSON.stringify().
Ou seja, sem funções e referências a outros objetos.
Este método deve ser sobreposto nas subclasses para persistência das variáveis específicas de cada subtipo de gerador.

<a href="#g.getReturnedType" name='g.getReturnedType'>&raquo;</a> g.**getReturnedType**() : `String`

<a href="#g.copy" name='g.copy'>&raquo;</a> g.**copy**()

<a href="#g.getEstimatedRange" name='g.getEstimatedRange'>&raquo;</a> g.**getEstimatedRange**()


