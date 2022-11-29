'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Spots';
    return queryInterface.bulkInsert(options, [
      {
        ownerId: 1,
        address: '7469 bock ave',
        city: 'Stanton',
        state: 'California',
        country: 'USA',
        lat: 152.89024,
        lng: 35.12342,
        name: 'Home',
        description: '3Bed 2Bath',
        price: 350
      },
      {
        ownerId: 2,
        address: '1234 beach blvd',
        city: 'Stanton',
        state: 'California',
        country: 'USA',
        lat: 150.84392,
        lng: 32.23473,
        name: 'room',
        description: '1Bed 1Bath',
        price: 99
      },
      {
        ownerId: 3,
        address: '12801 brookhurst st',
        city: 'garden grove',
        state: 'California',
        country: 'USA',
        lat: 142.12398,
        lng: 30.23748,
        name: 'good location for single',
        description: '1Bed 1Bath',
        price: 100
      },
      {
        ownerId: 4,
        address: '123 cerritos St',
        city: 'cerritos',
        state: 'California',
        country: 'USA',
        lat: 146.98234,
        lng: 34.90174,
        name: 'family',
        description: '2Bed 1Bath',
        price: 290
      },
      {
        ownerId: 4,
        address: '122 cerritos st',
        city: 'cerritos',
        state: 'California',
        country: 'USA',
        lat: 146.12417,
        lng: 34.98234,
        name: 'apt',
        description: '1Bed 1Bath',
        price: 100
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      address: { [Op.in]: ['7469 bock ave', '1234 beach blvd', '12801 brookhurst st', '123 cerritos St', '122 cerritos st'] }
    }, {});
  }
};
