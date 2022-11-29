'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Reviews';
    return queryInterface.bulkInsert(options, [
      {
        spotId: 1,
        userId: 1,
        review: 'great view.',
        stars: 5
      },
      {
        spotId: 2,
        userId: 1,
        review: 'Awesome view.',
        stars: 5
      },
      {
        spotId: 3,
        userId: 2,
        review: 'Great location.',
        stars: 4
      },
      {
        spotId: 4,
        userId: 3,
        review: 'nice view.',
        stars: 5
      },
      {
        spotId: 5,
        userId: 4,
        review: 'recommend.',
        stars: 4
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3, 4, 5] }
    }, {});
  }
};
