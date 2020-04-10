module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address_id: { type: DataTypes.INTEGER, allowNull: false },
    offchain_community_id: { type: DataTypes.STRING, allowNull: true },
    chain_id: { type: DataTypes.STRING, allowNull: true },
    permission: {
      type: DataTypes.ENUM,
      values: ['admin', 'moderator', 'member'],
      defaultValue: 'member',
      allowNull: false,
    },
  }, {
    underscored: true,
    indexes: [
      { fields: ['address_id'] },
      { fields: ['offchain_community_id'] },
      { fields: ['chain_id'] },
      { fields: ['address_id', 'chain_id'], unique: true },
      { fields: ['address_id', 'offchain_community_id'], unique: true },
    ],
    validate: {
      // roles should only have 1 of these properties
      eitherOffchainOrOnchain() {
        if (!(this.chain_id === undefined || this.offchain_community_id === undefined)) {
          throw new Error('Either chain_id or offchain_community_id!');
        }
        if (this.chain_id !== undefined && this.offchain_community_id !== undefined) {
          throw new Error('Either chain_id or offchain_community_id not both!');
        }
      }
    }
  });

  Role.associate = (models) => {
    models.Role.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.Role.belongsTo(models.OffchainCommunity, { foreignKey: 'offchain_community_id', targetKey: 'id' });
    models.Role.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return Role;
};
