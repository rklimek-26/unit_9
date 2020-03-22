'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
  Course.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: Sequelize.INTEGER,
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
					notNull: {
						msg: 'Please provide a "course title"'
					},
					notEmpty: {
						msg: 'Please provide a "course"'
					}
				}
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
					notNull: {
						msg: 'Please provide a "course description"'
					},
					notEmpty: {
						msg: 'Please provide a "course"'
					}
				}
    },
    estimatedTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    materialsNeeded: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, { sequelize });

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false,
      },
    });
  };

  return Course;
};
