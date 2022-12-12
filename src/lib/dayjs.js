const dayjs = require('dayjs');
const utc  = require('dayjs/plugin/utc');
const minMax  = require('dayjs/plugin/minMax');
const relativeTime = require('dayjs/plugin/relativeTime');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(utc)
dayjs.extend(minMax)
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)

module.exports = dayjs