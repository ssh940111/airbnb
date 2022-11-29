'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Bookings';
    return queryInterface.bulkInsert(options, [
      {
        spotId: 2,
        userId: 1,
        startDate: new Date(2022, 10, 25),
        endDate: new Date(2022, 10, 29)
      },
      {
        spotId: 3,
        userId: 2,
        startDate: new Date(2022, 11, 2),
        endDate: new Date(2022, 11, 4)
      },
      {
        spotId: 4,
        userId: 3,
        startDate: new Date(2022, 11, 13),
        endDate: new Date(2022, 11, 15)
      },
      {
        spotId: 5,
        userId: 4,
        startDate: new Date(2022, 11, 17),
        endDate: new Date(2022, 11, 19)
      },
      {
        spotId: 1,
        userId: 4,
        startDate: new Date(2022, 11, 22),
        endDate: new Date(2022, 11, 24)
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3, 4, 5] }
    }, {});
  }
};
