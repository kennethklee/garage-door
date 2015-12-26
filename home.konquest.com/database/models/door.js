var unidecode = require('unidecode')

module.exports = function (sequelize, DataTypes) {
  var Door = sequelize.define('Door', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING, allowNull: false, validate: {notEmpty: true} },
    slug: { type: DataTypes.STRING, unique: true, validate: {notEmpty: true} },
    isOpen: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    table_name: 'Doors',
    timestamps: true,

    instanceMethods: {
      slugify: function () {
        return unidecode(this.name).trim().toLowerCase().replace(/\W+/g, '-').replace(/^-|-$/g, '')
      },

      toJson: function () {
        return {
          id: this.id,
          name: this.name,
          slug: this.slug,
          isOpen: this.isOpen
        }
      }
    },

    hooks: {
      beforeValidate: function (instance, options, done) {
        if (instance.isNewRecord || instance.changed('name')) {
          instance.slug = instance.slugify()
        }

        done(null, instance)
      }
    }
  })

  return Door
}
