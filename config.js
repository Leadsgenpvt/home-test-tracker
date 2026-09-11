module.exports = {
  admin: {
    username: process.env.ADMIN_USER || 'owner',
    password: process.env.ADMIN_PASSWORD || 'Falcon@Track92'
  },
  technician: {
    username: process.env.TECH_USER || 'technician',
    password: process.env.TECH_PASSWORD || 'Falcon@Route47'
  }
};
