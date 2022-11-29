'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    return queryInterface.bulkInsert(options, [
      {
        email: 'demo@user.io',
        username: 'dave-song',
        hashedPassword: bcrypt.hashSync('password'),
        firstName: 'dave',
        lastName: 'song'
      },
      {
        email: 'demo1@user.io',
        username: 'User1',
        hashedPassword: bcrypt.hashSync('password2'),
        firstName: 'demo',
        lastName: 'user'
      },
      {
        email: 'user2@user.io',
        username: 'User2',
        hashedPassword: bcrypt.hashSync('password3'),
        firstName: 'Thomas',
        lastName: 'Lee'
      },
      {
        email: "user3@user.io",
        username: "User3",
        firstName: "Jane",
        lastName: "Kim",
        hashedPassword: bcrypt.hashSync("password4")
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['dave-song', 'User1', 'User2', 'User3'] }
    }, {});
  }
};
