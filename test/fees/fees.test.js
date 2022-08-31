'use strict'

const { test } = require('tap')

const { getFees } = require('../../src/fees');

test('calculate fee amounts', async (t) => {
getFees(25);
getFees(100);
})