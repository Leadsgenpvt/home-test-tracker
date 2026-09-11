module.exports = {
  admin: {
    username: process.env.ADMIN_USER || 'owner',
    password: process.env.ADMIN_PASSWORD || 'changeme123'
  },
  technician: {
    username: process.env.TECH_USER || 'technician',
    password: process.env.TECH_PASSWORD || 'changeme123'
  }
};
