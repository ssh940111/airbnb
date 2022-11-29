'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'ReviewImages';
    return queryInterface.bulkInsert(options, [
      {
        reviewId: 1,
        url: 'niceview.url'
      },
      {
        reviewId: 2,
        url: 'awesomeloaction.url'
      },
      {
        reviewId: 3,
        url: 'goodspot.url'
      },
      {
        reviewId: 4,
        url: 'lowbudget.url'
      },
      {
        reviewId: 5,
        url: 'oceanarea.url'
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'ReviewImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      reviewId: { [Op.in]: [1, 2, 3, 4, 5] }
    }, {});
  }
};
