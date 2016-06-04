'use strict';

const fs = require('fs');
const moment = require('moment');
const Excel = require('excel4node').Workbook;
const getExcelAlpha = require('excel4node').getExcelAlpha;
const router = require('express').Router();
const tmp = require('../config').tmp;

function saveImage(dataUrl) {
  const matches = dataUrl.match(/^data:.+\/(.+);base64,(.*)$/);
  const buffer = new Buffer(matches[2], 'base64');

  const savePath = `${tmp.path}image.png`;
  fs.writeFileSync(savePath, buffer);
  return savePath;
}

router.post('/', (req, res) => {
  const body = req.body;
  const image = saveImage(body.image);
  const header = JSON.parse(body.header);
  const data = JSON.parse(body.data);

  const book = new Excel({
    defaultFont: {
      size: 12,
      color: '000000'
    },
    dateFormat: 'dd.mm.yy'
  });

  const sheet = book.addWorksheet('Report');
  const style = book.createStyle({
    alignment: {
      wrapText: true,
      horizontal: 'center'
    }
  });

  sheet.column(1).setWidth(100);
  sheet.column(2).setWidth(40);
  sheet.column(3).setWidth(40);
  sheet.column(4).setWidth(40);

  sheet.cell(21, 1).string(header[0]).style(style);
  sheet.cell(21, 2).string(header[1][0]).style(style);
  sheet.cell(21, 3).string(header[1][1]).style(style);
  sheet.cell(21, 4).string(header[1][2]).style(style);

  for (let i = 22; i < data.length + 22; i++) {
    sheet.cell(i, 1).date(moment(data[i - 22][0], 'LL').toDate()).style(style);
    sheet.cell(i, 2).number(data[i - 22][1][0]).style(style);
    sheet.cell(i, 3).number(data[i - 22][1][1]).style(style);
    sheet.cell(i, 4)
      .formula(`(${getExcelAlpha(2)}${i} + ${getExcelAlpha(3)}${i}) / 2`)
      .style(style);
  }

  sheet.addImage({
    path: image,
    type: 'picture',
    position: {
      type: 'oneCellAnchor',
      from: {
        col: 1,
        colOff: 0,
        row: 1,
        rowOff: '0.5cm'
      }
    }
  });

  book.write('report.xlsx', res);
});

module.exports = router;
