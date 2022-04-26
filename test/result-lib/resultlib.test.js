'use strict'

const { test } = require('tap')

const resultLib = require('../../src/result_lib');

test('capatalize names', async (t) => {
  let name = 'foo Barred';
  let result = resultLib.capitalizeName(name);
  t.equal(result, 'Foo Barred');
})

test('capatalize names 3', async (t) => {
    let name = 'foo arred';
    let result = resultLib.capitalizeName(name);
    t.equal(result, 'Foo Arred');
  })
  

test('capatalize names o\'malley ', async (t) => {
    let name = "foo o'malley";
    let result = resultLib.capitalizeName(name);
    console.log(result)
    t.equal(result, "Foo O'Malley");
  })

  test('capatalize dashed names', async (t) => {
    let name = "foo matt-bose";
    let result = resultLib.capitalizeName(name);
    console.log(result)
    t.equal(result, "Foo Matt-Bose");
  })