'use strict'

const { test } = require('tap')

const { getFees } = require('../../src/fees');

test('calculate fee amounts', async (t) => {
console.dir(getFees(25));
console.dir(getFees(55));
getFees(100);
})